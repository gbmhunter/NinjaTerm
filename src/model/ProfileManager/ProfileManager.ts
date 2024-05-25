import { DisplaySettingsConfig } from "../Settings/DisplaySettings/DisplaySettings";
import { GeneralSettingsConfig } from "../Settings/GeneralSettings/GeneralSettings";
import { PortConfigurationConfig } from "../Settings/PortConfigurationSettings/PortConfigurationSettings";
import { RxSettingsConfig } from "../Settings/RxSettings/RxSettings";
import { TxSettingsConfig } from "../Settings/TxSettings/TxSettings";

export class RootConfig {

  version = 1;

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

export class ProfileManager {
  profiles: Profile[] = [];

  activeProfile: Profile;

  callbacks: (() => void)[] = [];

  constructor() {
    // Read in configurations
    const profilesJson = window.localStorage.getItem('profiles');
    if (profilesJson === null) {
      // No config key found in users store, create one!
      const defaultProfile = new Profile();
      this.profiles.push(defaultProfile);
      // Save just-created config back to store. Not strictly needed as it
      // will be saved as soon as any changes are made, but this feels
      // cleaner.
      window.localStorage.setItem('profiles', JSON.stringify(this.profiles));
    } else {
      this.profiles = JSON.parse(profilesJson);
    }
    // Only support the 1 active config for now
    this.activeProfile = this.profiles[0];
  }

  setActiveProfile = (profile: Profile) => {
    this.activeProfile = profile;
    // Need to tell the rest of the app to update
    this.callbacks.forEach((callback) => {
      callback();
    });
  }

  registerForProfileChange = (callback: () => void) => {
    this.callbacks.push(callback);
  }

  saveProfiles = () => {
    console.log('Saving profiles...');
    window.localStorage.setItem('profiles', JSON.stringify(this.profiles));
  }
}
