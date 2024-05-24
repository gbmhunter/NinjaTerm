
/**
 * This class represents a serial port profile. It is used to store use-specific
 * settings for the application (e.g. all the settings to talk to a particular
 * embedded device). The class is serializable to JSON.
 */
class Profile {
  name: string = '';
  configData: any = {};

  constructor(name: string = 'Default profile') {
    this.name = name;
  }
}

/**
 * This class manages the local storage (persistance browser based key/object data store)
 * for the application. It is used to store both general data (saveData/getData) and configurations
 * (saveConfig/getConfig).
 */
export default class AppStorage {

  profiles: Profile[] = [];

  activeProfile: Profile;

  constructor() {
    // Read in configurations
    const profilesJson = window.localStorage.getItem('configs');
    if (profilesJson === null) {
      // No config key found in users store, create one!
      const defaultConfig = new Profile();
      this.profiles.push(defaultConfig);
      // Save just-created config back to store. Not strictly needed as it
      // will be saved as soon as any changes are made, but this feels
      // cleaner.
      window.localStorage.setItem('configs', JSON.stringify(this.profiles));
    } else {
      this.profiles = JSON.parse(profilesJson);
    }
    // Only support the 1 active config for now
    this.activeProfile = this.profiles[0];

  }

  /**
   * Saves arbitrary data to local storage. Settings should be stored using
   * saveConfig/getConfig instead.
   * @param key The key to save the data at.
   * @param data The data to save.
   */
  saveData = (key: string, data: any) => {
    window.localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Gets arbitrary data from local storage. Settings should be retrieved using
   * saveConfig/getConfig instead.
   *
   * @param key The key to retrieve data from.
   * @returns The data, or null if not found.
   */
  getData = (key: string): any => {
    const value = window.localStorage.getItem(key);
    if (value === null) {
      return null;
    }
    return JSON.parse(value);
  }

  getProfiles(): Profile[] {
    return this.profiles;
  }

  /**
   * Saves a particular setting to the active config. This is stored
   * in the local storage of the browser.
   *
   * @param keys Array of strings the defines the "path" to the setting. If various
   * parts of the key do not exist, empty objects will be created.
   * @param data The data to save. This must be serializable to JSON.
   */
  saveConfig(keys: string[], data: any) {
    let obj = this.activeProfile.configData;
    // Walk down the active config object using
    // the array of keys
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      // Make sure key exists, if not
      // create it
      if (obj[key] === undefined) {
        obj[key] = {};
      }
      obj = obj[key];
    }
    // If no keys were provided, we are writing to the entire
    // config object
    if (keys.length === 0) {
      this.activeProfile.configData = data;
    } else {
      obj[keys[keys.length - 1]] = data;
    }
    const valueToWrite = JSON.stringify(this.profiles);
    window.localStorage.setItem('configs', valueToWrite);
  }

  /**
   * Gets a particular setting from the active config.
   *
   * @param keys Array of strings the defines the "path" to the setting.
   * @returns The value of the setting, or null if not found.
   */
  getConfig(keys: string[]): any {
    let obj = this.activeProfile.configData;
    // Walk down the active config object using
    // the array of keys
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // Make sure key exists, if not
      // create it
      if (obj[key] === undefined) {
        return null;
      }
      obj = obj[key];
    }
    return obj;
  }
}
