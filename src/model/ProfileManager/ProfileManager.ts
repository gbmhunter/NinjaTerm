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

  constructor(name: string) {
    this.name = name;
  }
}

const PROFILES_STORAGE_KEY = 'profiles';

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

    addEventListener("storage", (event) => {
      console.log("Caught storage event. event.key: ", event.key, " event.newValue: ", event.newValue);

      if (event.key === PROFILES_STORAGE_KEY) {
        console.log('Profiles changed. Reloading...');
        this._loadProfiles();
      }
    });

    // Read in profiles
    this._loadProfiles();

    // Load current app config
    const currentAppConfigJson = window.localStorage.getItem('currentAppConfig');
    let currentAppConfig: RootConfig;
    if (currentAppConfigJson === null) {
      // No config key found in users store, create one!
      currentAppConfig = new RootConfig();
      // Save just-created config back to store. Not strictly needed as it
      // will be saved as soon as any changes are made, but this feels
      // cleaner.
      // window.localStorage.setItem('currentAppConfig', JSON.stringify(this.currentAppConfig));
    } else {
      currentAppConfig = JSON.parse(currentAppConfigJson);
      console.log('Loading current app config from local storage. currentAppConfig: ', currentAppConfig);
    }
    this.currentAppConfig = currentAppConfig

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

  _loadProfiles = () => {
    const profilesJson = window.localStorage.getItem(PROFILES_STORAGE_KEY);
    // let profileManagerData: ProfileManagerData;
    let profiles: Profile[];
    if (profilesJson === null) {
      // No config key found in users store, create one!
      profiles = [];
      profiles.push(new Profile('Default profile')); // Create a
      console.log('No profiles found in local storage. Creating default profile.');
      // Save just-created config back to store. Not strictly needed as it
      // will be saved as soon as any changes are made, but this feels
      // cleaner.
      window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } else {
      profiles = JSON.parse(profilesJson);
    }
    // Only support the 1 active config for now
    // this.activeProfile = this.profiles[0];

    // Load data into class
    this.profiles = profiles;
  }

  saveProfiles = () => {
    console.log('Saving profiles...');
    window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(this.profiles));
  }

  _saveAppConfig = () => {
    console.log('Saving app config...');
    window.localStorage.setItem('currentAppConfig', JSON.stringify(this.currentAppConfig));
  }

  /**
   * Save all profiles to local storage.
   */
  saveAppConfig = () => {
    this._saveAppConfig();
  }

  newProfile = () => {
    const newProfile = new Profile('New profile');
    this.profiles.push(newProfile);
    this.saveProfiles();
  }
}
