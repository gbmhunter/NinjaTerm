import PortInfo from '@serialport/bindings-interface';

import { makeAutoObservable } from 'mobx';

export type StopBits = 1 | 1.5 | 2;

export enum SettingsCategories {
  PORT_CONFIGURATION,
  DATA_PROCESSING,
}

export class SettingsStore {
  activeSettingsCategory: SettingsCategories =
    SettingsCategories.PORT_CONFIGURATION;

  selectedPortPath = '';

  availablePortInfos: PortInfo.PortInfo[] = [];

  // Commonly-available baud rates as mentioned at https://serialport.io/docs/api-stream/
  baudRates = [
    110, 300, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200,
  ];

  selectedBaudRate = 115200;

  numDataBitsOptions = [5, 6, 7, 8];

  selectedNumDataBits = 8;

  parityOptions = ['none', 'even', 'mark', 'odd', 'space'];

  selectedParity = 'none';

  stopBitOptions: StopBits[] = [1, 2];

  selectedStopBits: StopBits = 1;

  constructor() {
    makeAutoObservable(this);
  }

  setActiveSettingsCategory(settingsCategory: SettingsCategories) {
    this.activeSettingsCategory = settingsCategory;
  }

  setSelectedPortPath(selectedPortPath: string) {
    this.selectedPortPath = selectedPortPath;
  }

  setAvailablePortInfos(availablePortInfos: PortInfo.PortInfo[]) {
    this.availablePortInfos = availablePortInfos;
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
