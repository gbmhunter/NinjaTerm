// import PortInfo from '@serialport/bindings-interface';

import { makeAutoObservable } from 'mobx';

// eslint-disable-next-line import/no-cycle
import { App } from '../App';
import DataProcessingSettings from './DataProcessingSettings';

export type StopBits = 1 | 1.5 | 2;

export enum SettingsCategories {
  PORT_CONFIGURATION,
  DATA_PROCESSING,
}

export class Settings {
  app: App;

  activeSettingsCategory: SettingsCategories =
    SettingsCategories.PORT_CONFIGURATION;

  dataProcessing: DataProcessingSettings;

  selectedPortPath = '';

  // availablePortInfos: PortInfo.PortInfo[] = [];

  // Commonly-available baud rates as mentioned at https://serialport.io/docs/api-stream/
  baudRates = [
    110, 300, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200,
  ];

  selectedBaudRate = 115200;

  numDataBitsOptions = [5, 6, 7, 8];

  selectedNumDataBits = 8;

  parityOptions = ['none', 'even', 'odd'];

  selectedParity = 'none';

  stopBitOptions: StopBits[] = [1, 2];

  selectedStopBits: StopBits = 1;

  constructor(app: App) {
    this.app = app;
    this.dataProcessing = new DataProcessingSettings(app);
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  /** Computed value which represents the serial port config in short hand,
   * e.g. "115200 8n1"
   */
  get shortSerialConfigName() {
    let output = '';
    output += this.selectedBaudRate.toString();
    output += ' ';
    output += this.selectedNumDataBits.toString();
    output += this.selectedParity[0];
    output += this.selectedStopBits.toString();
    return output;
  }

  setActiveSettingsCategory(settingsCategory: SettingsCategories) {
    this.activeSettingsCategory = settingsCategory;
  }

  setSelectedPortPath(selectedPortPath: string) {
    this.selectedPortPath = selectedPortPath;
  }

  setSelectedBaudRate(baudRate: number) {
    this.selectedBaudRate = baudRate;
  }

  setSelectedNumDataBits(numDataBits: number) {
    this.selectedNumDataBits = numDataBits;
  }

  setSelectedParity(parity: string) {
    this.selectedParity = parity;
  }

  setSelectedStopBits(stopBits: StopBits) {
    this.selectedStopBits = stopBits;
  }
}
