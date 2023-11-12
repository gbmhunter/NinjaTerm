
class Config {
  name: string = '';
  configData: any = {};
}

export default class AppStorage {

  configs: Config[] = [];

  activeConfig: Config;

  constructor() {
    // Read in configurations
    const configsStr = window.localStorage.getItem('configs');
    if (configsStr === null) {
      const defaultConfig = new Config();
      this.configs.push(defaultConfig);
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
    obj[keys[keys.length - 1]] = data;
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
