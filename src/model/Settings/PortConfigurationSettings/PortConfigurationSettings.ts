import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { ProfileManager } from 'src/model/ProfileManager/ProfileManager';
import { App } from 'src/model/App';

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

export const STOP_BIT_OPTIONS: StopBits[] = [1, 2];

export enum FlowControl {
  NONE = 'none',
  HARDWARE = 'hardware',
};

export class PortConfigurationConfigV2 {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 2;

  baudRate = 115200;

  numDataBits = 8;

  parity = Parity.NONE;

  stopBits: StopBits = 1;

  flowControl = FlowControl.NONE;

  connectToSerialPortAsSoonAsItIsSelected = true;

  resumeConnectionToLastSerialPortOnStartup = true;

  reopenSerialPortIfUnexpectedlyClosed = true;
}

export default class PortConfiguration {

  app: App
  profileManager: ProfileManager;

  baudRateInputValue: string;

  /**
   * Set min. baud rate to 1 and max. baud rate to 2,000,000. Most systems won't actually
   * support these ranges but let's not limit the user (they don't normally error if an unsupported
   * number is provided, it just doesn't work correctly).
   */
  baudRateValidation = z.coerce.number().int().min(1).max(2000000);
  baudRateErrorMsg = '';

  baudRate = 115200;

  numDataBits = 8;

  parity = Parity.NONE;

  stopBits: StopBits = 1;

  flowControl = FlowControl.NONE;

  connectToSerialPortAsSoonAsItIsSelected = true;

  resumeConnectionToLastSerialPortOnStartup = true;

  reopenSerialPortIfUnexpectedlyClosed = true;

  /**
   * If true, the port settings UI elements will not be disabled when the port is open, and
   * the user can change them. Upon any change, the port will be closed and reopened with the
   * new settings (the Web Serial API does not allow us to change settings while the port is open).
   */
  allowSettingsChangesWhenOpen = false;

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

  setNumDataBits = async (numDataBits: number) => {
    if (typeof numDataBits !== 'number') {
      throw new Error("numDataBits must be a number");
    }
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

  setFlowControl = async (flowControl: FlowControl) => {
    this.flowControl = flowControl;
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

  _loadConfig = () => {
    let configToLoad = this.profileManager.appData.currentAppConfig.settings.portSettings
    //===============================================
    // UPGRADE PATH
    //===============================================
    const latestVersion = new PortConfigurationConfigV2().version;
    if (configToLoad.version === latestVersion) {
      // Do nothing
    } else {
      console.log(`Out-of-date config version ${configToLoad.version} found.` +
                    ` Updating to version ${latestVersion}.`);
      this._saveConfig();
      configToLoad = this.profileManager.appData.currentAppConfig.settings.portSettings
    }

    // At this point we are confident that the deserialized config matches what
    // this classes config object wants, so we can go ahead and update.
    this.baudRate = configToLoad.baudRate;
    this.numDataBits = configToLoad.numDataBits;
    this.parity = configToLoad.parity;
    this.stopBits = configToLoad.stopBits;
    this.flowControl = configToLoad.flowControl;
    this.connectToSerialPortAsSoonAsItIsSelected = configToLoad.connectToSerialPortAsSoonAsItIsSelected;
    this.resumeConnectionToLastSerialPortOnStartup = configToLoad.resumeConnectionToLastSerialPortOnStartup;
    this.reopenSerialPortIfUnexpectedlyClosed = configToLoad.reopenSerialPortIfUnexpectedlyClosed;

    this.setBaudRateInputValue(this.baudRate.toString());
  };

  _saveConfig = () => {
    let config = this.profileManager.appData.currentAppConfig.settings.portSettings;

    config.baudRate = this.baudRate;
    config.numDataBits = this.numDataBits;
    config.parity = this.parity;
    config.stopBits = this.stopBits;
    config.flowControl = this.flowControl;
    config.connectToSerialPortAsSoonAsItIsSelected = this.connectToSerialPortAsSoonAsItIsSelected;
    config.resumeConnectionToLastSerialPortOnStartup = this.resumeConnectionToLastSerialPortOnStartup;
    config.reopenSerialPortIfUnexpectedlyClosed = this.reopenSerialPortIfUnexpectedlyClosed;

    this.profileManager.saveAppData();
  };

  /**
   * Computed value which represents the serial port config in short hand,
   * e.g. "115200 8n1"
   *
   * @returns The short hand serial port config for displaying to the user.
   */
  get shortSerialConfigName() {
    return PortConfiguration.computeShortSerialConfigName(this.baudRate, this.numDataBits, this.parity, this.stopBits);
  }

  static computeShortSerialConfigName(baudRate: number, numDataBits: number, parity: Parity, stopBits: StopBits) {
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
    if (this.app.portState === PortState.OPENED) {
      await this.app.closePort({ silenceSnackbar: true});
      await this.app.openPort({ silenceSnackbar: true});
      this.app.snackbar.sendToSnackbar('Serial port re-opened with new settings.', 'success');
    }
  }
}


