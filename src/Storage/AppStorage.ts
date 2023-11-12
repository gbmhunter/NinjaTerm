
class Config {
  name: string = '';
  configData: any = {};
}

/**
 * This class manages the local storage (persistance browser based key/object data store)
 * for the application. It is used to store both general data (saveData/getData) and configurations
 * (saveConfig/getConfig).
 */
export default class AppStorage {

  configs: Config[] = [];

  activeConfig: Config;

  constructor() {
    // Read in configurations
    const configsStr = window.localStorage.getItem('configs');
    if (configsStr === null) {
      // No config key found in users store, create one!
      const defaultConfig = new Config();
      this.configs.push(defaultConfig);
      // Save just-created config back to store. Not strictly needed as it
      // will be saved as soon as any changes are made, but this feels
      // cleaner.
      window.localStorage.setItem('configs', JSON.stringify(this.configs));
    } else {
      this.configs = JSON.parse(configsStr);
    }
    // Only support the 1 active config for now
    this.activeConfig = this.configs[0];

  }

  saveData = (key: string, data: any) => {
    window.localStorage.setItem(key, JSON.stringify(data));
  }

  getData = (key: string): any => {
    const value = window.localStorage.getItem(key);
    if (value === null) {
      return null;
    }
    return JSON.parse(value);
  }

  saveConfig(keys: string[], data: any) {
    let obj = this.activeConfig.configData;
    // Walk down the active config object using
    // the array of keys
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      console.log('key:', key);
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
      this.activeConfig.configData = data;
    } else {
      obj[keys[keys.length - 1]] = data;
    }
    window.localStorage.setItem('configs', JSON.stringify(this.configs));
  }

  getConfig(keys: string[]): any {
    let obj = this.activeConfig.configData;
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
