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