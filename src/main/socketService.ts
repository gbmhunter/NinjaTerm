import { BrowserWindow, ipcMain } from 'electron';
import * as net from 'net';

const RX_DATA_BATCH_TIMEOUT_MS = 50;

/**
 * How long to wait for a socket to connect before timing out.
 */
const SOCKET_CONNECT_TIMEOUT_MS = 2 * 1000;

/**
 * Stores a mapping of socket connection identifier to the socket object for all currently open socket connections.
 */
const activeSockets = new Map<string, net.Socket>();

/**
 * Key is the socket connection identifier, value is an array of buffers that have been received from the socket but yet to be sent to the renderer.
 */
const dataBatches = new Map<string, Buffer[]>();

/**
 * Key is the socket connection identifier, value is a timeout that will be cleared when the data is sent to the renderer.
 */
const batchTimeouts = new Map<string, NodeJS.Timeout>();

function sendBatchedData(connectionId: string, mainWindow: BrowserWindow | null) {
  const batch = dataBatches.get(connectionId);
  if (batch && batch.length > 0) {
    const combinedBuffer = Buffer.concat(batch);
    mainWindow?.webContents.send('socket:data-received', connectionId, combinedBuffer);

    dataBatches.set(connectionId, []);
  }
}

/**
 * Registers all socket-related IPC handlers such as connect-socket, disconnect-socket, etc.
 *
 * @param mainWindow The main window of the application.
 */
export function initializeSocketHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle('socket:connect', async (event, options: { host: string; port: number }) => {
    console.log('socket:connect called. options: ', options);
    const connectionId = `${options.host}:${options.port}`;
    let socket: net.Socket | undefined;

    try {
      if (activeSockets.has(connectionId)) {
        return { success: false, error: 'Socket already connected' };
      }

      socket = new net.Socket();
      socket.setTimeout(SOCKET_CONNECT_TIMEOUT_MS);

      // One problem with sockets is that if you just pull out the ethernet cable after the connection is established,
      // nothing will detect it is broken.
      // Setting a keep alive timeout will detect this so we can alert the user.
      socket.setKeepAlive(true, 1000);

      // Set up a global error handler for this socket to prevent uncaught exceptions
      socket.on('error', (error: Error) => {
        console.error(`Socket error during setup: ${error.message}`);
        // This will be overridden later with a more specific handler
      });

      // At this point socket is guaranteed to be defined
      const socketRef = socket;

      // Setup connection promise
      await new Promise<void>((resolve, reject) => {
        let settled = false;

        const cleanup = () => {
          socketRef.removeAllListeners('connect');
          socketRef.removeAllListeners('error');
          socketRef.removeAllListeners('timeout');
          // Don't remove the global error handler we set up above
        };

        const timeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            cleanup();
            if (!socketRef.destroyed) {
              socketRef.destroy();
            }
            reject(new Error(`Timeout while connecting to socket ${connectionId}. Waited for ${SOCKET_CONNECT_TIMEOUT_MS / 1000} s.`));
          }
        }, SOCKET_CONNECT_TIMEOUT_MS);

        socketRef.on('connect', () => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            // Remove all event listeners for the connection process. We'll re-add the ones we want now that we have connected
            // after this promise is resolved
            cleanup();
            resolve();
          }
        });

        socketRef.on('error', (err) => {
          console.error(`Socket error during connection: ${err}`);
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            cleanup();
            if (!socketRef.destroyed) {
              socketRef.destroy();
            }
            reject(err);
          }
        });

        socketRef.on('timeout', () => {
          console.error(`Socket timeout during connection: ${connectionId}`);
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            cleanup();
            if (!socketRef.destroyed) {
              socketRef.destroy();
            }
            reject(new Error(`Socket connection timeout to ${connectionId}`));
          }
        });

        // Initiate connection
        socketRef.connect(options.port, options.host);
      });

      socket.setKeepAlive(true, 1000);

      // Setup data batching
      dataBatches.set(connectionId, []);

      // Setup event handlers for the connected socket
      socketRef.on('data', (data: Buffer) => {
        const batch = dataBatches.get(connectionId);
        if (batch) {
          const isFirstChar = batch.length === 0;
          batch.push(data);

          if (isFirstChar) {
            const timeout = setTimeout(() => {
              sendBatchedData(connectionId, mainWindow);
              batchTimeouts.delete(connectionId);
            }, RX_DATA_BATCH_TIMEOUT_MS);
            batchTimeouts.set(connectionId, timeout);
          }
        }
      });

      socketRef.on('error', (error: Error) => {
        console.error(`Socket error: ${error}`);
        // This will get called with error: read ECONNRESET if the connection is dropped
        mainWindow?.webContents.send('socket:error', connectionId, error.message);

        // Clean up the socket to prevent further errors
        if (activeSockets.has(connectionId)) {
          activeSockets.delete(connectionId);
          try {
            if (!socketRef.destroyed) {
              socketRef.destroy();
            }
          } catch (destroyError) {
            console.error(`Error destroying socket ${connectionId}:`, destroyError);
          }
        }
      });

      socketRef.on('close', () => {
        console.log(`socket.on('close') called. connectionId=${connectionId}`);
        sendBatchedData(connectionId, mainWindow);

        const timeout = batchTimeouts.get(connectionId);
        if (timeout) {
          clearTimeout(timeout);
          batchTimeouts.delete(connectionId);
        }
        dataBatches.delete(connectionId);

        activeSockets.delete(connectionId);
        mainWindow?.webContents.send('socket:closed', connectionId);
      });

      socketRef.on('end', () => {
        console.log(`Socket ended: ${connectionId}`);
        // Server ended the connection
        sendBatchedData(connectionId, mainWindow);
      });

      activeSockets.set(connectionId, socketRef);
      return { success: true, connectionId };
    } catch (error) {
      // Clean up socket on connection failure
      try {
        if (socket && !socket.destroyed) {
          socket.destroy();
        }
      } catch (destroyError) {
        console.error(`Error destroying failed socket ${connectionId}:`, destroyError);
      }

      // Clean up any batching data
      const timeout = batchTimeouts.get(connectionId);
      if (timeout) {
        clearTimeout(timeout);
        batchTimeouts.delete(connectionId);
      }
      dataBatches.delete(connectionId);
      activeSockets.delete(connectionId);

      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('socket:disconnect', async (event, connectionId: string) => {
    try {
      const socket = activeSockets.get(connectionId);
      if (!socket) {
        return { success: false, error: 'Socket not found' };
      }

      await new Promise<void>((resolve, _reject) => {
        socket.end(() => {
          resolve();
        });

        socket.on('error', (_err) => {
          // Still resolve on error during close
          resolve();
        });

        // Force close after timeout
        setTimeout(() => {
          if (!socket.destroyed) {
            socket.destroy();
          }
          resolve();
        }, 3000);
      });

      const timeout = batchTimeouts.get(connectionId);
      if (timeout) {
        clearTimeout(timeout);
        batchTimeouts.delete(connectionId);
      }
      dataBatches.delete(connectionId);

      activeSockets.delete(connectionId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('socket:disconnect-all', async () => {
    for (const [connectionId, socket] of activeSockets) {
      try {
        if (!socket.destroyed) {
          socket.destroy();
        }
      } catch (error) {
        console.error(`Error closing socket ${connectionId}:`, error);
      }
    }

    for (const timeout of batchTimeouts.values()) {
      clearTimeout(timeout);
    }
    batchTimeouts.clear();
    dataBatches.clear();

    activeSockets.clear();
  });

  ipcMain.handle('socket:write-data', async (event, connectionId: string, data: number[]) => {
    try {
      const socket = activeSockets.get(connectionId);
      if (!socket) {
        return { success: false, error: 'Socket not found' };
      }

      const buffer = Buffer.from(data);
      await new Promise<void>((resolve, reject) => {
        socket.write(buffer, (err) => {
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
}

export function cleanupSockets() {
  for (const [connectionId, socket] of activeSockets) {
    try {
      socket.destroy();
    } catch (error) {
      console.error(`Error closing socket ${connectionId}:`, error);
    }
  }

  for (const timeout of batchTimeouts.values()) {
    clearTimeout(timeout);
  }
  batchTimeouts.clear();
  dataBatches.clear();

  activeSockets.clear();
}
