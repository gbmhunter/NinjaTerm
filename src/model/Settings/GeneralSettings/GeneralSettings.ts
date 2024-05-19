import { makeAutoObservable } from "mobx";

import AppStorage from "src/model/Storage/AppStorage";
import { createSerializableObjectFromConfig, updateConfigFromSerializable } from "src/model/Util/SettingsLoader";

const CONFIG_KEY = ['settings', 'general-settings'];

class Config {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 1;

  whenPastingOnWindowsReplaceCRLFWithLF = true;
  whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }
}

export default class RxSettings {
  appStorage: AppStorage;

  config = new Config();

  constructor(appStorage: AppStorage) {
    this.appStorage = appStorage;
    this._loadConfig();
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  setWhenPastingOnWindowsReplaceCRLFWithLF = (value: boolean) => {
    this.config.whenPastingOnWindowsReplaceCRLFWithLF = value;
    this._saveConfig();
  };

  setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = (value: boolean) => {
    this.config.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = value;
    this._saveConfig();
  };

  _loadConfig = () => {
    let deserializedConfig = this.appStorage.getConfig(CONFIG_KEY);

    //===============================================
    // UPGRADE PATH
    //===============================================
    if (deserializedConfig === null) {
      // No data exists, create
      console.log(`No config found in local storage for key ${CONFIG_KEY}. Creating...`);
      this._saveConfig();
      return;
    } else if (deserializedConfig.version === this.config.version) {
      console.log(`Up-to-date config found for key ${CONFIG_KEY}.`);
    } else {
      console.error(`Out-of-date config version ${deserializedConfig.version} found for key ${CONFIG_KEY}.` +
                    ` Updating to version ${this.config.version}.`);
      this._saveConfig();
      deserializedConfig = this.appStorage.getConfig(CONFIG_KEY);
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
