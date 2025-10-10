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

// Looks to be a module issue with Electron here, import as single package and destructure manually
import nodeMachineIdPkg from 'node-machine-id';

import Analytics from 'electron-google-analytics4';

// Initialize Google Analytics 4
// Secret key is created in Google Analytics web console, see https://www.npmjs.com/package/electron-google-analytics4#secretkey-issuance-guide for more information.
let analytics: Analytics | null = null;

// The electron-google-analytics4 package uses the machineId automatically if we don't provide it as the clientID. However, let's do it manually as it's useful for debugging and for future uses.
// Using the machineId as the clientID is appropriate to distinguish "users" in analytics.
const usersMachineId = nodeMachineIdPkg.machineIdSync();
console.log('Machine ID: ', usersMachineId);

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

// Initialize Bluetooth service (will be updated with mainWindow after createWindow)
let bluetoothService: any;

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

  createWindow();

  // Initialize serial handlers
  initializeSerialHandlers(mainWindow);

  // Initialize socket handlers
  initializeSocketHandlers(mainWindow);

  // Initialize Bluetooth service with mainWindow (only if not in CI environment)
  const isCI = process.env.CI || process.env.NODE_ENV === 'test';
  if (!isCI) {
    try {
      // require didn't work here, so using import instead
      const { MainBluetoothService } = await import('./MainBluetoothService');
      bluetoothService = new MainBluetoothService(mainWindow);
    } catch (error) {
      console.error('Failed to load Bluetooth service:', error);
    }
  } else {
    console.log('Detected CI environment. Bluetooth service not loaded.');
  }

  installExtension(REACT_DEVELOPER_TOOLS, { loadExtensionOptions: { allowFileAccess: true } })
    .then((ext) => console.log(`Added Extension:  ${ext.name}`))
    .catch((err) => console.log('An error occurred: ', err));

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
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
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

ipcMain.handle('fs:write-file', async (event, filePath: string, data: number[], append: boolean = true) => {
  try {
    const buffer = Buffer.from(data);

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

ipcMain.handle('fs:file-exists', async (event, filePath: string) => {
  try {
    await fs.access(filePath);
    return { success: true, exists: true };
  } catch (error) {
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

// Clean up on app quit
app.on('before-quit', () => {
  cleanupSerialPorts();
  cleanupSockets();
});
