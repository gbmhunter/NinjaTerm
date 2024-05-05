import { makeAutoObservable } from "mobx";

import AppStorage from "src/model/Storage/AppStorage";
import { createSerializableObjectFromConfig, updateConfigFromSerializable } from "src/model/Util/SettingsLoader";

class Config {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 1;

  // COPY/PASTE SETTINGS
  whenPastingOnWindowsReplaceCRLFWithLF = true;
  whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }
}

const CONFIG_KEY = ["settings", "general-settings"];

export default class RxSettings {
  appStorage: AppStorage;

  config = new Config();

  constructor(appStorage: AppStorage) {
    this.appStorage = appStorage;
    this.loadSettings();
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  loadSettings = () => {
    let config = this.appStorage.getConfig(CONFIG_KEY);

    // UPGRADE PATH
    //===============================================

    if (config === null) {
      // No data exists, create
      console.log("No rx-settings config found in local storage. Creating...");
      this.saveSettings();
      return;
    } else if (config.version === 1) {
      console.log("Up-to-date config found");
    } else {
      console.error("Unknown config version found: ", config.version);
      this.saveSettings();
    }

    // At this point we a confident that config represents the latest version, so
    // we can go ahead and update all the app settings with the values from the config object
    updateConfigFromSerializable(config, this.config);
  };

  saveSettings = () => {
    console.log("Saving RX settings config. config:", JSON.stringify(this.config));
    const serializableConfig = createSerializableObjectFromConfig(this.config);
    this.appStorage.saveConfig(CONFIG_KEY, serializableConfig);
  };

  setWhenPastingOnWindowsReplaceCRLFWithLF = (value: boolean) => {
    this.config.whenPastingOnWindowsReplaceCRLFWithLF = value;
    this.saveSettings();
  };

  setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = (value: boolean) => {
    this.config.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = value;
    this.saveSettings();
  };
}
