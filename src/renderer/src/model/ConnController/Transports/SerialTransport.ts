import { App } from '../../App';
import { ConnectionType } from '../../Settings/PortSettings/PortSettings';
import { OpenOutcome, Transport, TransportCallbacks } from './Transport';

/**
 * A real serial port, opened in the main process by node-serialport.
 *
 * Reconnection works differently here to the network transports: rather than
 * retrying the open, it waits for the port path to reappear in the OS port
 * list. Trying to open a device that has been unplugged is slower and noisier
 * than asking whether it is back.
 */
export class SerialTransport implements Transport {
  readonly kind = ConnectionType.SERIAL_PORT;
  readonly supportsFlowControl = true;
  readonly reconnectIntervalMs = 500;
  readonly openAnalyticsEvent = 'port_open';
  readonly selfManagesReconnection = false;
  readonly selfManagesState = false;

  private app: App;

  /** Path of the currently open port, or null. Also filters incoming events. */
  private portPath: string | null = null;

  private disposers: Array<() => void> = [];

  constructor(app: App) {
    this.app = app;
  }

  /** The path this transport currently has open. Used for flow-control polling. */
  get openPortPath(): string | null {
    return this.portPath;
  }

  validate(): string | null {
    if (!this.app.settings.portConfiguration.selectedSerialPort) {
      return 'No serial port selected. Please select a port from the Port Settings.';
    }
    return null;
  }

  async open(callbacks: TransportCallbacks): Promise<OpenOutcome> {
    const config = this.app.settings.portConfiguration;
    const selectedPort = config.selectedSerialPort;

    try {
      const result = await window.electronAPI.serial.openPort({
        path: selectedPort.path,
        baudRate: config.baudRate,
        dataBits: config.numDataBits,
        parity: config.parity,
        stopBits: config.stopBits,

        // Flow control settings
        rtscts: config.rtscts,
        xon: config.xon,
        xoff: config.xoff,
        xany: config.xany,
        hupcl: config.hupcl,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: `${error}` };
    }

    this.portPath = selectedPort.path;
    this.subscribe(callbacks);

    // Remember this port so it can be reopened if the app is restarted.
    this.app.profileManager.appData.currentAppConfig.settings.portSettings.lastUsedSerialPortPath =
      selectedPort.path;
    this.app.profileManager.saveAppData();

    return { success: true };
  }

  private subscribe(callbacks: TransportCallbacks) {
    // Each event is filtered against the path we currently hold, so a late
    // event from a previous connection can't be mistaken for a live one.
    this.disposers.push(
      window.electronAPI.serial.onDataReceived((portPath: string, data: Buffer) => {
        if (portPath !== this.portPath) return;
        // Buffer can be used directly as Uint8Array - much faster than conversion
        callbacks.onData(new Uint8Array(data));
      })
    );

    this.disposers.push(
      window.electronAPI.serial.onError((portPath: string, error: string) => {
        if (portPath !== this.portPath) return;
        callbacks.onError(`Serial port error: ${error}`);
      })
    );

    // Fires whether the close was triggered by us or by the device disappearing.
    this.disposers.push(
      window.electronAPI.serial.onPortClosed((portPath: string) => {
        if (portPath !== this.portPath) return;
        callbacks.onClosed();
      })
    );
  }

  async close(): Promise<void> {
    if (this.portPath !== null) {
      const result = await window.electronAPI.serial.closePort(this.portPath);
      if (!result.success) {
        console.error('Error closing port:', result.error);
      }
    }
    this.portPath = null;
    this.disposeListeners();
    this.app.profileManager.saveAppData();
  }

  async write(bytes: Uint8Array): Promise<void> {
    const result = await window.electronAPI.serial.writeData(this.portPath!, bytes);
    if (!result.success) {
      throw new Error(result.error || 'Failed to write data');
    }
  }

  disposeListeners(): void {
    for (const dispose of this.disposers) {
      try {
        dispose();
      } catch (error) {
        console.error('Error disposing serial listener:', error);
      }
    }
    this.disposers = [];
  }

  /** Called by `ConnController` when the connection drops unexpectedly. */
  forgetConnection(): void {
    this.portPath = null;
  }

  openedMessage() {
    return 'Serial port opened.';
  }

  closedMessage() {
    return 'Serial port closed.';
  }

  reconnectedMessage() {
    return `Automatically reconnected to port: ${this.app.settings.portConfiguration.selectedSerialPort?.path}`;
  }

  /**
   * Waits for the previously used port path to reappear in the OS port list,
   * and selects it so the subsequent `open` targets the right device.
   */
  async canAttemptReconnect(): Promise<boolean> {
    const lastUsedPortPath =
      this.app.profileManager.appData.currentAppConfig.settings.portSettings.lastUsedSerialPortPath;
    if (!lastUsedPortPath) {
      return false;
    }

    const result = await window.electronAPI.serial.listPorts();
    if (!result.success) {
      console.error('Failed to list ports during reconnection polling:', result.error);
      return false;
    }

    const matchingPort = (result.ports || []).find((port) => port.path === lastUsedPortPath);
    if (!matchingPort) {
      return false;
    }

    this.app.settings.portConfiguration.setSelectedSerialPort(matchingPort);
    return true;
  }
}
