// import PortInfo from '@serialport/bindings-interface';

import { makeAutoObservable } from 'mobx';

// eslint-disable-next-line import/no-cycle
import { App } from '../App';
import DataProcessingSettings from './DataProcessingSettings';
import DisplaySettings from './Display/DisplaySettings';
import PortConfiguration from './PortConfiguration/PortConfiguration';

export type StopBits = 1 | 1.5 | 2;

export enum SettingsCategories {
  PORT_CONFIGURATION,
  DATA_PROCESSING,
  DISPLAY,
}

export class Settings {
  app: App;

  activeSettingsCategory: SettingsCategories =
    SettingsCategories.PORT_CONFIGURATION;

  portConfiguration: PortConfiguration;

  dataProcessingSettings: DataProcessingSettings;

  displaySettings: DisplaySettings;

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
    this.portConfiguration = new PortConfiguration(app);
    this.dataProcessingSettings = new DataProcessingSettings(app);
    this.displaySettings = new DisplaySettings(app);
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

  onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // console.log(event);
    if (event.key === 'f') {
      this.app.fakePortController.setIsDialogOpen(true);
    }
  }
}
