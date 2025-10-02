import { contextBridge, ipcRenderer } from 'electron';
import { OpenOptions, PortInfo, PortStatus } from '@serialport/bindings-interface';
import { SerializableBluetoothDevice, BluetoothServicesMessage as BluetoothServicesMsg, BluetoothConnectionAttemptSuccess } from '@shared/types/bluetooth';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Serial port operations
  serial: {
    listPorts: () => ipcRenderer.invoke('serial:list-ports'),
    openPort: (options: OpenOptions) => ipcRenderer.invoke('serial:open-port', options),
    closePort: (portPath: string) => ipcRenderer.invoke('serial:close-port', portPath),
    writeData: (portPath: string, data: number[]) => ipcRenderer.invoke('serial:write-data', portPath, data),

    // Event listeners
    onDataReceived: (callback: (portPath: string, data: number[]) => void) => {
      ipcRenderer.on('serial:data-received', (event, portPath, data) => callback(portPath, data));
    },
    onError: (callback: (portPath: string, error: string) => void) => {
      ipcRenderer.on('serial:error', (event, portPath, error) => callback(portPath, error));
    },
    onPortClosed: (callback: (portPath: string) => void) => {
      ipcRenderer.on('serial:port-closed', (event, portPath) => callback(portPath));
    },

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
    setFlowControlSignals: (signals: any) => ipcRenderer.send('serial:set-flow-control-signals', signals),
    getFlowControlSignals: (portPath: string) => {
      return ipcRenderer.invoke('serial:get-flow-control-signals', portPath);
    },
  },

  // File system operations
  fs: {
    selectDirectory: () => ipcRenderer.invoke('fs:select-directory'),
    writeFile: (filePath: string, data: number[], append?: boolean) =>
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
    onUpdateAvailable: (callback: (updateInfo: any) => void) => {
      ipcRenderer.on('update-available', (event, updateInfo) => callback(updateInfo));
    },
    onUpdateNotAvailable: (callback: (updateInfo: any) => void) => {
      ipcRenderer.on('update-not-available', (event, updateInfo) => callback(updateInfo));
    },
    onUpdateError: (callback: (error: any) => void) => {
      ipcRenderer.on('update-error', (event, error) => callback(error));
    },
    onDownloadProgress: (callback: (progressObj: any) => void) => {
      ipcRenderer.on('download-progress', (event, progressObj) => callback(progressObj));
    },
    onUpdateDownloaded: (callback: (updateInfo: any) => void) => {
      ipcRenderer.on('update-downloaded', (event, updateInfo) => callback(updateInfo));
    },

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

  // Socket operations
  socket: {
    connect: (options: { host: string; port: number }) => ipcRenderer.invoke('socket:connect', options),
    disconnect: (connectionId: string) => ipcRenderer.invoke('socket:disconnect', connectionId),
    writeData: (connectionId: string, data: number[]) => ipcRenderer.invoke('socket:write-data', connectionId, data),

    // Event listeners
    onDataReceived: (callback: (connectionId: string, data: Buffer) => void) => {
      ipcRenderer.on('socket:data-received', (event, connectionId, data) => callback(connectionId, data));
    },
    onError: (callback: (connectionId: string, error: string) => void) => {
      ipcRenderer.on('socket:error', (event, connectionId, error) => callback(connectionId, error));
    },
    onClosed: (callback: (connectionId: string) => void) => {
      ipcRenderer.on('socket:closed', (event, connectionId) => callback(connectionId));
    },

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

  // Bluetooth operations
  bluetooth: {
    startPeripheralScan: () => ipcRenderer.invoke('bluetooth:start-peripheral-scan'),
    stopPeripheralScan: () => ipcRenderer.invoke('bluetooth:stop-peripheral-scan'),
    getDiscoveredDevices: () => ipcRenderer.invoke('bluetooth:get-discovered-devices'),
    onDeviceDiscovered: (callback: (device: SerializableBluetoothDevice) => void) => {
      ipcRenderer.on('bluetooth:device-discovered', (event, device) => callback(device));
    },
    connectDevice: (deviceId: string) => ipcRenderer.invoke('bluetooth:connect-device', deviceId),
    onConnectionAttemptComplete: (callback: (error: string | null, bluetoothConnectionAttemptSuccess: BluetoothConnectionAttemptSuccess | null) => void) => {
      ipcRenderer.on('bluetooth:connection-attempt-complete', (event, error, bluetoothConnectionAttemptSuccess) => callback(error, bluetoothConnectionAttemptSuccess));
    },
    disconnectDevice: (deviceId: string) => ipcRenderer.invoke('bluetooth:disconnect-device', deviceId),
    writeData: (data: Uint8Array) => ipcRenderer.invoke('bluetooth:write-data', data),

    // Event listeners
    onDataReceived: (callback: (deviceId: string, data: Buffer) => void) => {
      ipcRenderer.on('bluetooth:data-received', (event, deviceId, data) => callback(deviceId, data));
    },
    onDeviceDisconnected: (callback: (deviceId: string) => void) => {
      ipcRenderer.on('bluetooth:device-disconnected', (event, deviceId) => callback(deviceId));
    },
    // onDeviceServicesDiscovered: (callback: (servicesMessage: BluetoothServicesMessage) => void) => {
    //   ipcRenderer.on('bluetooth:device-services-discovered', (event, servicesMessage) => callback(servicesMessage));
    // },

    // Remove listeners
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
    setupReadAndWrite: (serviceUuid: string, rxCharacteristicUuid: string, txCharacteristicUuid: string) => ipcRenderer.invoke('bluetooth:setup-read-and-write', serviceUuid, rxCharacteristicUuid, txCharacteristicUuid),
  }
});

// Type definitions for the exposed API
export interface ElectronAPI {
  serial: {
    listPorts(): Promise<{ success: boolean; ports?: PortInfo[]; error?: string }>;
    openPort(options: OpenOptions): Promise<{ success: boolean; error?: string }>;
    closePort(portPath: string): Promise<{ success: boolean; error?: string }>;
    writeData(portPath: string, data: number[]): Promise<{ success: boolean; error?: string }>;
    onDataReceived(callback: (portPath: string, data: Buffer) => void): void;
    onError(callback: (portPath: string, error: string) => void): void;
    onPortClosed(callback: (portPath: string) => void): void;
    removeAllListeners(channel: string): void;
    closeAllPortsAndRemoveListeners(): void;
    setFlowControlSignals(portPath: string, signals: any): void;
    getFlowControlSignals(portPath: string): Promise<PortStatus>;
  };
  fs: {
    selectDirectory(): Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
    writeFile(filePath: string, data: number[], append?: boolean): Promise<{ success: boolean; error?: string }>;
    getFileSize(filePath: string): Promise<{ success: boolean; size?: number; error?: string }>;
    fileExists(filePath: string): Promise<{ success: boolean; exists?: boolean; error?: string }>;
    getDefaultLogDirectory(): Promise<{ success: boolean; path?: string; error?: string }>;
  };
  updater: {
    checkForUpdates(): Promise<{ success: boolean; updateInfo?: any; error?: string }>;
    quitAndInstall(): Promise<{ success: boolean; error?: string }>;
    onUpdateAvailable(callback: (updateInfo: any) => void): void;
    onUpdateNotAvailable(callback: (updateInfo: any) => void): void;
    onUpdateError(callback: (error: any) => void): void;
    onDownloadProgress(callback: (progressObj: any) => void): void;
    onUpdateDownloaded(callback: (updateInfo: any) => void): void;
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
    writeData(connectionId: string, data: number[]): Promise<{ success: boolean; error?: string }>;
    onDataReceived(callback: (connectionId: string, data: Buffer) => void): void;
    onError(callback: (connectionId: string, error: string) => void): void;
    onClosed(callback: (connectionId: string) => void): void;
    removeAllListeners(channel: string): void;
    disconnectAllSocketsAndRemoveListeners(): void;
  };
  analytics: {
    event(eventName: string): Promise<{ success: boolean; error?: string }>;
  };
  bluetooth: {
    startPeripheralScan(): Promise<{ success: boolean; error?: string }>;
    stopPeripheralScan(): Promise<{ success: boolean; error?: string }>;
    getDiscoveredDevices(): Promise<{ success: boolean; devices?: any[]; error?: string }>;
    onDeviceDiscovered(callback: (device: SerializableBluetoothDevice) => void): void;
    connectDevice(deviceId: string): Promise<{ bluetoothServicesMsg: BluetoothServicesMsg | null; error?: string }>;
    onConnectionAttemptComplete(callback: (error: string | null, bluetoothConnectionAttemptSuccess: BluetoothConnectionAttemptSuccess | null) => void): void;
    disconnectDevice(deviceId: string): Promise<{ success: boolean; error?: string }>;
    writeData(data: Uint8Array): Promise<{ success: boolean; error?: string }>;
    onDataReceived(callback: (deviceId: string, data: Buffer) => void): void;
    onDeviceDisconnected(callback: (deviceId: string) => void): void;
    // onDeviceServicesDiscovered(callback: (servicesMessage: BluetoothOnConnectMessage) => void): void;
    removeAllListeners(channel: string): void;
    setupReadAndWrite(serviceUuid: string, rxCharacteristicUuid: string, txCharacteristicUuid: string): Promise<{ success: boolean; error?: string }>;
    onDataReceived(callback: (deviceId: string, data: Buffer) => void): void;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
