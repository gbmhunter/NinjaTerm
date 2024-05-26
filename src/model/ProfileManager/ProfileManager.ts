import { makeAutoObservable } from "mobx";
import { DisplaySettingsConfig } from "../Settings/DisplaySettings/DisplaySettings";
import { GeneralSettingsConfig } from "../Settings/GeneralSettings/GeneralSettings";
import { PortConfigurationConfig } from "../Settings/PortConfigurationSettings/PortConfigurationSettings";
import { RxSettingsConfig } from "../Settings/RxSettings/RxSettings";
import { TxSettingsConfig } from "../Settings/TxSettings/TxSettings";
import { MacroControllerConfig } from "../Terminals/RightDrawer/Macros/MacroController";
import { App } from "../App";

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
    makeAutoObservable(this);
  }
}

const PROFILES_STORAGE_KEY = 'profiles';

export class ProfileManager {

  app: App;

  profiles: Profile[] = [];

  // activeProfile: Profile;

  /**
   * Represents the current application configuration. This is saved regularly so that when the app reloads,
   * it can restore the last known configuration.
   */
  currentAppConfig: RootConfig = new RootConfig();

  callbacks: (() => void)[] = [];

  constructor(app: App) {

    this.app = app;

    addEventListener("storage", (event) => {
      console.log("Caught storage event. event.key: ", event.key, " event.newValue: ", event.newValue);

      if (event.key === PROFILES_STORAGE_KEY) {
        console.log('Profiles changed. Reloading...');
        this._loadProfilesFromStorage();
      }
    });

    // Read in profiles
    this._loadProfilesFromStorage();

    // Load current app config
    const currentAppConfigJson = window.localStorage.getItem('currentAppConfig');
    let currentAppConfig: RootConfig;
    if (currentAppConfigJson === null) {
      // No config key found in users store, create one!
      currentAppConfig = new RootConfig();
      // Save just-created config back to store.
      window.localStorage.setItem('currentAppConfig', JSON.stringify(this.currentAppConfig));
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

  _loadProfilesFromStorage = () => {
    const profilesJson = window.localStorage.getItem(PROFILES_STORAGE_KEY);
    // let profileManagerData: ProfileManagerData;
    let profiles: Profile[];
    if (profilesJson === null) {
      // No config key found in users store, create one!
      profiles = [];
      profiles.push(new Profile('Default profile'));
      console.log('No profiles found in local storage. Creating default profile.');
      // Save just-created config back to store.
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

  /**
   * Save all profiles to local storage.
   */
  saveAppConfig = () => {
    console.log('Saving app config...');
    window.localStorage.setItem('currentAppConfig', JSON.stringify(this.currentAppConfig));
  }

  /**
   * Create a new profile (with default config) and add it to the list of profiles.
   */
  newProfile = () => {
    const newProfile = new Profile('New profile');
    this.profiles.push(newProfile);
    this.saveProfiles();
  }

  /**
   * Apply the profile at the provided index to the current app config (i.e. update the app
   * to reflect the profile).
   * @param profileIdx The index of the profile to apply to the app.
   */
  applyProfileToApp = (profileIdx: number) => {
    const profile = this.profiles[profileIdx];
    // Update the current app config from the provided profile,
    // and then save this new app config
    this.currentAppConfig = JSON.parse(JSON.stringify(profile.rootConfig));
    this.saveAppConfig();

    // Need to tell the rest of the app to update
    this.callbacks.forEach((callback) => {
      callback();
    });

    // Post message to snackbar
    this.app.snackbar.sendToSnackbar('Profile "' + profile.name + '" loaded.', 'success');
  }

  /**
   * Save the current app config to the provided profile and the save the profiles to local storage.
   * @param profileIdx The index of the profile to save the current app config to.
   */
  saveCurrentAppConfigToProfile = (profileIdx: number) => {
    console.log('Saving current app config to profile...');
    const profile = this.profiles[profileIdx];
    profile.rootConfig = JSON.parse(JSON.stringify(this.currentAppConfig));
    this.saveProfiles();

    // Post message to snackbar
    this.app.snackbar.sendToSnackbar('Profile "' + profile.name + '" saved.', 'success');
  }
}
