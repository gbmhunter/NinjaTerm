import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import mainLogger from 'electron-log/main.js';

import { initLogging, log } from './Logging';
import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { initializeSerialHandlers, cleanupSerialPorts } from './serialService';
import { initializeSocketHandlers, cleanupSockets } from './socketService';
import { initializeRttHandlers, cleanupRtt } from './rttService';
import { McpService } from './mcpService';

// Looks to be a module issue with Electron here, import as single package and destructure manually
import nodeMachineIdPkg from 'node-machine-id';

import Analytics from 'electron-google-analytics4';

// Initialize Google Analytics 4
// Secret key is created in Google Analytics web console, see https://www.npmjs.com/package/electron-google-analytics4#secretkey-issuance-guide for more information.
let analytics: Analytics | null = null;

// The electron-google-analytics4 package uses the machineId automatically if we don't provide it as the clientID. However, let's do it manually as it's useful for debugging and for future uses.
// Using the machineId as the clientID is appropriate to distinguish "users" in analytics.
const usersMachineId = nodeMachineIdPkg.machineIdSync();
log.info('Machine ID: ', usersMachineId);
log.info(`Electron version: v${process.versions.electron}`);

// Only initialize Google Analytics 4 in production
if (app.isPackaged) {
  console.log('Initializing Google Analytics 4 in production');
  analytics = new Analytics(
    'G-SDMMGN71FN',
    '8fOMUz9KRsaqiRtJdA0tYQ',
    usersMachineId
    );
    // Setting the engagement time means that users will shows up in the Google Analytics console
    // in the real time section
    analytics.set('engagement_time_msec', 1000);
    // This sets the page title in the Google Analytics console.
    // TODO: Change this as users move around the app
    analytics.set('page_title', 'app://home');
} else {
  console.log('Detected dev. environment, not initializing Google Analytics.');
}

// Catch unhandled rejections / uncaught exceptions so the failure makes it
// into the log file instead of dying silently. Without these handlers an
// unhandled async rejection during startup (e.g. RTT FFI init, Bluetooth
// adapter probing) leaves the renderer talking to a half-initialised main
// process with no diagnostic trail.
process.on('uncaughtException', (err, origin) => {
  log.error('uncaughtException origin=', origin, ' err=', err);
});
process.on('unhandledRejection', (reason, promise) => {
  log.error('unhandledRejection promise=', promise, ' reason=', reason);
});

// Note: result = await ... status always seems to be 204 even if I use an invalid secret key, so
// we can't use that to check if the event was sent successfully.
emitEventIfInProd('app_start');

/**
 * Send an event to Google Analytics 4 if in production.
 * Does nothing in development, so prevent spamming GA with events -- for example the unit tests/Playwright e2e tests would create many false events if allowed in development.
 * @param event
 */
function emitEventIfInProd(event: string) {
  if (app.isPackaged) {
    analytics?.event(event);
  }
}

// Configure auto-updater logging
autoUpdater.logger = mainLogger;
(autoUpdater.logger as any).transports.file.level = 'info';

// Configure auto-updater to always check the latest release
autoUpdater.channel = 'latest';
autoUpdater.allowPrerelease = false;
autoUpdater.allowDowngrade = false;

// Explicitly set the GitHub repository for updates
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'gbmhunter',
    repo: 'NinjaTerm',
    private: false
  });
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
  log.info(`Current version: ${app.getVersion()}`);
  log.info(`Update channel: ${autoUpdater.channel}`);
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available.');
  log.info(`Available version: ${info.version}`);
  log.info(`Current version: ${app.getVersion()}`);
  mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.');
  log.info(`Current version: ${app.getVersion()}`);
  log.info(`Latest version: ${info.version}`);
  mainWindow?.webContents.send('update-not-available', info);
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater. ' + err);
  mainWindow?.webContents.send('update-error', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.info(log_message);
  mainWindow?.webContents.send('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded');
  mainWindow?.webContents.send('update-downloaded', info);
});

// Bluetooth service registers its IPC handlers in the constructor; we don't
// keep a reference because nothing else in this file calls it back.

let mcpService: McpService | null = null;

// Keep a global reference of the window object
let mainWindow: BrowserWindow;

function createWindow(): void {
  // Remove the default menu. No top menu bar is needed.
  Menu.setApplicationMenu(null);

  // Create the browser window
  mainWindow = new BrowserWindow({
    height: 900,
    width: 1400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
    icon: path.join(__dirname, '../../img/logo/v3/icon-256x256.png')
  });

  // Maximize the window (by default it starts of at a small size)
  mainWindow.maximize();

  // Nothing in NinjaTerm should open a window *inside* the app. Electron's
  // default is to create one that inherits this window's webPreferences —
  // including the preload — which would put `window.electronAPI` (arbitrary
  // file writes, serial control, the MCP server) in front of whatever site was
  // linked.
  //
  // The one `target="_blank"` link left in the UI is the Moment.js format docs
  // in RX Settings; everything else already goes through `shell.openExternal`.
  // This handler is kept as the categorical guard, so a link added later — or
  // one rendered by a dependency, as the Ko-fi button used to be — can't open
  // a privileged window by default.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      log.warn('Blocked window.open for an unparseable URL: ', url);
      return { action: 'deny' };
    }
    // Only hand http(s) to the OS. `shell.openExternal` will happily launch a
    // `file://` or `smb://` URL with the system's default handler.
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      shell.openExternal(url).catch((err) => {
        log.error('Failed to open external URL: ', url, ' err=', err);
      });
    } else {
      log.warn('Blocked window.open for a non-http(s) URL: ', url);
    }
    return { action: 'deny' };
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null as any;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {

  // Initialize the logger to be available in renderer process
  initLogging();

  log.info('Main process started.');

  // Uncomment this if we want to retry applying CSP correctly
  // Apply Content Security Policy (CSP)
  // session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  //   callback({
  //     responseHeaders: {
  //       ...details.responseHeaders,
  //       'Content-Security-Policy': [
  //         "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://accounts.google.com https://*.gstatic.com; img-src 'self' data: https://*.gstatic.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://accounts.google.com https://www.googleapis.com; frame-src https://accounts.google.com;"
  //       ],
  //     },
  //   });
  // });

  createWindow();

  // Initialize serial handlers
  initializeSerialHandlers(mainWindow);

  // Initialize socket handlers
  initializeSocketHandlers(mainWindow);

  // Initialize Segger RTT handlers
  initializeRttHandlers(mainWindow);

  // Initialize MCP service
  mcpService = new McpService(mainWindow);

  // Initialize Bluetooth service with mainWindow (only if not in CI environment)
  const isCI = process.env.CI || process.env.NODE_ENV === 'test';
  if (!isCI) {
    try {
      // require didn't work here, so using import instead
      const { MainBluetoothService } = await import('./MainBluetoothService');
      // Constructor registers its IPC handlers via side effects; no need to retain a reference.
      new MainBluetoothService(mainWindow);
    } catch (error) {
      console.error('Failed to load Bluetooth service:', error);
    }
  } else {
    console.log('Detected CI environment. Bluetooth service not loaded.');
  }

  // Development only. This used to run unconditionally, so every launch of a
  // packaged build fetched an extension from Google's CDN and installed it into
  // the app with file access — a startup network round-trip, a phone-home, and
  // a supply-chain dependency, none of which a shipped build should have.
  if (!app.isPackaged) {
    installExtension(REACT_DEVELOPER_TOOLS, { loadExtensionOptions: { allowFileAccess: true } })
      .then((ext) => console.log(`Added Extension:  ${ext.name}`))
      .catch((err) => console.log('An error occurred: ', err));
  }

  // Start auto-updater after app is ready and window is created
  // Only check for updates in production builds
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    // Check for updates 5 seconds after startup, but only if auto-updates are enabled
    setTimeout(async () => {
      try {
        const autoUpdatesResult = await mainWindow?.webContents.executeJavaScript(`
          (() => {
            try {
              const appDataJson = localStorage.getItem('appData');
              if (!appDataJson) return true; // Default to enabled
              const appData = JSON.parse(appDataJson);
              return appData.autoUpdatesEnabled ?? true;
            } catch (error) {
              return true; // Default to enabled on error
            }
          })()
        `);

        if (autoUpdatesResult) {
          log.info('Auto-updates enabled, checking for updates...');
          autoUpdater.checkForUpdatesAndNotify();
        } else {
          log.info('Auto-updates disabled, skipping update check.');
        }
      } catch (error) {
        log.error('Failed to check auto-updates setting, defaulting to enabled:', error);
        autoUpdater.checkForUpdatesAndNotify();
      }
    }, 5000);
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // The Electron docs have this follow example:
  //==============================================================
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
  //==============================================================
  // However, I saw an issue on macOS where if you clicked the "X" to close the NinjaTerm window (i.e. close the window but don't quit the app), and then re-opened NinjaTerm, the IPC between main and renderer processes would be broken.
  // So let's quit the app if all windows are closed on all platforms.
  app.quit();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// File system operations for logging
ipcMain.handle('fs:select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    return { success: true, path: result.filePaths[0] };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// `data` arrives as a Uint8Array: structured clone carries typed arrays
// natively, whereas the number[] this used to take cost a per-byte boxed
// value on the way across for every log write.
ipcMain.handle('fs:write-file', async (event, filePath: string, data: Uint8Array, append: boolean = true) => {
  try {
    const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);

    if (append) {
      await fs.appendFile(filePath, buffer);
    } else {
      await fs.writeFile(filePath, buffer);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:get-file-size', async (event, filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return { success: true, size: stats.size };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:file-exists', async (_event, filePath: string) => {
  try {
    await fs.access(filePath);
    return { success: true, exists: true };
  } catch {
    return { success: true, exists: false };
  }
});

ipcMain.handle('fs:get-default-log-directory', async () => {
  try {
    const homeDir = os.homedir();
    const defaultLogDir = path.join(homeDir, 'NinjaTerm', 'logs');

    // Ensure the directory exists
    await fs.mkdir(defaultLogDir, { recursive: true });

    return { success: true, path: defaultLogDir };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Auto-updater IPC handlers
ipcMain.handle('updater:check-for-updates', async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      return { success: false, error: 'Updates not available in development mode' };
    }

    log.info('Manual update check initiated');
    log.info(`Current app version: ${app.getVersion()}`);
    log.info(`Update channel: ${autoUpdater.channel}`);
    log.info(`Feed URL: ${JSON.stringify(autoUpdater.getFeedURL())}`);

    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (error) {
    log.error(`Manual update check failed: ${(error as Error).message}`);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('updater:quit-and-install', async () => {
  try {
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('updater:get-auto-updates-enabled', async () => {
  // The "auto-updates enabled" setting is stored in the app data which is handled by the renderer process.
  // This IPC handler is used to get the setting from the renderer process.
  try {
    const result = await mainWindow?.webContents.executeJavaScript(`
      (() => {
        try {
          const appDataJson = localStorage.getItem('appData');
          if (!appDataJson) return true; // Default to enabled
          const appData = JSON.parse(appDataJson);
          return appData.autoUpdatesEnabled ?? true;
        } catch (error) {
          return true; // Default to enabled on error
        }
      })()
    `);
    return { success: true, enabled: result };
  } catch (error) {
    return { success: false, error: (error as Error).message, enabled: true };
  }
});

ipcMain.handle('shell:open-external', async (event, url: string) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Dev tools IPC handlers
ipcMain.handle('devtools:open', async () => {
  try {
    if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.openDevTools();
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('devtools:close', async () => {
  try {
    if (mainWindow && mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('devtools:toggle', async () => {
  try {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
        return { success: true, action: 'closed' };
      } else {
        mainWindow.webContents.openDevTools();
        return { success: true, action: 'opened' };
      }
    }
    return { success: false, error: 'Main window not available' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('devtools:is-open', async () => {
  try {
    if (mainWindow) {
      return { success: true, isOpen: mainWindow.webContents.isDevToolsOpened() };
    }
    return { success: false, error: 'Main window not available' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('analytics:event', async (event, eventName: string) => {
  try {
    emitEventIfInProd(eventName);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// MCP server IPC handlers
ipcMain.handle('mcp:start', async (event, port: number) => {
  try {
    await mcpService?.start(port);
    return { success: true };
  } catch (error) {
    log.error('Failed to start MCP server:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('mcp:stop', async () => {
  try {
    await mcpService?.stop();
    return { success: true };
  } catch (error) {
    log.error('Failed to stop MCP server:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('mcp:get-status', async () => {
  return {
    success: true,
    running: mcpService?.isRunning ?? false,
  };
});

// Bridge: renderer sends a response to a pending MCP renderer-request
ipcMain.handle('mcp:response', (event, { id, data, error }: { id: string; data: any; error?: string }) => {
  mcpService?.handleRendererResponse(id, data, error);
});

// Bridge: renderer pushes new RX data for streaming resource subscribers
ipcMain.on('mcp:rx-data', (_event, text: string) => {
  mcpService?.handleRxData(text);
});

// Clean up on app quit
app.on('before-quit', async () => {
  await mcpService?.stop();
  cleanupSerialPorts();
  cleanupSockets();
  cleanupRtt();
});
