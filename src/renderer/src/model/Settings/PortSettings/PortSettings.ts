import { makeAutoObservable, runInAction } from 'mobx';
import { z } from 'zod';

import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { App } from 'src/model/App';
import { ConnController } from '@/model/ConnController/ConnController';
import type { PortSettingsData } from 'src/model/AppDataManager/DataClasses/PortSettingsData';
import { SettingsBranch } from '../SettingsBranch';

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

/**
 * How the app connects to a device. Persisted, so the string values are part of
 * the app-data format and must not change.
 *
 * Fake ports are deliberately absent: they are a debugging aid that stands in
 * for a real serial port, so they run behind `SERIAL_PORT` and everything
 * user-facing keeps treating the connection as serial. Which transport actually
 * backs it is `ConnController.useFakeSerialPort`.
 */
export enum ConnectionType {
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

  /** See `SettingsBranch` for how this class relates to `PortSettingsData`. */
  private readonly branch = new SettingsBranch<PortSettingsData>(
    'settings.portSettings',
    (config) => config.settings.portSettings,
  );

  //=================================================================
  // SERIAL PORT
  //=================================================================

  /**
   * Set min. baud rate to 1 and max. baud rate to 2,000,000. Most systems won't actually
   * support these ranges but let's not limit the user (they don't normally error if an unsupported
   * number is provided, it just doesn't work correctly).
   *
   * Changing it while the port is open reopens the port with the new rate.
   */
  baudRate = this.branch.applyableNumber(
    'baudRate',
    z.coerce.number().int().min(1).max(2000000),
    () => { void this._reconnectIfNeeded(); },
  );

  get numDataBits() { return this.branch.data.numDataBits; }
  setNumDataBits = async (numDataBits: NumDataBits) => {
    this.branch.set('numDataBits', numDataBits);
    await this._reconnectIfNeeded();
  };

  get parity() { return this.branch.data.parity; }
  setParity = async (parity: Parity) => {
    this.branch.set('parity', parity);
    await this._reconnectIfNeeded();
  };

  get stopBits() { return this.branch.data.stopBits; }
  setStopBits = async (stopBits: StopBits) => {
    this.branch.set('stopBits', stopBits);
    await this._reconnectIfNeeded();
  };

  // Flow control parameters from SerialPort OpenOptions
  get rtscts() { return this.branch.data.rtscts; }
  setRtscts = async (value: boolean) => {
    this.branch.set('rtscts', value);
    await this._reconnectIfNeeded();
  };

  get xon() { return this.branch.data.xon; }
  setXon = async (value: boolean) => {
    this.branch.set('xon', value);
    await this._reconnectIfNeeded();
  };

  get xoff() { return this.branch.data.xoff; }
  setXoff = async (value: boolean) => {
    this.branch.set('xoff', value);
    await this._reconnectIfNeeded();
  };

  get xany() { return this.branch.data.xany; }
  setXany = async (value: boolean) => {
    this.branch.set('xany', value);
    await this._reconnectIfNeeded();
  };

  /** Drop DTR on close. */
  get hupcl() { return this.branch.data.hupcl; }
  setHupcl = async (value: boolean) => {
    this.branch.set('hupcl', value);
    await this._reconnectIfNeeded();
  };

  get connectToSerialPortAsSoonAsItIsSelected() { return this.branch.data.connectToSerialPortAsSoonAsItIsSelected; }
  setConnectToSerialPortAsSoonAsItIsSelected = this.branch.setter('connectToSerialPortAsSoonAsItIsSelected');

  get resumeConnectionToLastSerialPortOnStartup() { return this.branch.data.resumeConnectionToLastSerialPortOnStartup; }
  setResumeConnectionToLastSerialPortOnStartup = this.branch.setter('resumeConnectionToLastSerialPortOnStartup');

  get reopenSerialPortIfUnexpectedlyClosed() { return this.branch.data.reopenSerialPortIfUnexpectedlyClosed; }
  setReopenSerialPortIfUnexpectedlyClosed = this.branch.setter('reopenSerialPortIfUnexpectedlyClosed');

  /**
   * If true, the port settings UI elements will not be disabled when the port is open, and
   * the user can change them. Upon any change, the port will be closed and reopened with the
   * new settings (the Web Serial API does not allow us to change settings while the port is open).
   */
  get allowSettingsChangesWhenOpen() { return this.branch.data.allowSettingsChangesWhenOpen; }
  setAllowSettingsChangesWhenOpen = this.branch.setter('allowSettingsChangesWhenOpen');

  // Not persisted: the list of ports on this machine right now, and which one
  // is picked. A port is identified across restarts by `lastUsedSerialPortPath`.
  availableSerialPorts: any = [];
  selectedSerialPort: any = null;

  //=================================================================
  // CONNECTION TYPE
  //=================================================================

  get connectionType() { return this.branch.data.connectionType; }
  setConnectionType = this.branch.setter('connectionType');

  //=================================================================
  // SOCKET
  //=================================================================

  get socketHost() { return this.branch.data.socketHost; }
  setSocketHost = this.branch.setter('socketHost');

  get socketPort() { return this.branch.data.socketPort; }
  setSocketPort = this.branch.setter('socketPort');

  static SOCKET_CONN_TIMEOUT_MIN_MS = 100;
  static SOCKET_CONN_TIMEOUT_DEFAULT_MS = 2000;
  static SOCKET_CONN_TIMEOUT_MAX_MS = 5*60*1000;

  socketConnTimeoutMs = this.branch.applyableNumber(
    'socketConnTimeoutMs',
    z.coerce.number().int().min(PortSettings.SOCKET_CONN_TIMEOUT_MIN_MS).max(PortSettings.SOCKET_CONN_TIMEOUT_MAX_MS),
  );

  //=================================================================
  // SEGGER RTT
  //=================================================================

  get rttDevice() { return this.branch.data.rttDevice; }
  setRttDevice = this.branch.setter('rttDevice');

  get rttInterface() { return this.branch.data.rttInterface; }
  setRttInterface = this.branch.setter('rttInterface');

  static RTT_SPEED_MIN_KHZ = 1;
  static RTT_SPEED_DEFAULT_KHZ = 4000;
  static RTT_SPEED_MAX_KHZ = 50000;

  rttSpeedKHz = this.branch.applyableNumber(
    'rttSpeedKHz',
    z.coerce.number().int().min(PortSettings.RTT_SPEED_MIN_KHZ).max(PortSettings.RTT_SPEED_MAX_KHZ),
  );

  get rttServerExePath() { return this.branch.data.rttServerExePath; }

  /**
   * Called only when the user explicitly modifies the path (typing, Browse, or Locate).
   * Sticks `rttServerExePathUserModified` so the auto-detect on RTT-pane navigation no
   * longer fights the user — including when they deliberately clear the field.
   */
  setRttServerExePath = (value: string) => {
    runInAction(() => {
      this.branch.data.rttServerExePath = value;
      this.branch.data.rttServerExePathUserModified = true;
    });
    this.branch.save();
  };

  /**
   * Used by the auto-detect on first RTT-pane navigation. Does NOT mark the field as
   * user-modified, so the next pane visit will still auto-detect if the resolver fails.
   */
  setRttServerExePathFromAutoDetect = this.branch.setter('rttServerExePath');

  get rttServerExePathUserModified() { return this.branch.data.rttServerExePathUserModified; }

  get rttJLinkSerialNumber() { return this.branch.data.rttJLinkSerialNumber; }
  setRttJLinkSerialNumber = this.branch.setter('rttJLinkSerialNumber');

  // J-Link supports up to 16 RTT channels. 0 is the default "Terminal" channel and
  // is what the vast majority of firmwares use.
  static RTT_CHANNEL_MIN = 0;
  static RTT_CHANNEL_MAX = 15;

  rttChannel = this.branch.applyableNumber(
    'rttChannel',
    z.coerce.number().int().min(PortSettings.RTT_CHANNEL_MIN).max(PortSettings.RTT_CHANNEL_MAX),
  );

  static RTT_RECENT_DEVICES_MAX = 5;

  get rttRecentDevices() { return this.branch.data.rttRecentDevices; }

  /**
   * Record that an RTT device was just used successfully. The device moves to the front of
   * the recent list; the list is capped at `RTT_RECENT_DEVICES_MAX` entries. Empty values
   * are ignored.
   */
  pushRttRecentDevice = (device: string) => {
    const trimmed = device.trim();
    if (trimmed === '') return;
    const without = this.rttRecentDevices.filter((d) => d !== trimmed);
    this.branch.set('rttRecentDevices', [trimmed, ...without].slice(0, PortSettings.RTT_RECENT_DEVICES_MAX));
  }

  constructor(app: App) {
    this.app = app;
    this.profileManager = app.profileManager;
    this.branch.attach(this.profileManager);
    makeAutoObservable<PortSettings, 'branch'>(this, { branch: false });
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

  /**
   * Computed value which represents the connection config in short hand,
   * e.g. "115200 8n1" for serial ports or "192.168.1.54:80" for sockets
   *
   * TODO: This really belongs in the ConnController (or the classes that are responsible for different connection types, e.g. BluetoothLEController).
   *
   * @returns The short hand connection config for displaying to the user.
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
      return `${device} ${this.rttInterface} ${this.rttSpeedKHz.appliedValue}kHz`;
    } else {
      return PortSettings.computeShortSerialConfigName(this.baudRate.appliedValue, this.numDataBits, this.parity, this.stopBits);
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
