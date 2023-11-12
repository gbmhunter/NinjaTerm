
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

  saveData2 = (key: string, data: any) => {
    console.log('saveData2() called with key:', key, 'and data:', data);
    window.localStorage.setItem(key, JSON.stringify(data));
  }

  getData2 = (key: string): any => {
    console.log('getData2() called with key:', key);
    const value = window.localStorage.getItem(key);
    if (value === null) {
      console.log('Returning null.');
      return null;
    }
    console.log('Returning value:', value);
    return JSON.parse(value);
  }

  saveConfig(keys: string[], data: any) {
    console.log('saveConfig() called with keys:', keys, 'and data:', data);
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
    console.log('configData:', JSON.stringify(this.activeConfig.configData));
    window.localStorage.setItem('configs', JSON.stringify(this.configs));
  }

  getConfig(keys: string[]): any {
    console.log('getConfig() called with keys:', keys);
    let obj = this.activeConfig.configData;
    // Walk down the active config object using
    // the array of keys
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      console.log('key:', key);
      // Make sure key exists, if not
      // create it
      if (obj[key] === undefined) {
        return null;
      }
      obj = obj[key];
    }
    console.log('Returning obj:', obj);
    return obj;
  }



}
