import { makeAutoObservable, runInAction } from 'mobx';
import { z } from 'zod';

import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { App } from 'src/model/App';
import { SerialController } from '@/model/SerialController/SerialController';

export enum PortState {
  CLOSED,
  CLOSED_BUT_WILL_REOPEN,
  OPENED
}

export const DEFAULT_BAUD_RATES = [
  110, 300, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 230400, 460800, 921600
];

export const NUM_DATA_BITS_OPTIONS = [5, 6, 7, 8];

/**
 * The string values must match that of the ParityType type provided
 * by the Web Serial API.
 */
export enum Parity {
  NONE = 'none',
  EVEN = 'even',
  ODD = 'odd',
};

export type StopBits = 1 | 1.5 | 2;

export type NumDataBits = 5 | 6 | 7 | 8;

export const STOP_BIT_OPTIONS: StopBits[] = [1, 2];

export enum FlowControl {
  NONE = 'none',
  HARDWARE = 'hardware',
};

export enum ConnectionType {
  SERIAL_PORT = 'serial_port',
  SOCKET = 'socket',
  BLUETOOTH = 'bluetooth',
}

export class PortSettings {

  app: App
  profileManager: AppDataManager;

  baudRateInputValue: string;

  /**
   * Set min. baud rate to 1 and max. baud rate to 2,000,000. Most systems won't actually
   * support these ranges but let's not limit the user (they don't normally error if an unsupported
   * number is provided, it just doesn't work correctly).
   */
  baudRateValidation = z.coerce.number().int().min(1).max(2000000);
  baudRateErrorMsg = '';

  static SOCKET_CONN_TIMEOUT_MIN_MS = 100;
  static SOCKET_CONN_TIMEOUT_DEFAULT_MS = 2000;
  static SOCKET_CONN_TIMEOUT_MAX_MS = 5*60*1000;
  socketConnTimeoutValidation = z.coerce.number().int().min(PortSettings.SOCKET_CONN_TIMEOUT_MIN_MS).max(PortSettings.SOCKET_CONN_TIMEOUT_MAX_MS);

  /** Validation error message for the socket connection timeout input. Is an empty string if the input is valid. */
  socketConnTimeoutErrorMsg = '';

  baudRate = 115200;

  numDataBits: NumDataBits = 8;

  parity = Parity.NONE;

  stopBits: StopBits = 1;

  // Flow control parameters from SerialPort OpenOptions
  rtscts = false;
  xon = false;
  xoff = false;
  xany = false;
  hupcl = true; // drop DTR on close - defaults to true

  connectToSerialPortAsSoonAsItIsSelected = true;

  resumeConnectionToLastSerialPortOnStartup = true;

  reopenSerialPortIfUnexpectedlyClosed = true;

  /**
   * If true, the port settings UI elements will not be disabled when the port is open, and
   * the user can change them. Upon any change, the port will be closed and reopened with the
   * new settings (the Web Serial API does not allow us to change settings while the port is open).
   */
  allowSettingsChangesWhenOpen = false;

  availableSerialPorts: any = [];
  selectedSerialPort: any = null;

  // Connection type (serial port or socket)
  connectionType: ConnectionType = ConnectionType.SERIAL_PORT;

  // Socket connection settings
  socketHost = '127.0.0.1';
  socketPort = 5000;
  socketConnTimeoutDispMs = '5000';

  // Bluetooth connection settings
  availableBluetoothDevices: any[] = [];
  selectedBluetoothDevice: any = null;
  isBluetoothScanning = false;

  constructor(app: App) {
    this.app = app;
    this.profileManager = app.profileManager;
    this.baudRateInputValue = this.baudRate.toString();
    // this.config =
    this._loadConfig();
    this.profileManager.registerOnProfileLoad(() => {
      this._loadConfig();
    });
    makeAutoObservable(this);
  }

  setBaudRateInputValue = (value: string) => {
    this.baudRateInputValue = value;
  }

  setBaudRate = async () => {
    const parsed = this.baudRateValidation.safeParse(this.baudRateInputValue);
    if (!parsed.success) {
      // We want to keep this simple, just show the first
      // error message
      this.baudRateErrorMsg = parsed.error.errors[0].message;
      return;
    }

    this.baudRateErrorMsg = '';
    this.baudRate = parsed.data;
    this._saveConfig();
    await this._reconnectIfNeeded();
  }

  setNumDataBits = async (numDataBits: NumDataBits) => {
    this.numDataBits = numDataBits;
    this._saveConfig();
    await this._reconnectIfNeeded();
  }

  setParity = async (parity: Parity) => {
    this.parity = parity;
    this._saveConfig();
    await this._reconnectIfNeeded();
  }

  setStopBits = async (stopBits: StopBits) => {
    this.stopBits = stopBits;
    this._saveConfig();
    await this._reconnectIfNeeded();
  }

  setRtscts = async (value: boolean) => {
    this.rtscts = value;
    this._saveConfig();
    await this._reconnectIfNeeded();
  }

  setXon = async (value: boolean) => {
    this.xon = value;
    this._saveConfig();
    await this._reconnectIfNeeded();
  }

  setXoff = async (value: boolean) => {
    this.xoff = value;
    this._saveConfig();
    await this._reconnectIfNeeded();
  }

  setXany = async (value: boolean) => {
    this.xany = value;
    this._saveConfig();
    await this._reconnectIfNeeded();
  }

  setHupcl = async (value: boolean) => {
    this.hupcl = value;
    this._saveConfig();
    await this._reconnectIfNeeded();
  }

  setConnectToSerialPortAsSoonAsItIsSelected = (value: boolean) => {
    this.connectToSerialPortAsSoonAsItIsSelected = value;
    this._saveConfig();
  }

  setResumeConnectionToLastSerialPortOnStartup = (value: boolean) => {
    this.resumeConnectionToLastSerialPortOnStartup = value;
    this._saveConfig();
  }

  setReopenSerialPortIfUnexpectedlyClosed = (value: boolean) => {
    this.reopenSerialPortIfUnexpectedlyClosed = value;
    this._saveConfig();
  }

  setAllowSettingsChangesWhenOpen = (value: boolean) => {
    this.allowSettingsChangesWhenOpen = value;
    this._saveConfig();
  }

  scanForSerialPorts = async () => {
    const result = await window.electronAPI.serial.listPorts();
    runInAction(() => {
      if (result.success) {
        this.availableSerialPorts = SerialController.sortSerialPortsNaturally(result.ports!);
      } else {
        this.availableSerialPorts = [];
        this.app.snackbar.sendToSnackbar('Failed to scan for serial ports.', 'error');
      }
    });
  }

  setSelectedSerialPort = (port: any) => {
    this.selectedSerialPort = port;
  }

  scanForBluetoothDevices = async () => {
    this.isBluetoothScanning = true;
    this.availableBluetoothDevices = []; // Clear previous results

    try {
      const result = await window.electronAPI.bluetooth.startPeripheralScan();
      if (result.success) {
        this.app.snackbar.sendToSnackbar('Bluetooth scan started...', 'info');

        // Poll for discovered devices during scan
        const pollInterval = setInterval(async () => {
          try {
            const devicesResult = await window.electronAPI.bluetooth.getDiscoveredDevices();
            if (devicesResult.success && devicesResult.devices) {
              runInAction(() => {
                this.availableBluetoothDevices = devicesResult.devices || [];
              });
            }
          } catch (error) {
            console.warn('Failed to poll for Bluetooth devices:', error);
          }
        }, 500); // Poll every 500ms

        // Stop scanning indicator and polling after scan duration
        setTimeout(() => {
          clearInterval(pollInterval);
          this.isBluetoothScanning = false;
          this.app.snackbar.sendToSnackbar(`Bluetooth scan completed. Found ${this.availableBluetoothDevices.length} device(s).`, 'success');
        }, 5000); // Stop scanning indicator after 5 seconds (matches bluetoothService timeout)
      } else {
        this.app.snackbar.sendToSnackbar(`Failed to scan for Bluetooth devices: ${result.error}`, 'error');
        this.isBluetoothScanning = false;
      }
    } catch (error) {
      this.app.snackbar.sendToSnackbar('Failed to scan for Bluetooth devices.', 'error');
      this.isBluetoothScanning = false;
    }
  }

  setSelectedBluetoothDevice = (device: any) => {
    this.selectedBluetoothDevice = device;
  }

  setConnectionType = (connectionType: ConnectionType) => {
    this.connectionType = connectionType;
    this._saveConfig();
  }

  setSocketHost = (host: string) => {
    this.socketHost = host;
    this._saveConfig();
  }

  setSocketPort = (port: number) => {
    this.socketPort = port;
    this._saveConfig();
  }

  /**
   * Set the displayed socket connection timeout value (socketConnTimeoutDispMs).
   *
   * Is not applied until applySocketConnTimeout is called.
   * @param value The displayed socket connection timeout value (socketConnTimeoutDispMs).
   */
  setSocketConnTimeoutDispMs = (value: string) => {
    this.socketConnTimeoutDispMs = value;
  }

  /**
   * Try and parse the displayed socket connection timeout value (socketConnTimeoutDispMs) into a number (socketConnTimeoutMs).
   */
  applySocketConnTimeout = () => {
    const parsed = this.socketConnTimeoutValidation.safeParse(this.socketConnTimeoutDispMs);
    if (!parsed.success) {
      this.socketConnTimeoutErrorMsg = parsed.error.errors[0].message;
      return;
    }
    this.socketConnTimeoutErrorMsg = '';
    this._saveConfig();
  }

  _loadConfig = () => {
    let configToLoad = this.profileManager.appData.currentAppConfig.settings.portSettings

    // At this point we are confident that the deserialized config matches what
    // this classes config object wants, so we can go ahead and update.
    this.baudRate = configToLoad.baudRate;
    this.numDataBits = configToLoad.numDataBits;
    this.parity = configToLoad.parity;
    this.stopBits = configToLoad.stopBits;
    this.rtscts = configToLoad.rtscts;
    this.xon = configToLoad.xon;
    this.xoff = configToLoad.xoff;
    this.xany = configToLoad.xany;
    this.hupcl = configToLoad.hupcl;
    this.connectToSerialPortAsSoonAsItIsSelected = configToLoad.connectToSerialPortAsSoonAsItIsSelected;
    this.resumeConnectionToLastSerialPortOnStartup = configToLoad.resumeConnectionToLastSerialPortOnStartup;
    this.reopenSerialPortIfUnexpectedlyClosed = configToLoad.reopenSerialPortIfUnexpectedlyClosed;
    this.allowSettingsChangesWhenOpen = configToLoad.allowSettingsChangesWhenOpen;

    // Load socket settings
    this.connectionType = configToLoad.connectionType;
    this.socketHost = configToLoad.socketHost;
    this.socketPort = configToLoad.socketPort;
    this.socketConnTimeoutDispMs = configToLoad.socketConnTimeoutMs.toString();
    this.applySocketConnTimeout();

    this.setBaudRateInputValue(this.baudRate.toString());
  };

  _saveConfig = () => {
    let config = this.profileManager.appData.currentAppConfig.settings.portSettings;

    config.baudRate = this.baudRate;
    config.numDataBits = this.numDataBits;
    config.parity = this.parity;
    config.stopBits = this.stopBits;
    config.rtscts = this.rtscts;
    config.xon = this.xon;
    config.xoff = this.xoff;
    config.xany = this.xany;
    config.hupcl = this.hupcl;
    config.connectToSerialPortAsSoonAsItIsSelected = this.connectToSerialPortAsSoonAsItIsSelected;
    config.resumeConnectionToLastSerialPortOnStartup = this.resumeConnectionToLastSerialPortOnStartup;
    config.reopenSerialPortIfUnexpectedlyClosed = this.reopenSerialPortIfUnexpectedlyClosed;
    config.allowSettingsChangesWhenOpen = this.allowSettingsChangesWhenOpen;
    config.connectionType = this.connectionType;
    config.socketHost = this.socketHost;
    config.socketPort = this.socketPort;
    config.socketConnTimeoutMs = this.socketConnTimeoutMs;

    this.profileManager.saveAppData();
  };

  /**
   * Computed value which represents the connection config in short hand,
   * e.g. "115200 8n1" for serial ports or "192.168.1.54:80" for sockets
   *
   * @returns The short hand connection config for displaying to the user.
   */
  get socketConnTimeoutMs() {
    const parsed = this.socketConnTimeoutValidation.safeParse(this.socketConnTimeoutDispMs);
    if (!parsed.success) {
      return 2000; // Default fallback value
    }
    return parsed.data;
  }

  get shortSerialConfigName() {
    if (this.connectionType === ConnectionType.SOCKET) {
      return `${this.socketHost}:${this.socketPort}`;
    } else {
      return PortSettings.computeShortSerialConfigName(this.baudRate, this.numDataBits, this.parity, this.stopBits);
    }
  }

  static computeShortSerialConfigName(baudRate: number, numDataBits: NumDataBits, parity: Parity, stopBits: StopBits) {
    let output = '';
    output += baudRate.toString();
    output += ' ';
    output += numDataBits.toString();
    output += parity[0]; // Take first letter of parity, e.g. (n)one, (e)ven, (o)dd
    output += stopBits.toString();
    return output;
  }

  /**
   * Designed to be called every time a port setting is changed while the port is open.
   *
   * Will close the port and reopen, if port is in the open state.
   */
  _reconnectIfNeeded = async () => {
    if (this.app.serialController.portState === PortState.OPENED) {
      await this.app.serialController.closePort({ silenceSnackbar: true});
      await this.app.serialController.openPort({ silenceSnackbar: true});
      this.app.snackbar.sendToSnackbar('Serial port re-opened with new settings.', 'success');
    }
  }
}


