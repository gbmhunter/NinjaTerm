// ElectronAPI type is now global on window object

/**
 * Electron implementation of FileSystemDirectoryHandle
 */
export class ElectronFileSystemDirectoryHandle {
  private directoryPath: string;

  constructor(directoryPath: string) {
    this.directoryPath = directoryPath;
  }

  get name(): string {
    return this.directoryPath.split(/[/\\]/).pop() || '';
  }

  get kind(): 'directory' {
    return 'directory';
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<ElectronFileSystemFileHandle> {
    const filePath = this.directoryPath + (this.directoryPath.endsWith('/') || this.directoryPath.endsWith('\\') ? '' : '/') + name;
    const electronAPI = window.electronAPI;
    
    if (options?.create) {
      // Create the file if it doesn't exist
      const writeResult = await electronAPI.fs.writeFile(filePath, [], false);
      if (!writeResult.success) {
        throw new DOMException(writeResult.error || 'Failed to create file', 'NotFoundError');
      }
    } else {
      // Check if file exists
      const existsResult = await electronAPI.fs.fileExists(filePath);
      if (!existsResult.success || !existsResult.exists) {
        throw new DOMException('File not found', 'NotFoundError');
      }
    }

    return new ElectronFileSystemFileHandle(filePath);
  }
}

/**
 * Electron implementation of FileSystemFileHandle
 */
export class ElectronFileSystemFileHandle {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  get name(): string {
    return this.filePath.split(/[/\\]/).pop() || '';
  }

  get kind(): 'file' {
    return 'file';
  }

  async getFile(): Promise<ElectronFile> {
    const electronAPI = window.electronAPI;
    const sizeResult = await electronAPI.fs.getFileSize(this.filePath);
    
    if (!sizeResult.success) {
      throw new DOMException(sizeResult.error || 'Failed to get file size', 'NotFoundError');
    }

    return new ElectronFile(this.filePath, sizeResult.size || 0);
  }

  async createWritable(options?: { keepExistingData?: boolean }): Promise<ElectronFileSystemWritableFileStream> {
    return new ElectronFileSystemWritableFileStream(this.filePath, options?.keepExistingData !== false);
  }
}

/**
 * Electron implementation of File interface (simplified)
 */
export class ElectronFile {
  private filePath: string;
  public size: number;
  public name: string;

  constructor(filePath: string, size: number) {
    this.filePath = filePath;
    this.size = size;
    this.name = filePath.split(/[/\\]/).pop() || '';
  }
}

/**
 * Electron implementation of FileSystemWritableFileStream
 */
export class ElectronFileSystemWritableFileStream {
  private filePath: string;
  private keepExistingData: boolean;
  private position: number = 0;

  constructor(filePath: string, keepExistingData: boolean = true) {
    this.filePath = filePath;
    this.keepExistingData = keepExistingData;
  }

  async write(data: Uint8Array): Promise<void> {
    const electronAPI = window.electronAPI;
    const result = await electronAPI.fs.writeFile(
      this.filePath, 
      Array.from(data), 
      this.keepExistingData && this.position > 0
    );
    
    if (!result.success) {
      throw new DOMException(result.error || 'Failed to write file', 'NotAllowedError');
    }

    this.position += data.length;
  }

  async seek(position: number): Promise<void> {
    this.position = position;
    // Note: Actual seeking would need to be implemented in the main process
    // For now, we'll just track the position
  }

  async close(): Promise<void> {
    // Nothing to do for close in our simple implementation
  }
}

/**
 * Initialize the Electron file system adapter by replacing browser APIs
 * with our Electron implementations when running in Electron.
 */
export function initializeElectronFileSystemAdapter(): void {
  if ((window as any).electronAPI) {
    // We're running in Electron, replace the showDirectoryPicker function
    (window as any).showDirectoryPicker = async (options?: { mode?: 'read' | 'readwrite' }): Promise<ElectronFileSystemDirectoryHandle> => {
      const electronAPI = window.electronAPI;
      const result = await electronAPI.fs.selectDirectory();
      
      if (result.canceled) {
        throw new DOMException('User cancelled', 'AbortError');
      }
      
      if (!result.success || !result.path) {
        throw new DOMException(result.error || 'Failed to select directory', 'NotAllowedError');
      }

      return new ElectronFileSystemDirectoryHandle(result.path);
    };

    console.log('Electron file system adapter initialized');
  }
}