import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import AppStorage from 'src/model/Storage/AppStorage';
import { createSerializableObjectFromConfig, updateConfigFromSerializable } from 'src/model/Util/SettingsLoader';
import { ProfileManager } from 'src/model/ProfileManager/ProfileManager';

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

export class PortConfigurationConfig {
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

  appStorage: AppStorage;

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

  constructor(appStorage: AppStorage, profileManager: ProfileManager) {
    this.appStorage = appStorage;
    this.profileManager = profileManager;
    this.baudRateInputValue = this.baudRate.toString();
    // this.config =
    this._loadConfig();
    this.profileManager.registerForProfileChange(() => {
      this._loadConfig();
    });
    makeAutoObservable(this);
  }

  setBaudRate = (baudRate: number) => {
    this.baudRate = baudRate;
    this._saveConfig();
  }

  setBaudRateInputValue = (value: string) => {
    this.baudRateInputValue = value;

    const parsed = this.baudRateValidation.safeParse(value);
    if (parsed.success) {
      this.baudRateErrorMsg = '';
      console.log("Setting baud rate to: ", parsed.data);
      this.setBaudRate(parsed.data);
    } else {
      // We want to keep this simple, just show the first
      // error message
      this.baudRateErrorMsg = parsed.error.errors[0].message;
    }
  }

  setNumDataBits = (numDataBits: number) => {
    if (typeof numDataBits !== 'number') {
      throw new Error("numDataBits must be a number");
    }
    this.numDataBits = numDataBits;
    this._saveConfig();
  }

  setParity = (parity: Parity) => {
    this.parity = parity;
    this._saveConfig();
  }

  setStopBits = (stopBits: StopBits) => {
    this.stopBits = stopBits;
    this._saveConfig();
  }

  setFlowControl = (flowControl: FlowControl) => {
    this.flowControl = flowControl;
    this._saveConfig();
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

  _loadConfig = () => {
    // let deserializedConfig = this.appStorage.getConfig(PORT_CONFIGURATION_CONFIG_KEY);
    let configToLoad = this.profileManager.currentAppConfig.settings.portSettings
    //===============================================
    // UPGRADE PATH
    //===============================================
    const latestVersion = new PortConfigurationConfig().version;
    if (configToLoad.version === latestVersion) {
      console.log(`Up-to-date config found.`);
    } else {
      console.error(`Out-of-date config version ${configToLoad.version} found.` +
                    ` Updating to version ${latestVersion}.`);
      this._saveConfig();
      configToLoad = this.profileManager.currentAppConfig.settings.portSettings
      // deserializedConfig = this.appStorage.getConfig(PORT_CONFIGURATION_CONFIG_KEY);
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
    let config = this.profileManager.currentAppConfig.settings.portSettings;

    config.baudRate = this.baudRate;
    config.numDataBits = this.numDataBits;
    config.parity = this.parity;
    config.stopBits = this.stopBits;
    config.flowControl = this.flowControl;
    config.connectToSerialPortAsSoonAsItIsSelected = this.connectToSerialPortAsSoonAsItIsSelected;
    config.resumeConnectionToLastSerialPortOnStartup = this.resumeConnectionToLastSerialPortOnStartup;
    config.reopenSerialPortIfUnexpectedlyClosed = this.reopenSerialPortIfUnexpectedlyClosed;

    this.profileManager.saveAppConfig();
  };

  /**
   * Computed value which represents the serial port config in short hand,
   * e.g. "115200 8n1"
   *
   * @returns The short hand serial port config for displaying to the user.
   */
  get shortSerialConfigName() {
    let output = '';
    output += this.baudRate.toString();
    output += ' ';
    output += this.numDataBits.toString();
    output += this.parity[0]; // Take first letter of parity, e.g. (n)one, (e)ven, (o)dd
    output += this.stopBits.toString();
    return output;
  }
}


