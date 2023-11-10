import { App, PortState } from "src/App";

class LastUsedSerialPort {
  serialPortInfo: Partial<SerialPortInfo> = {};
  portState: PortState = PortState.CLOSED;
}

class Data {
  lastUsedSerialPort: LastUsedSerialPort = new LastUsedSerialPort();
}

class Config {
  name: string = '';
  configData: any = {};
}

export default class AppStorage {

  app: App;

  data: Data = new Data();

  configs: Config[] = [];

  activeConfig: Config;

  constructor(app: App) {
    this.app = app;

    const dataStr = window.localStorage.getItem('data');
    if (dataStr !== null) {
      this.data = JSON.parse(dataStr);
      if (this.data.lastUsedSerialPort === undefined) {
        this.data.lastUsedSerialPort = new LastUsedSerialPort();
      }
    }

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

    this.saveConfig2(['test1', 'test2'], 'hello');
  }

  saveData = () => {
    window.localStorage.setItem('data', JSON.stringify(this.data));
  }

  saveConfig(key: string, data: any) {
    window.localStorage.setItem(key, JSON.stringify(data));
  }

  getConfig(key: string): any {
    const dataStr = window.localStorage.getItem(key);
    if (dataStr !== null) {
      return JSON.parse(dataStr);
    }
    return null;
  }

  saveConfig2(keys: string[], data: any) {
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
    // window.localStorage.setItem(key, JSON.stringify(data));
  }



}
