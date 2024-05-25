// import PortInfo from '@serialport/bindings-interface';

import { makeAutoObservable } from 'mobx';

// eslint-disable-next-line import/no-cycle
import TxSettings from './TxSettings/TxSettings';
import RxSettings from './RxSettings/RxSettings';
import DisplaySettings from './DisplaySettings/DisplaySettings';
import PortConfiguration from './PortConfigurationSettings/PortConfigurationSettings';
import GeneralSettings from './GeneralSettings/GeneralSettings';
import AppStorage from '../Storage/AppStorage';
import FakePortsController from 'src/model/FakePorts/FakePortsController';
import ProfilesSettings from './ProfilesSettings/ProfilesSettings';
import { ProfileManager } from '../ProfileManager/ProfileManager';



export enum SettingsCategories {
  PORT_CONFIGURATION,
  TX_SETTINGS,
  RX_SETTINGS,
  DISPLAY,
  GENERAL,
  PROFILES,
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

  profilesSettings: ProfilesSettings;

  /**
   * Constructor for the Settings class.
   *
   * @param appStorage Needed to load/save settings into local storage.
   * @param fakePortController Needed to show the hidden fake port dialog.
   */
  constructor(appStorage: AppStorage, profileManager: ProfileManager, fakePortController: FakePortsController) {
    this.appStorage = appStorage;
    this.fakePortsController = fakePortController;

    this.portConfiguration = new PortConfiguration(appStorage, profileManager);
    this.txSettings = new TxSettings(appStorage, profileManager);
    this.rxSettings = new RxSettings(appStorage, profileManager);
    this.displaySettings = new DisplaySettings(appStorage, profileManager);
    this.generalSettings = new GeneralSettings(appStorage, profileManager);
    this.profilesSettings = new ProfilesSettings();
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  setActiveSettingsCategory(settingsCategory: SettingsCategories) {
    this.activeSettingsCategory = settingsCategory;
  }

  onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // console.log(event);
    if (event.key === 'f') {
      this.fakePortsController.setIsDialogOpen(true);
    }
  }
}
