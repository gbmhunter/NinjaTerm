// import PortInfo from '@serialport/bindings-interface';

import { makeAutoObservable } from 'mobx';

// eslint-disable-next-line import/no-cycle
import { App } from '../App';
import TxSettings from './TxSettings/TxSettings';
import RxSettings from './RxSettings/RxSettings';
import DisplaySettings from './DisplaySettings/DisplaySettings';
import PortConfiguration from './PortConfigurationSettings/PortConfigurationSettings';
import GeneralSettings from './GeneralSettings/GeneralSettings';
import AppStorage from '../Storage/AppStorage';
import FakePortsController from 'src/model/FakePorts/FakePortsController';

export type StopBits = 1 | 1.5 | 2;

export enum SettingsCategories {
  PORT_CONFIGURATION,
  TX_SETTINGS,
  RX_SETTINGS,
  DISPLAY,
  GENERAL,
}

export class Settings {
  appStorage: AppStorage;

  fakePortsController: FakePortsController;

  activeSettingsCategory: SettingsCategories =
    SettingsCategories.PORT_CONFIGURATION;

  portConfiguration: PortConfiguration;

  txSettings: TxSettings;

  rxSettings: RxSettings;

  displaySettings: DisplaySettings;

  generalSettings: GeneralSettings;

  selectedPortPath = '';

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

  /**
   * Constructor for the Settings class.
   *
   * @param appStorage Needed to load/save settings into local storage.
   * @param fakePortController Needed to show the hidden fake port dialog.
   */
  constructor(appStorage: AppStorage, fakePortController: FakePortsController) {
    this.appStorage = appStorage;
    this.fakePortsController = fakePortController;

    this.portConfiguration = new PortConfiguration(appStorage);
    this.txSettings = new TxSettings(appStorage);
    this.rxSettings = new RxSettings(appStorage);
    this.displaySettings = new DisplaySettings(appStorage);
    this.generalSettings = new GeneralSettings(appStorage);
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  /**
   * Computed value which represents the serial port config in short hand,
   * e.g. "115200 8n1"
   *
   * @returns The short hand serial port config for displaying.
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
      this.fakePortsController.setIsDialogOpen(true);
    }
  }
}
