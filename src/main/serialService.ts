import { BrowserWindow, ipcMain } from 'electron';
import { SerialPort } from 'serialport';
import { OpenOptions, PortStatus, SetOptions } from '@serialport/bindings-interface';

import { Parity } from '@/model/Settings/PortSettings/PortSettings';
import { log } from './Logging';

const RX_DATA_BATCH_TIMEOUT_MS = 50;

const PORT_OPEN_TIMEOUT_MS = 5*1000;

/**
 * Stores a mapping of port path to the serial port object for all currently open serial ports. NinjaTerm only supports one serial port at a time at the moment, but we may want to support multiple in the future.
 */
const activeSerialPorts = new Map<string, SerialPort>();

/**
 * Key is the port path, value is an array of buffers that have been received from the port but yet to be sent to the renderer.
 */
const dataBatches = new Map<string, Buffer[]>();

/**
 * Key is the port path, value is a timeout that will be cleared when the data is sent to the renderer.
 */
const batchTimeouts = new Map<string, NodeJS.Timeout>();

function sendBatchedData(portPath: string, mainWindow: BrowserWindow | null) {
  const batch = dataBatches.get(portPath);
  if (batch && batch.length > 0) {
    const combinedBuffer = Buffer.concat(batch);
    mainWindow?.webContents.send('serial:data-received', portPath, combinedBuffer);

    dataBatches.set(portPath, []);
  }
}

/**
 * Registers all serial-related IPC handlers such as list-ports, open-port, close-port, etc.
 *
 * @param mainWindow The main window of the application.
 */
export function initializeSerialHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle('serial:list-ports', async () => {
    try {
      const ports = await SerialPort.list();
      return { success: true, ports };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('serial:open-port', async (event, options: OpenOptions) => {
    log.info('serial:open-port called. options: ', options);
    const portPath = options.path;
    try {
      if (activeSerialPorts.has(options.path)) {
        return { success: false, error: 'Port already open' };
      }

      // See node_modules/@serialport/bindings-interface/dist/index.d.ts for the options.
      const port = new SerialPort({
        path: portPath,
        baudRate: options.baudRate || 115200,
        dataBits: options.dataBits || 8,
        parity: options.parity as Parity || undefined,
        stopBits: options.stopBits || 1,
        rtscts: options.rtscts || false,
        xon: options.xon || false,
        xoff: options.xoff || false,
        xany: options.xany || false,
        hupcl: options.hupcl || true,
        autoOpen: false,
        highWaterMark: 1024,
      });

      // If promise is rejected this will throw, and be caught below
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const timeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error('Timeout while opening serial port. Waited for ' + (PORT_OPEN_TIMEOUT_MS/1000) + ' s.'));
          }
        }, PORT_OPEN_TIMEOUT_MS);

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

      dataBatches.set(portPath, []);

      port.on('data', (data: Buffer) => {
        const batch = dataBatches.get(portPath);
        if (batch) {
          const isFirstChar = batch.length === 0;
          batch.push(data);

          if (isFirstChar) {
            const timeout = setTimeout(() => {
              sendBatchedData(portPath, mainWindow);
              batchTimeouts.delete(portPath);
            }, RX_DATA_BATCH_TIMEOUT_MS);
            batchTimeouts.set(portPath, timeout);
          }
        }
      });

      port.on('error', (error: Error) => {
        mainWindow?.webContents.send('serial:error', portPath, error.message);
      });

      port.on('close', () => {
        sendBatchedData(portPath, mainWindow);

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

  ipcMain.handle('serial:set-flow-control-signals', async (event, portPath: string, setOptions: {
    dtr: boolean;
    dsr: boolean;
    rts: boolean;
    cts: boolean;
  }) => {
    log.info('serial:set-flow-control-signals called. portPath=', portPath, 'setOptions=', setOptions);
    try {
      const port = activeSerialPorts.get(portPath);
      if (!port) {
        return { success: false, error: 'Port not found' };
      }

      await new Promise<void>((resolve, reject) => {
        // Pass the setOptions to the port.set method.
        // set() is not well documented by node-serialport
        log.info('Setting flow control signals. Calling port.set() with options: ', setOptions);
        port.set(setOptions, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      return { success: true };
    } catch (error) {
      console.error('Error setting flow control signals: ', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('serial:get-flow-control-signals', async (event, portPath: string) => {
    try {
      const port = activeSerialPorts.get(portPath);
      if (!port) {
        return { success: false, error: 'Port not found' };
      }

      const readableFlowControlSignals = await new Promise<PortStatus>((resolve, reject) => {
        port.get((err, options) => {
          if (err) {
            reject(err);
          } else {
            resolve(options!);
          }
        });
      });
        return { success: true, signals: readableFlowControlSignals };
      } catch (error) {
        console.error('Error getting flow control signals: ', error);
        return { success: false, error: (error as Error).message };
      }
  });
}

/**
 * Returns the path of the first currently open serial port, or null if none are open.
 * Used by the MCP service to know where to write data.
 */
export function getActivePortPath(): string | null {
  for (const [portPath] of activeSerialPorts) {
    return portPath;
  }
  return null;
}

/**
 * Write bytes to an open serial port. Used by the MCP service.
 */
export function writeToPort(portPath: string, data: number[]): Promise<void> {
  const port = activeSerialPorts.get(portPath);
  if (!port) return Promise.reject(new Error(`Port not open: ${portPath}`));
  return new Promise((resolve, reject) => {
    port.write(Buffer.from(data), (err) => {
      if (err) reject(err); else resolve();
    });
  });
}

/**
 * List available serial ports. Used by the MCP service.
 */
export function listPorts() {
  return SerialPort.list();
}

export function cleanupSerialPorts() {
  for (const [portPath, port] of activeSerialPorts) {
    try {
      port.close();
    } catch (error) {
      console.error(`Error closing port ${portPath}:`, error);
    }
  }

  for (const timeout of batchTimeouts.values()) {
    clearTimeout(timeout);
  }
  batchTimeouts.clear();
  dataBatches.clear();

  activeSerialPorts.clear();
}
