import { makeAutoObservable } from 'mobx';

import { App } from 'src/model/App';
import AppStorage from 'src/model/Storage/AppStorage';
import { createSerializableObjectFromConfig, updateConfigFromSerializable } from 'src/model/Util/SettingsLoader';

export enum PortState {
  CLOSED,
  CLOSED_BUT_WILL_REOPEN,
  OPENED
}

const CONFIG_KEY = ['settings', 'port-configuration-settings'];

class Config {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 1;

  connectToSerialPortAsSoonAsItIsSelected = true;

  resumeConnectionToLastSerialPortOnStartup = true;

  reopenSerialPortIfUnexpectedlyClosed = true;

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }
}

export default class PortConfiguration {

  appStorage: AppStorage;

  config = new Config();

  constructor(appStorage: AppStorage) {
    this.appStorage = appStorage;
    this._loadConfig();
    makeAutoObservable(this);
  }

  setConnectToSerialPortAsSoonAsItIsSelected = (value: boolean) => {
    this.config.connectToSerialPortAsSoonAsItIsSelected = value;
    this._saveConfig();
  }

  setResumeConnectionToLastSerialPortOnStartup = (value: boolean) => {
    this.config.resumeConnectionToLastSerialPortOnStartup = value;
    this._saveConfig();
  }

  setReopenSerialPortIfUnexpectedlyClosed = (value: boolean) => {
    this.config.reopenSerialPortIfUnexpectedlyClosed = value;
    this._saveConfig();
  }

  _loadConfig = () => {
    let deserializedConfig = this.appStorage.getConfig(CONFIG_KEY);

    // UPGRADE PATH
    //===============================================

    if (deserializedConfig === null) {
      // No data exists, create
      console.log("No rx-settings config found in local storage. Creating...");
      this._saveConfig();
      return;
    } else if (deserializedConfig.version === 1) {
      console.log("Up-to-date config found");
    } else {
      console.error("Unknown config version found: ", deserializedConfig.version);
      this._saveConfig();
    }

    // At this point we are confident that the deserialized config matches what
    // this classes config object wants, so we can go ahead and update.
    updateConfigFromSerializable(deserializedConfig, this.config);
  };

  _saveConfig = () => {
    const serializableConfig = createSerializableObjectFromConfig(this.config);
    this.appStorage.saveConfig(CONFIG_KEY, serializableConfig);
  };
}


