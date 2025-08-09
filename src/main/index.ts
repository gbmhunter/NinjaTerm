import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import log from 'electron-log';
import * as path from 'path';
import { SerialPort } from 'serialport';
import * as fs from 'fs/promises';

const RX_DATA_BATCH_MAX_NUM_OF_CHUNKS = 50;
const RX_DATA_BATCH_MAX_SIZE_BYTES = 1024;

// Set maximum delay to 50ms for any received char before sending to renderer
const RX_DATA_BATCH_TIMEOUT_MS = 50;

// Configure auto-updater logging
autoUpdater.logger = log;
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
app.whenReady().then(() => {
  createWindow();

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

// Hold all active serial ports. The key is the port path which should be unique.
const activeSerialPorts = new Map<string, SerialPort>();

// Data batching for high-performance serial communication
const dataBatches = new Map<string, Buffer[]>();
const batchTimeouts = new Map<string, NodeJS.Timeout>();

function sendBatchedData(portPath: string) {
  const batch = dataBatches.get(portPath);
  if (batch && batch.length > 0) {
    // Concatenate all buffers in the batch
    const combinedBuffer = Buffer.concat(batch);
    mainWindow?.webContents.send('serial:data-received', portPath, combinedBuffer);

    // Clear the batch
    dataBatches.set(portPath, []);
  }
}

// IPC handlers for serial port operations
ipcMain.handle('serial:list-ports', async () => {
  try {
    const ports = await SerialPort.list();
    return { success: true, ports };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('serial:open-port', async (event, portPath: string, options: any) => {
  console.log('serial:open-port called. portPath: ', portPath, ' options: ', options);
  try {
    if (activeSerialPorts.has(portPath)) {
      return { success: false, error: 'Port already open' };
    }

    const port = new SerialPort({
      path: portPath,
      baudRate: options.baudRate || 115200,
      dataBits: options.dataBits || 8,
      parity: options.parity || 'none',
      stopBits: options.stopBits || 1,
      autoOpen: false,
      // Sets the size of the read and write buffers. Defaults to 64k, which causes lag problems if NinjaTerm UI cannot keep up (buffer starts filling up
      // and NinjaTerms starts "receiving" data from a long time in the past, this is confusing to the user).
      highWaterMark: 1024,
    });

    // I have seen the port.open() callback not get called in some cases, so add a timeout here so
    // the app does not hang indefinitely.
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Timeout while opening serial port'));
        }
      }, 5*1000); // 5 seconds timeout

      port.open((err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      });
    });

    // Initialize batching for this port
    dataBatches.set(portPath, []);

    // Set up data handlers with batching for high performance
    port.on('data', (data: Buffer) => {
      // Add data to batch
      const batch = dataBatches.get(portPath);
      if (batch) {
        const isFirstChar = batch.length === 0;
        batch.push(data);

        // If this is the first character in a new batch, start the 20ms timer
        if (isFirstChar) {
          // Start timer for 20ms after receiving the first char
          const timeout = setTimeout(() => {
            sendBatchedData(portPath);
            batchTimeouts.delete(portPath);
          }, RX_DATA_BATCH_TIMEOUT_MS);
          batchTimeouts.set(portPath, timeout);
        } else {
          // For subsequent chars, check if batch is getting too large
          if (batch.length >= RX_DATA_BATCH_MAX_NUM_OF_CHUNKS || Buffer.concat(batch).length >= RX_DATA_BATCH_MAX_SIZE_BYTES) {
            // Clear the existing timeout and send large batches immediately
            const existingTimeout = batchTimeouts.get(portPath);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
              batchTimeouts.delete(portPath);
            }
            sendBatchedData(portPath);
          }
          // Otherwise, just accumulate data and let the timer handle it
        }
      }
    });

    port.on('error', (error: Error) => {
      mainWindow?.webContents.send('serial:error', portPath, error.message);
    });

    port.on('close', () => {
      // Send any remaining batched data before closing
      sendBatchedData(portPath);

      // Clean up batching data
      const timeout = batchTimeouts.get(portPath);
      if (timeout) {
        clearTimeout(timeout);
        batchTimeouts.delete(portPath);
      }
      dataBatches.delete(portPath);

      activeSerialPorts.delete(portPath);
      mainWindow?.webContents.send('serial:port-closed', portPath);
    });

    activeSerialPorts.set(portPath, port);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('serial:close-port', async (event, portPath: string) => {
  try {
    const port = activeSerialPorts.get(portPath);
    if (!port) {
      return { success: false, error: 'Port not found' };
    }

    await new Promise<void>((resolve, reject) => {
      port.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Clean up batching data (this will also happen in port.on('close') but being safe)
    const timeout = batchTimeouts.get(portPath);
    if (timeout) {
      clearTimeout(timeout);
      batchTimeouts.delete(portPath);
    }
    dataBatches.delete(portPath);

    activeSerialPorts.delete(portPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('serial:close-all-ports', async () => {
  for (const [portPath, port] of activeSerialPorts) {
    await port.close();
  }

  // Clean up all batching data
  for (const timeout of batchTimeouts.values()) {
    clearTimeout(timeout);
  }
  batchTimeouts.clear();
  dataBatches.clear();

  activeSerialPorts.clear();
});

ipcMain.handle('serial:write-data', async (event, portPath: string, data: number[]) => {
  try {
    const port = activeSerialPorts.get(portPath);
    if (!port) {
      return { success: false, error: 'Port not found' };
    }

    const buffer = Buffer.from(data);
    await new Promise<void>((resolve, reject) => {
      port.write(buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
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

// Clean up on app quit
app.on('before-quit', () => {
  // Close all active serial ports
  for (const [portPath, port] of activeSerialPorts) {
    try {
      port.close();
    } catch (error) {
      console.error(`Error closing port ${portPath}:`, error);
    }
  }

  // Clean up all batching data
  for (const timeout of batchTimeouts.values()) {
    clearTimeout(timeout);
  }
  batchTimeouts.clear();
  dataBatches.clear();

  activeSerialPorts.clear();
});
