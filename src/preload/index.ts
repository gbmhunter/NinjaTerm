import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Serial port operations
  serial: {
    listPorts: () => ipcRenderer.invoke('serial:list-ports'),
    openPort: (portPath: string, options: any) => ipcRenderer.invoke('serial:open-port', portPath, options),
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
  },

  // File system operations
  fs: {
    selectDirectory: () => ipcRenderer.invoke('fs:select-directory'),
    writeFile: (filePath: string, data: number[], append?: boolean) =>
      ipcRenderer.invoke('fs:write-file', filePath, data, append),
    getFileSize: (filePath: string) => ipcRenderer.invoke('fs:get-file-size', filePath),
    fileExists: (filePath: string) => ipcRenderer.invoke('fs:file-exists', filePath)
  }
});

// Type definitions for the exposed API
export interface ElectronAPI {
  serial: {
    listPorts(): Promise<{ success: boolean; ports?: any[]; error?: string }>;
    openPort(portPath: string, options: any): Promise<{ success: boolean; error?: string }>;
    closePort(portPath: string): Promise<{ success: boolean; error?: string }>;
    writeData(portPath: string, data: number[]): Promise<{ success: boolean; error?: string }>;
    onDataReceived(callback: (portPath: string, data: number[]) => void): void;
    onError(callback: (portPath: string, error: string) => void): void;
    onPortClosed(callback: (portPath: string) => void): void;
    removeAllListeners(channel: string): void;
  };
  fs: {
    selectDirectory(): Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
    writeFile(filePath: string, data: number[], append?: boolean): Promise<{ success: boolean; error?: string }>;
    getFileSize(filePath: string): Promise<{ success: boolean; size?: number; error?: string }>;
    fileExists(filePath: string): Promise<{ success: boolean; exists?: boolean; error?: string }>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
