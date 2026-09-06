import { contextBridge, ipcRenderer } from 'electron';
import { OpenOptions, PortInfo, PortStatus } from '@serialport/bindings-interface';
import { SerializableBluetoothDevice, BluetoothConnectionAttemptSuccess } from '@shared/types/bluetooth';

/**
 * Wraps `ipcRenderer.on(channel, ...)` so each call returns a disposer that
 * removes only this listener. Without a disposer, the only way to clean up
 * is `removeAllListeners(channel)`, which kills every subscriber. Reconnect
 * cycles that re-register without that hammer cause callbacks to stack — the
 * same byte is then handled twice (or N times) per delivery.
 */
function subscribe<T extends any[]>(
  channel: string,
  callback: (...args: T) => void
): () => void {
  const wrapper = (_event: unknown, ...args: T) => callback(...args);
  ipcRenderer.on(channel, wrapper as any);
  return () => {
    ipcRenderer.off(channel, wrapper as any);
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  general: {
    removeAllListeners: (channel?: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
  // Serial port operations
  serial: {
    listPorts: () => ipcRenderer.invoke('serial:list-ports'),
    openPort: (options: OpenOptions) => ipcRenderer.invoke('serial:open-port', options),
    closePort: (portPath: string) => ipcRenderer.invoke('serial:close-port', portPath),
    writeData: (portPath: string, data: Uint8Array) => ipcRenderer.invoke('serial:write-data', portPath, data),

    // Event listeners
    onDataReceived: (callback: (portPath: string, data: number[]) => void) =>
      subscribe('serial:data-received', callback),
    onError: (callback: (portPath: string, error: string) => void) =>
      subscribe('serial:error', callback),
    onPortClosed: (callback: (portPath: string) => void) =>
      subscribe('serial:port-closed', callback),

    // Remove listeners
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },

    // Close all ports
    closeAllPortsAndRemoveListeners: () => {
      ipcRenderer.removeAllListeners('serial:data-received');
      ipcRenderer.removeAllListeners('serial:error');
      ipcRenderer.removeAllListeners('serial:port-closed');
      ipcRenderer.invoke('serial:close-all-ports');
    },

    // Flow control operations
    setFlowControlSignals: (portPath: string, signals: any) => ipcRenderer.invoke('serial:set-flow-control-signals', portPath, signals),
    getFlowControlSignals: (portPath: string) => {
      return ipcRenderer.invoke('serial:get-flow-control-signals', portPath);
    },
  },

  // File system operations
  fs: {
    selectDirectory: () => ipcRenderer.invoke('fs:select-directory'),
    writeFile: (filePath: string, data: Uint8Array, append?: boolean) =>
      ipcRenderer.invoke('fs:write-file', filePath, data, append),
    getFileSize: (filePath: string) => ipcRenderer.invoke('fs:get-file-size', filePath),
    fileExists: (filePath: string) => ipcRenderer.invoke('fs:file-exists', filePath),
    getDefaultLogDirectory: () => ipcRenderer.invoke('fs:get-default-log-directory')
  },

  // Auto-updater operations
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),
    quitAndInstall: () => ipcRenderer.invoke('updater:quit-and-install'),

    // Event listeners for update events
    onUpdateAvailable: (callback: (updateInfo: any) => void) =>
      subscribe('update-available', callback),
    onUpdateNotAvailable: (callback: (updateInfo: any) => void) =>
      subscribe('update-not-available', callback),
    onUpdateError: (callback: (error: any) => void) =>
      subscribe('update-error', callback),
    onDownloadProgress: (callback: (progressObj: any) => void) =>
      subscribe('download-progress', callback),
    onUpdateDownloaded: (callback: (updateInfo: any) => void) =>
      subscribe('update-downloaded', callback),

    // Remove listeners
    removeAllUpdateListeners: () => {
      ipcRenderer.removeAllListeners('update-available');
      ipcRenderer.removeAllListeners('update-not-available');
      ipcRenderer.removeAllListeners('update-error');
      ipcRenderer.removeAllListeners('download-progress');
      ipcRenderer.removeAllListeners('update-downloaded');
    }
  },

  // Shell operations
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url)
  },

  // Developer tools operations
  devtools: {
    open: () => ipcRenderer.invoke('devtools:open'),
    close: () => ipcRenderer.invoke('devtools:close'),
    toggle: () => ipcRenderer.invoke('devtools:toggle'),
    isOpen: () => ipcRenderer.invoke('devtools:is-open')
  },

  // Segger RTT operations
  rtt: {
    connect: (options: { device: string; interfaceType: 'SWD' | 'JTAG'; speedKHz: number; serverExePath: string; jLinkSerialNumber: string; channel: number }) =>
      ipcRenderer.invoke('rtt:connect', options),
    disconnect: (connectionId: string) => ipcRenderer.invoke('rtt:disconnect', connectionId),
    writeData: (connectionId: string, data: Uint8Array) => ipcRenderer.invoke('rtt:write-data', connectionId, data),
    browseExe: () => ipcRenderer.invoke('rtt:browse-exe'),
    resolveExePath: (userPath: string) => ipcRenderer.invoke('rtt:resolve-exe-path', userPath),

    // Event listeners
    onDataReceived: (callback: (connectionId: string, data: Buffer) => void) =>
      subscribe('rtt:data-received', callback),
    onError: (callback: (connectionId: string, error: string) => void) =>
      subscribe('rtt:error', callback),
    onClosed: (callback: (connectionId: string) => void) =>
      subscribe('rtt:closed', callback),
    onServerLog: (callback: (connectionId: string, line: string) => void) =>
      subscribe('rtt:server-log', callback),

    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },

    disconnectAllAndRemoveListeners: () => {
      ipcRenderer.removeAllListeners('rtt:data-received');
      ipcRenderer.removeAllListeners('rtt:error');
      ipcRenderer.removeAllListeners('rtt:closed');
      ipcRenderer.removeAllListeners('rtt:server-log');
      ipcRenderer.invoke('rtt:disconnect-all');
    },
  },

  // Socket operations
  socket: {
    connect: (options: { host: string; port: number }) => ipcRenderer.invoke('socket:connect', options),
    disconnect: (connectionId: string) => ipcRenderer.invoke('socket:disconnect', connectionId),
    writeData: (connectionId: string, data: Uint8Array) => ipcRenderer.invoke('socket:write-data', connectionId, data),

    // Event listeners
    onDataReceived: (callback: (connectionId: string, data: Buffer) => void) =>
      subscribe('socket:data-received', callback),
    onError: (callback: (connectionId: string, error: string) => void) =>
      subscribe('socket:error', callback),
    onClosed: (callback: (connectionId: string) => void) =>
      subscribe('socket:closed', callback),

    // Remove listeners
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },

    // Close all sockets
    disconnectAllSocketsAndRemoveListeners: () => {
      ipcRenderer.removeAllListeners('socket:data-received');
      ipcRenderer.removeAllListeners('socket:error');
      ipcRenderer.removeAllListeners('socket:closed');
      ipcRenderer.invoke('socket:disconnect-all');
    },
  },

  // Analytics operations
  analytics: {
    event: (eventName: string) => ipcRenderer.invoke('analytics:event', eventName)
  },

  // MCP server operations
  mcp: {
    start: (port: number) => ipcRenderer.invoke('mcp:start', port),
    stop: () => ipcRenderer.invoke('mcp:stop'),
    getStatus: () => ipcRenderer.invoke('mcp:get-status'),
    // Renderer registers this to receive data requests from the main process MCP server
    onRequest: (callback: (payload: { id: string; method: string; params: any }) => void) =>
      subscribe('mcp:request', callback),
    // Renderer calls this to send a response back to the main process
    respond: (id: string, data: any, error?: string) =>
      ipcRenderer.invoke('mcp:response', { id, data, error }),
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('mcp:request');
    },
    pushRxData: (sessionId: string, text: string) => ipcRenderer.send('mcp:rx-data', sessionId, text),
  },

  // Bluetooth operations
  bluetooth: {
    resetBluetoothState: () => ipcRenderer.invoke('bluetooth:reset-bluetooth-state'),
    startPeripheralScan: () => ipcRenderer.invoke('bluetooth:start-peripheral-scan'),
    stopPeripheralScan: () => ipcRenderer.invoke('bluetooth:stop-peripheral-scan'),
    getDiscoveredDevices: () => ipcRenderer.invoke('bluetooth:get-discovered-devices'),
    onDeviceDiscovered: (callback: (device: SerializableBluetoothDevice) => void) =>
      subscribe('bluetooth:device-discovered', callback),
    startConnectionAttempt: (deviceId: string) => ipcRenderer.invoke('bluetooth:start-connection-attempt', deviceId),
    onConnectionAttemptComplete: (callback: (error: string | null, bluetoothConnectionAttemptSuccess: BluetoothConnectionAttemptSuccess | null) => void) =>
      subscribe('bluetooth:connection-attempt-complete', callback),
    disconnectDevice: (deviceId: string) => ipcRenderer.invoke('bluetooth:disconnect-device', deviceId),
    writeData: (data: Uint8Array) => ipcRenderer.invoke('bluetooth:write-data', data),

    // Event listeners
    onDataReceived: (callback: (deviceId: string, data: Buffer) => void) =>
      subscribe('bluetooth:data-received', callback),
    onDeviceDisconnected: (callback: (deviceId: string) => void) =>
      subscribe('bluetooth:device-disconnected', callback),

    // Remove listeners
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
    setupReadAndWrite: (serviceUuid: string, rxCharacteristicUuid: string, txCharacteristicUuid: string) => ipcRenderer.invoke('bluetooth:setup-read-and-write', serviceUuid, rxCharacteristicUuid, txCharacteristicUuid),
  }
});

/** A disposer returned from every on* subscription. Calling it removes that one listener. */
export type Disposer = () => void;

// Type definitions for the exposed API
export interface ElectronAPI {
  general: {
    /**
     * Remove all listeners for a given channel. If no channel is provided, all listeners will be removed.
     *
     * This should be called when the renderer app loads, to prevent multiple listeners from being added in case of a hot reload or other situation in where the main process continues running.
     *
     * @param channel The channel to remove listeners for. Optional.
     */
    removeAllListeners(channel?: string): void;
  };
  serial: {
    listPorts(): Promise<{ success: boolean; ports?: PortInfo[]; error?: string }>;
    openPort(options: OpenOptions): Promise<{ success: boolean; error?: string }>;
    closePort(portPath: string): Promise<{ success: boolean; error?: string }>;
    writeData(portPath: string, data: Uint8Array): Promise<{ success: boolean; error?: string }>;
    onDataReceived(callback: (portPath: string, data: Buffer) => void): Disposer;
    onError(callback: (portPath: string, error: string) => void): Disposer;
    onPortClosed(callback: (portPath: string) => void): Disposer;
    removeAllListeners(channel: string): void;
    closeAllPortsAndRemoveListeners(): void;
    setFlowControlSignals(portPath: string, signals: any): Promise<{ success: boolean; error?: string }>;
    getFlowControlSignals(portPath: string): Promise<{ success: boolean; signals?: PortStatus; error?: string }>;
  };
  fs: {
    selectDirectory(): Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
    writeFile(filePath: string, data: Uint8Array, append?: boolean): Promise<{ success: boolean; error?: string }>;
    getFileSize(filePath: string): Promise<{ success: boolean; size?: number; error?: string }>;
    fileExists(filePath: string): Promise<{ success: boolean; exists?: boolean; error?: string }>;
    getDefaultLogDirectory(): Promise<{ success: boolean; path?: string; error?: string }>;
  };
  updater: {
    checkForUpdates(): Promise<{ success: boolean; updateInfo?: any; error?: string }>;
    quitAndInstall(): Promise<{ success: boolean; error?: string }>;
    onUpdateAvailable(callback: (updateInfo: any) => void): Disposer;
    onUpdateNotAvailable(callback: (updateInfo: any) => void): Disposer;
    onUpdateError(callback: (error: any) => void): Disposer;
    onDownloadProgress(callback: (progressObj: any) => void): Disposer;
    onUpdateDownloaded(callback: (updateInfo: any) => void): Disposer;
    removeAllUpdateListeners(): void;
  };
  shell: {
    openExternal(url: string): Promise<{ success: boolean; error?: string }>;
  };
  devtools: {
    open(): Promise<{ success: boolean; error?: string }>;
    close(): Promise<{ success: boolean; error?: string }>;
    toggle(): Promise<{ success: boolean; action?: 'opened' | 'closed'; error?: string }>;
    isOpen(): Promise<{ success: boolean; isOpen?: boolean; error?: string }>;
  };
  socket: {
    connect(options: { host: string; port: number }): Promise<{ success: boolean; connectionId?: string; error?: string }>;
    disconnect(connectionId: string): Promise<{ success: boolean; error?: string }>;
    writeData(connectionId: string, data: Uint8Array): Promise<{ success: boolean; error?: string }>;
    onDataReceived(callback: (connectionId: string, data: Buffer) => void): Disposer;
    onError(callback: (connectionId: string, error: string) => void): Disposer;
    onClosed(callback: (connectionId: string) => void): Disposer;
    removeAllListeners(channel: string): void;
    disconnectAllSocketsAndRemoveListeners(): void;
  };
  rtt: {
    connect(options: { device: string; interfaceType: 'SWD' | 'JTAG'; speedKHz: number; serverExePath: string; jLinkSerialNumber: string; channel: number }): Promise<{ success: boolean; connectionId?: string; error?: string }>;
    disconnect(connectionId: string): Promise<{ success: boolean; error?: string }>;
    writeData(connectionId: string, data: Uint8Array): Promise<{ success: boolean; error?: string }>;
    browseExe(): Promise<{ success: boolean; canceled?: boolean; path?: string }>;
    resolveExePath(userPath: string): Promise<{ success: boolean; path: string | null }>;
    onDataReceived(callback: (connectionId: string, data: Buffer) => void): Disposer;
    onError(callback: (connectionId: string, error: string) => void): Disposer;
    onClosed(callback: (connectionId: string) => void): Disposer;
    onServerLog(callback: (connectionId: string, line: string) => void): Disposer;
    removeAllListeners(channel: string): void;
    disconnectAllAndRemoveListeners(): void;
  };
  analytics: {
    event(eventName: string): Promise<{ success: boolean; error?: string }>;
  };
  mcp: {
    start(port: number): Promise<{ success: boolean; error?: string }>;
    stop(): Promise<{ success: boolean; error?: string }>;
    getStatus(): Promise<{ success: boolean; running: boolean; port: number; error?: string }>;
    onRequest(callback: (payload: { id: string; method: string; params: any }) => void): Disposer;
    respond(id: string, data: any, error?: string): Promise<void>;
    removeAllListeners(): void;
    pushRxData(sessionId: string, text: string): void;
  };
  bluetooth: {
    resetBluetoothState(): Promise<{ success: boolean; error?: string }>;
    startPeripheralScan(): Promise<{ success: boolean; error?: string }>;
    stopPeripheralScan(): Promise<{ success: boolean; error?: string }>;
    getDiscoveredDevices(): Promise<{ success: boolean; devices?: any[]; error?: string }>;
    onDeviceDiscovered(callback: (device: SerializableBluetoothDevice) => void): Disposer;
    startConnectionAttempt(deviceId: string): Promise<{ error?: string }>;
    onConnectionAttemptComplete(callback: (error: string | null, bluetoothConnectionAttemptSuccess: BluetoothConnectionAttemptSuccess | null) => void): Disposer;
    disconnectDevice(deviceId: string): Promise<{ success: boolean; error?: string }>;
    writeData(data: Uint8Array): Promise<{ success: boolean; error?: string }>;
    onDataReceived(callback: (deviceId: string, data: Buffer) => void): Disposer;
    onDeviceDisconnected(callback: (deviceId: string) => void): Disposer;
    removeAllListeners(channel: string): void;
    setupReadAndWrite(serviceUuid: string, rxCharacteristicUuid: string, txCharacteristicUuid: string): Promise<{ success: boolean; error?: string }>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
