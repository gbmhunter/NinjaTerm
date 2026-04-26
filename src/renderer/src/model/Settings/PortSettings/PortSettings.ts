import { makeAutoObservable, runInAction } from 'mobx';
import { z } from 'zod';

import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { App } from 'src/model/App';
import { ConnController } from '@/model/ConnController/ConnController';

/**
 * Enumerated the high-level connection states. This is used in a number of places in the app.
 */
export enum ConnState {
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
  FAKE = 'fake',
  SERIAL_PORT = 'serial_port',
  SOCKET = 'socket',
  BLUETOOTH_LE = 'bluetooth',
  RTT = 'rtt',
}

export enum RttInterface {
  SWD = 'SWD',
  JTAG = 'JTAG',
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

  static RTT_SPEED_MIN_KHZ = 1;
  static RTT_SPEED_DEFAULT_KHZ = 4000;
  static RTT_SPEED_MAX_KHZ = 50000;
  rttSpeedValidation = z.coerce.number().int().min(PortSettings.RTT_SPEED_MIN_KHZ).max(PortSettings.RTT_SPEED_MAX_KHZ);
  rttSpeedErrorMsg = '';

  // J-Link supports up to 16 RTT channels. 0 is the default "Terminal" channel and
  // is what the vast majority of firmwares use.
  static RTT_CHANNEL_MIN = 0;
  static RTT_CHANNEL_MAX = 15;
  rttChannelValidation = z.coerce.number().int().min(PortSettings.RTT_CHANNEL_MIN).max(PortSettings.RTT_CHANNEL_MAX);
  rttChannelErrorMsg = '';

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

  // Segger RTT settings
  rttDevice = '';
  rttInterface: RttInterface = RttInterface.SWD;
  rttSpeedDispKHz = '4000';
  rttServerExePath = '';
  rttServerExePathUserModified = false;
  rttJLinkSerialNumber = '';
  rttChannelDisp = '0';
  rttRecentDevices: string[] = [];
  static RTT_RECENT_DEVICES_MAX = 5;

  // Bluetooth connection settings
  // availableBluetoothDevices: SerializableBluetoothDevice[] = [];
  // selectedBluetoothDevice: SerializableBluetoothDevice | null = null;
  // isBluetoothScanning = false;

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
        this.availableSerialPorts = ConnController.sortSerialPortsNaturally(result.ports!);
      } else {
        this.availableSerialPorts = [];
        this.app.snackbar.sendToSnackbar('Failed to scan for serial ports.', 'error');
      }
    });
  }

  setSelectedSerialPort = (port: any) => {
    this.selectedSerialPort = port;
  }

  // scanForBluetoothDevices = async () => {
  //   this.isBluetoothScanning = true;
  //   this.availableBluetoothDevices = []; // Clear previous results

  //   try {
  //     const result = await window.electronAPI.bluetooth.startPeripheralScan();
  //     if (result.success) {
  //       this.app.snackbar.sendToSnackbar('Bluetooth scan started...', 'info');

  //       // Poll for discovered devices during scan
  //       const pollInterval = setInterval(async () => {
  //         try {
  //           const devicesResult = await window.electronAPI.bluetooth.getDiscoveredDevices();
  //           if (devicesResult.success && devicesResult.devices) {
  //             runInAction(() => {
  //               this.availableBluetoothDevices = devicesResult.devices || [];
  //             });
  //           }
  //         } catch (error) {
  //           console.warn('Failed to poll for Bluetooth devices:', error);
  //         }
  //       }, 500); // Poll every 500ms

  //       // Stop scanning indicator and polling after scan duration
  //       setTimeout(() => {
  //         clearInterval(pollInterval);
  //         this.isBluetoothScanning = false;
  //         this.app.snackbar.sendToSnackbar(`Bluetooth scan completed. Found ${this.availableBluetoothDevices.length} device(s).`, 'success');
  //       }, 5000); // Stop scanning indicator after 5 seconds (matches bluetoothService timeout)
  //     } else {
  //       this.app.snackbar.sendToSnackbar(`Failed to scan for Bluetooth devices: ${result.error}`, 'error');
  //       this.isBluetoothScanning = false;
  //     }
  //   } catch (error) {
  //     this.app.snackbar.sendToSnackbar('Failed to scan for Bluetooth devices.', 'error');
  //     this.isBluetoothScanning = false;
  //   }
  // }

  /**
   * Set the selected Bluetooth device.
   *
   * @param device The Bluetooth device to set as selected.
   */
  // setSelectedBluetoothDevice = (device: SerializableBluetoothDevice) => {
  //   this.selectedBluetoothDevice = device;
  // }

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

  setRttDevice = (device: string) => {
    this.rttDevice = device;
    this._saveConfig();
  }

  setRttInterface = (iface: RttInterface) => {
    this.rttInterface = iface;
    this._saveConfig();
  }

  setRttSpeedDispKHz = (value: string) => {
    this.rttSpeedDispKHz = value;
  }

  applyRttSpeed = () => {
    const parsed = this.rttSpeedValidation.safeParse(this.rttSpeedDispKHz);
    if (!parsed.success) {
      this.rttSpeedErrorMsg = parsed.error.errors[0].message;
      return;
    }
    this.rttSpeedErrorMsg = '';
    this._saveConfig();
  }

  /**
   * Called only when the user explicitly modifies the path (typing, Browse, or Locate).
   * Sticks `rttServerExePathUserModified` so the auto-detect on RTT-pane navigation no
   * longer fights the user — including when they deliberately clear the field.
   */
  setRttServerExePath = (value: string) => {
    this.rttServerExePath = value;
    this.rttServerExePathUserModified = true;
    this._saveConfig();
  }

  /**
   * Used by the auto-detect on first RTT-pane navigation. Does NOT mark the field as
   * user-modified, so the next pane visit will still auto-detect if the resolver fails.
   */
  setRttServerExePathFromAutoDetect = (value: string) => {
    this.rttServerExePath = value;
    this._saveConfig();
  }

  setRttJLinkSerialNumber = (value: string) => {
    this.rttJLinkSerialNumber = value;
    this._saveConfig();
  }

  setRttChannelDisp = (value: string) => {
    this.rttChannelDisp = value;
  }

  applyRttChannel = () => {
    const parsed = this.rttChannelValidation.safeParse(this.rttChannelDisp);
    if (!parsed.success) {
      this.rttChannelErrorMsg = parsed.error.errors[0].message;
      return;
    }
    this.rttChannelErrorMsg = '';
    this._saveConfig();
  }

  /**
   * Record that an RTT device was just used successfully. The device moves to the front of
   * the recent list; the list is capped at `RTT_RECENT_DEVICES_MAX` entries. Empty values
   * are ignored.
   */
  pushRttRecentDevice = (device: string) => {
    const trimmed = device.trim();
    if (trimmed === '') return;
    const without = this.rttRecentDevices.filter((d) => d !== trimmed);
    this.rttRecentDevices = [trimmed, ...without].slice(0, PortSettings.RTT_RECENT_DEVICES_MAX);
    this._saveConfig();
  }

  /**
   * When true, `_saveConfig` is a no-op. Set while `_loadConfig` runs so that helpers like
   * `applySocketConnTimeout` — which normally save — don't clobber localStorage with a
   * half-populated snapshot before the rest of the fields have been read from disk.
   */
  _isLoading = false;

  _loadConfig = () => {
    this._isLoading = true;
    try {
      this._loadConfigInner();
    } finally {
      this._isLoading = false;
    }
  };

  _loadConfigInner = () => {
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

    // Load RTT settings
    this.rttDevice = configToLoad.rttDevice;
    this.rttInterface = configToLoad.rttInterface;
    this.rttSpeedDispKHz = configToLoad.rttSpeedKHz.toString();
    this.applyRttSpeed();
    this.rttServerExePath = configToLoad.rttServerExePath;
    // Tolerate saved blobs from before this field existed.
    this.rttServerExePathUserModified = configToLoad.rttServerExePathUserModified ?? false;
    this.rttJLinkSerialNumber = configToLoad.rttJLinkSerialNumber;
    // Tolerate saved blobs from before these fields existed.
    const savedChannel = typeof configToLoad.rttChannel === 'number' ? configToLoad.rttChannel : 0;
    this.rttChannelDisp = savedChannel.toString();
    this.applyRttChannel();
    this.rttRecentDevices = Array.isArray(configToLoad.rttRecentDevices) ? configToLoad.rttRecentDevices : [];

    this.setBaudRateInputValue(this.baudRate.toString());
  };

  _saveConfig = () => {
    if (this._isLoading) return;
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

    config.rttDevice = this.rttDevice;
    config.rttInterface = this.rttInterface;
    config.rttSpeedKHz = this.rttSpeedKHz;
    config.rttServerExePath = this.rttServerExePath;
    config.rttServerExePathUserModified = this.rttServerExePathUserModified;
    config.rttJLinkSerialNumber = this.rttJLinkSerialNumber;
    config.rttChannel = this.rttChannel;
    config.rttRecentDevices = this.rttRecentDevices.slice();

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

  get rttSpeedKHz() {
    const parsed = this.rttSpeedValidation.safeParse(this.rttSpeedDispKHz);
    if (!parsed.success) {
      return PortSettings.RTT_SPEED_DEFAULT_KHZ;
    }
    return parsed.data;
  }

  get rttChannel() {
    const parsed = this.rttChannelValidation.safeParse(this.rttChannelDisp);
    if (!parsed.success) {
      return 0;
    }
    return parsed.data;
  }

  /**
   * TODO: This really belongs in the ConnController (or the classes that are responsible for different connection types, e.g. BluetoothLEController).
   */
  get shortSerialConfigName() {
    if (this.connectionType === ConnectionType.SOCKET) {
      return `${this.socketHost}:${this.socketPort}`;
    } else if (this.connectionType === ConnectionType.BLUETOOTH_LE) {
      const connectedBluetoothDevice = this.app.connController.bluetoothLEController.connectedBluetoothDevice;
      if (connectedBluetoothDevice === null) {
        return 'n/a';
      }
      return `${connectedBluetoothDevice.nobleData.advertisement.localName} (${connectedBluetoothDevice.nobleData.id})`;
    } else if (this.connectionType === ConnectionType.RTT) {
      const device = this.rttDevice || 'no device';
      return `${device} ${this.rttInterface} ${this.rttSpeedKHz}kHz`;
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
    if (this.app.connController.connState === ConnState.OPENED) {
      await this.app.connController.closeConnection({ silenceSnackbar: true});
      await this.app.connController.openConnection({ silenceSnackbar: true});
      this.app.snackbar.sendToSnackbar('Serial port re-opened with new settings.', 'success');
    }
  }
}


