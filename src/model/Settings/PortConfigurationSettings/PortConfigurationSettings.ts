import { makeAutoObservable } from 'mobx';

import { App } from 'src/model/App';
import AppStorage from 'src/model/Storage/AppStorage';
import { createSerializableObjectFromConfig, updateConfigFromSerializable } from 'src/model/Util/SettingsLoader';
import { z } from 'zod';

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

const CONFIG_KEY = ['settings', 'port-configuration-settings'];

class Config {
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

  connectToSerialPortAsSoonAsItIsSelected = true;

  resumeConnectionToLastSerialPortOnStartup = true;

  reopenSerialPortIfUnexpectedlyClosed = true;

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }
}

export default class PortConfiguration {

  appStorage: AppStorage;

  config = new Config();

  baudRateInputValue = this.config.baudRate.toString();

  /**
   * Set min. baud rate to 1 and max. baud rate to 2,000,000. Most systems won't actually
   * support these ranges but let's not limit the user (they don't normally error if an unsupported
   * number is provided, it just doesn't work correctly).
   */
  baudRateValidation = z.coerce.number().int().min(1).max(2000000);
  baudRateErrorMsg = '';

  constructor(appStorage: AppStorage) {
    this.appStorage = appStorage;
    this._loadConfig();
    makeAutoObservable(this);
  }

  setBaudRate = (baudRate: number) => {
    this.config.baudRate = baudRate;
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
    this.config.numDataBits = numDataBits;
    this._saveConfig();
  }

  setParity = (parity: Parity) => {
    this.config.parity = parity;
    this._saveConfig();
  }

  setStopBits = (stopBits: StopBits) => {
    this.config.stopBits = stopBits;
    this._saveConfig();
  }

  setConnectToSerialPortAsSoonAsItIsSelected = (value: boolean) => {
    this.config.connectToSerialPortAsSoonAsItIsSelected = value;
    this._saveConfig();
  }

  setResumeConnectionToLastSerialPortOnStartup = (value: boolean) => {
    this.config.resumeConnectionToLastSerialPortOnStartup = value;
    this._saveConfig();
  }

  setReopenSerialPortIfUnexpectedlyClosed = (value: boolean) => {
    this.config.reopenSerialPortIfUnexpectedlyClosed = value;
    this._saveConfig();
  }

  _loadConfig = () => {
    let deserializedConfig = this.appStorage.getConfig(CONFIG_KEY);

    //===============================================
    // UPGRADE PATH
    //===============================================
    if (deserializedConfig === null) {
      // No data exists, create
      console.log(`No config found in local storage for key ${CONFIG_KEY}. Creating...`);
      this._saveConfig();
      return;
    } else if (deserializedConfig.version === this.config.version) {
      console.log(`Up-to-date config found for key ${CONFIG_KEY}.`);
    } else {
      console.error(`Out-of-date config version ${deserializedConfig.version} found for key ${CONFIG_KEY}.` +
                    ` Updating to version ${this.config.version}.`);
      this._saveConfig();
    }

    // At this point we are confident that the deserialized config matches what
    // this classes config object wants, so we can go ahead and update.
    updateConfigFromSerializable(deserializedConfig, this.config);

    this.setBaudRateInputValue(this.config.baudRate.toString());
  };

  _saveConfig = () => {
    const serializableConfig = createSerializableObjectFromConfig(this.config);
    this.appStorage.saveConfig(CONFIG_KEY, serializableConfig);
  };

  /**
   * Computed value which represents the serial port config in short hand,
   * e.g. "115200 8n1"
   *
   * @returns The short hand serial port config for displaying.
   */
  get shortSerialConfigName() {
    let output = '';
    output += this.config.baudRate.toString();
    output += ' ';
    // output += this.selectedNumDataBits.toString();
    // output += this.selectedParity[0];
    // output += this.selectedStopBits.toString();
    output += '8n1'; // TODO: Fix this
    return output;
  }
}


