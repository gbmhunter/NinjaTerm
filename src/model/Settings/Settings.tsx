// import PortInfo from '@serialport/bindings-interface';

import { makeAutoObservable } from 'mobx';

// eslint-disable-next-line import/no-cycle
import TxSettings from './TxSettings/TxSettings';
import RxSettings from './RxSettings/RxSettings';
import DisplaySettings from './DisplaySettings/DisplaySettings';
import PortConfiguration from './PortConfigurationSettings/PortConfigurationSettings';
import GeneralSettings from './GeneralSettings/GeneralSettings';
import FakePortsController from 'src/model/FakePorts/FakePortsController';
import ProfilesSettings from './ProfileSettings/ProfileSettings';
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
  constructor(profileManager: ProfileManager, fakePortController: FakePortsController) {
    this.fakePortsController = fakePortController;

    this.portConfiguration = new PortConfiguration(profileManager);
    this.txSettings = new TxSettings(profileManager);
    this.rxSettings = new RxSettings(profileManager);
    this.displaySettings = new DisplaySettings(profileManager);
    this.generalSettings = new GeneralSettings(profileManager);
    this.profilesSettings = new ProfilesSettings(profileManager);
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
