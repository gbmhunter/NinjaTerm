// ElectronAPI type is now global on window object

/**
 * Adapter class that provides a Web Serial API-like interface but uses Electron's serial port functionality.
 * This allows the existing application code to work with minimal changes.
 */
export class ElectronSerialPort {
  private portPath: string;
  private portInfo: Partial<SerialPortInfo>;
  private _readable: ReadableStream<Uint8Array> | null = null;
  private _writable: WritableStream<Uint8Array> | null = null;
  private readableController: ReadableStreamDefaultController<Uint8Array> | null = null;
  private writableController: WritableStreamDefaultController | null = null;
  private isOpen = false;

  constructor(portPath: string, portInfo: Partial<SerialPortInfo>) {
    this.portPath = portPath;
    this.portInfo = portInfo;
  }

  getInfo(): Partial<SerialPortInfo> {
    return this.portInfo;
  }

  async open(options: SerialOptions): Promise<void> {
    if (this.isOpen) {
      throw new DOMException('Port already open', 'InvalidStateError');
    }

    const electronAPI = window.electronAPI;
    const result = await electronAPI.serial.openPort(this.portPath, {
      baudRate: options.baudRate,
      dataBits: options.dataBits,
      parity: options.parity,
      stopBits: options.stopBits,
      flowControl: options.flowControl
    });

    if (!result.success) {
      throw new DOMException(result.error || 'Failed to open port', 'NetworkError');
    }

    this.isOpen = true;
    this.setupStreams();
  }

  async close(): Promise<void> {
    if (!this.isOpen) {
      return;
    }

    const electronAPI = window.electronAPI;
    const result = await electronAPI.serial.closePort(this.portPath);

    if (!result.success) {
      throw new DOMException(result.error || 'Failed to close port', 'NetworkError');
    }

    this.isOpen = false;
    this.cleanupStreams();
  }

  get readable(): ReadableStream<Uint8Array> | null {
    return this._readable;
  }

  get writable(): WritableStream<Uint8Array> | null {
    return this._writable;
  }

  async setSignals(signals: any): Promise<void> {
    // Note: Break signal support would need to be implemented in the main process
    if (signals.break !== undefined) {
      // For now, just resolve - break signal functionality would need to be added to the main process
      console.warn('Break signal not yet implemented in Electron adapter');
    }
  }

  private setupStreams(): void {
    const electronAPI = window.electronAPI;

    // Set up readable stream
    this._readable = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.readableController = controller;
        
        // Listen for data from the main process
        electronAPI.serial.onDataReceived((portPath: string, data: number[]) => {
          if (portPath === this.portPath && this.readableController) {
            const uint8Array = new Uint8Array(data);
            this.readableController.enqueue(uint8Array);
          }
        });

        // Listen for errors
        electronAPI.serial.onError((portPath: string, error: string) => {
          if (portPath === this.portPath && this.readableController) {
            this.readableController.error(new DOMException(error, 'NetworkError'));
          }
        });

        // Listen for port close events
        electronAPI.serial.onPortClosed((portPath: string) => {
          if (portPath === this.portPath && this.readableController) {
            this.readableController.close();
            this.isOpen = false;
          }
        });
      },
      cancel: () => {
        this.readableController = null;
      }
    });

    // Set up writable stream
    this._writable = new WritableStream<Uint8Array>({
      start: (controller) => {
        this.writableController = controller;
      },
      write: async (chunk) => {
        const result = await electronAPI.serial.writeData(this.portPath, Array.from(chunk));
        if (!result.success) {
          throw new DOMException(result.error || 'Failed to write data', 'NetworkError');
        }
      },
      close: () => {
        this.writableController = null;
      }
    });
  }

  private cleanupStreams(): void {
    if (this.readableController) {
      this.readableController.close();
      this.readableController = null;
    }
    if (this.writableController) {
      this.writableController = null;
    }
    this._readable = null;
    this._writable = null;

    // Clean up event listeners
    const electronAPI = window.electronAPI;
    electronAPI.serial.removeAllListeners('serial:data-received');
    electronAPI.serial.removeAllListeners('serial:error');
    electronAPI.serial.removeAllListeners('serial:port-closed');
  }
}

/**
 * Electron implementation of the navigator.serial interface
 */
export class ElectronSerialAPI {
  private eventTarget = new EventTarget();

  async getPorts(): Promise<ElectronSerialPort[]> {
    const electronAPI = window.electronAPI;
    const result = await electronAPI.serial.listPorts();
    
    if (!result.success) {
      throw new DOMException(result.error || 'Failed to list ports', 'NetworkError');
    }

    return result.ports?.map(port => {
      const portInfo: Partial<SerialPortInfo> = {
        usbVendorId: port.vendorId ? parseInt(port.vendorId, 16) : undefined,
        usbProductId: port.productId ? parseInt(port.productId, 16) : undefined,
      };
      return new ElectronSerialPort(port.path, portInfo);
    }) || [];
  }

  async requestPort(): Promise<ElectronSerialPort> {
    const electronAPI = window.electronAPI;
    const result = await electronAPI.serial.listPorts();
    
    if (!result.success) {
      throw new DOMException(result.error || 'Failed to list ports', 'NetworkError');
    }

    if (!result.ports || result.ports.length === 0) {
      throw new DOMException('No ports available', 'NotFoundError');
    }

    // For now, return the first available port
    // In a real implementation, you might want to show a dialog to let the user choose
    const port = result.ports[0];
    const portInfo: Partial<SerialPortInfo> = {
      usbVendorId: port.vendorId ? parseInt(port.vendorId, 16) : undefined,
      usbProductId: port.productId ? parseInt(port.productId, 16) : undefined,
    };
    
    return new ElectronSerialPort(port.path, portInfo);
  }

  addEventListener(type: string, listener: EventListener): void {
    this.eventTarget.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.eventTarget.removeEventListener(type, listener);
  }
}

/**
 * Initialize the Electron serial adapter by replacing the browser's navigator.serial
 * with our Electron implementation when running in Electron.
 * Always uses Node.js serialport for better control and more serial port information.
 */
export function initializeElectronSerialAdapter(): void {
  if ((window as any).electronAPI) {
    // We're running in Electron - always replace with our custom Node.js serialport implementation
    // This gives us better control and more detailed serial port information
    try {
      Object.defineProperty(navigator, 'serial', {
        value: new ElectronSerialAPI(),
        writable: false,
        configurable: true
      });
      console.log('Electron serial adapter initialized - using Node.js serialport for enhanced functionality');
    } catch (error) {
      console.warn('Could not replace navigator.serial:', error);
      // Fallback: Try to delete the existing property first, then redefine
      try {
        delete (navigator as any).serial;
        (navigator as any).serial = new ElectronSerialAPI();
        console.log('Electron serial adapter initialized via fallback method');
      } catch (fallbackError) {
        console.error('Failed to initialize Electron serial adapter:', fallbackError);
        throw new Error('Unable to initialize serial port functionality in Electron');
      }
    }
  }
}