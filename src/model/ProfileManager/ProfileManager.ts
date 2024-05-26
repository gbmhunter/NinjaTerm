import { makeAutoObservable } from "mobx";
import { DisplaySettingsConfig } from "../Settings/DisplaySettings/DisplaySettings";
import { GeneralSettingsConfig } from "../Settings/GeneralSettings/GeneralSettings";
import { PortConfigurationConfig } from "../Settings/PortConfigurationSettings/PortConfigurationSettings";
import { RxSettingsConfig } from "../Settings/RxSettings/RxSettings";
import { TxSettingsConfig } from "../Settings/TxSettings/TxSettings";
import { MacroControllerConfig } from "../Terminals/RightDrawer/Macros/MacroController";

export class RootConfig {

  version = 1;

  terminal = {
    'macroController': new MacroControllerConfig(),
  };

  settings = {
    'portSettings': new PortConfigurationConfig(),
    'txSettings': new TxSettingsConfig(),
    'rxSettings': new RxSettingsConfig(),
    'displaySettings': new DisplaySettingsConfig(),
    'generalSettings': new GeneralSettingsConfig(),
  };
}


/**
 * This class represents a serial port profile. It is used to store use-specific
 * settings for the application (e.g. all the settings to talk to a particular
 * embedded device). The class is serializable to JSON.
 */
export class Profile {
  name: string = '';
  rootConfig: RootConfig = new RootConfig();

  constructor(name: string = 'Default profile') {
    this.name = name;
  }
}

export class ProfileManagerData {
  profiles: Profile[] = [];

  currentAppConfig: RootConfig = new RootConfig();
}

export class ProfileManager {
  profiles: Profile[] = [];

  // activeProfile: Profile;

  /**
   * Represents the current application configuration. This is saved regularly so that when the app reloads,
   * it can restore the last known configuration.
   */
  currentAppConfig: RootConfig = new RootConfig();

  callbacks: (() => void)[] = [];

  constructor() {
    // Read in configurations
    const profileManagerDataJson = window.localStorage.getItem('profileManagerData');
    let profileManagerData: ProfileManagerData;
    if (profileManagerDataJson === null) {
      // No config key found in users store, create one!
      profileManagerData = new ProfileManagerData();
      // Save just-created config back to store. Not strictly needed as it
      // will be saved as soon as any changes are made, but this feels
      // cleaner.
      window.localStorage.setItem('profiles', JSON.stringify(this.profiles));
    } else {
      profileManagerData = JSON.parse(profileManagerDataJson);
    }
    // Only support the 1 active config for now
    // this.activeProfile = this.profiles[0];

    // Load data into class
    this.profiles = profileManagerData.profiles;
    this.currentAppConfig = profileManagerData.currentAppConfig;

    makeAutoObservable(this);
  }

  setActiveProfile = (profile: Profile) => {
    // this.activeProfile = profile;
    // Need to tell the rest of the app to update
    this.callbacks.forEach((callback) => {
      callback();
    });
  }

  registerForProfileChange = (callback: () => void) => {
    this.callbacks.push(callback);
  }

  _saveData = () => {
    console.log('Saving profile manager data...');
    let profileManagerData = new ProfileManagerData();
    profileManagerData.profiles = this.profiles;
    profileManagerData.currentAppConfig = this.currentAppConfig;
    window.localStorage.setItem('profileManagerData', JSON.stringify(profileManagerData));
  }

  /**
   * Save all profiles to local storage.
   */
  saveAppConfig = () => {
    this._saveData();
  }

  newProfile = () => {
    const newProfile = new Profile();
    this.profiles.push(newProfile);
    this.saveAppConfig();
  }
}
