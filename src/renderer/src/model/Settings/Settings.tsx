// import PortInfo from '@serialport/bindings-interface';

import { makeAutoObservable } from 'mobx';

import TxSettings from './TxSettings/TxSettings';
import RxSettings from './RxSettings/RxSettings';
import DisplaySettings from './DisplaySettings/DisplaySettings';
import { PortSettings } from './PortSettings/PortSettings';
import GeneralSettings from './GeneralSettings/GeneralSettings';
import RulesSettings from './RulesSettings/RulesSettings';
import { App } from '../App';

export enum SettingsCategories {
  CONNECTION_CONFIGURATION,
  TX_SETTINGS,
  RX_SETTINGS,
  DISPLAY,
  GENERAL,
  PROFILES,
  RULES,
}

export class Settings {

  app: App;

  activeSettingsCategory: SettingsCategories =
    SettingsCategories.CONNECTION_CONFIGURATION;

  portConfiguration: PortSettings;

  txSettings: TxSettings;

  rxSettings: RxSettings;

  displaySettings: DisplaySettings;

  generalSettings: GeneralSettings;


  rulesSettings: RulesSettings;

  /**
   * Constructor for the Settings class.
   *
   * @param appStorage Needed to load/save settings into local storage.
   * @param fakePortController Needed to show the hidden fake port dialog.
   */
  constructor(app: App) {
    this.app = app;

    this.portConfiguration = new PortSettings(this.app);
    this.txSettings = new TxSettings(this.app.profileManager);
    this.rxSettings = new RxSettings(this.app.profileManager);
    this.displaySettings = new DisplaySettings(this.app.profileManager);
    this.generalSettings = new GeneralSettings(this.app.profileManager);
    this.rulesSettings = new RulesSettings(this.app.profileManager);
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  setActiveSettingsCategory(settingsCategory: SettingsCategories) {
    this.activeSettingsCategory = settingsCategory;
  }

  onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // console.log(event);
    if (event.key === 'f') {
      this.app.fakePortController.setIsDialogOpen(true);
    }
  }
}
