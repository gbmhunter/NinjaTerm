import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { SerialPort } from 'serialport';
import * as fs from 'fs/promises';

// Keep a global reference of the window object
let mainWindow: BrowserWindow;

function createWindow(): void {
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
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null as any;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

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

// Serial port management
const activeSerialPorts = new Map<string, SerialPort>();

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
      autoOpen: false
    });

    await new Promise<void>((resolve, reject) => {
      port.open((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Set up data handlers
    port.on('data', (data: Buffer) => {
      mainWindow?.webContents.send('serial:data-received', portPath, Array.from(data));
    });

    port.on('error', (error: Error) => {
      mainWindow?.webContents.send('serial:error', portPath, error.message);
    });

    port.on('close', () => {
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

    activeSerialPorts.delete(portPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
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
  activeSerialPorts.clear();
});