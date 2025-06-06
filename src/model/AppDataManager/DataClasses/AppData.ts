import { makeAutoObservable } from "mobx";

import { Profile } from "./Profile";
import { RootConfig } from "./RootConfig";

export const LATEST_VERSION = 3;

export class AppData {

  version = LATEST_VERSION;

  profiles: Profile[] = [];

  /**
   * Represents the current application configuration. This is saved regularly so that when the app reloads,
   * it can restore the last known configuration.
   */
  currentAppConfig: RootConfig;

  constructor() {
    this.currentAppConfig = new RootConfig();
    if (this.currentAppConfig && this.currentAppConfig.settings && this.currentAppConfig.settings.displaySettings) {
      console.log('AppData constructor - displaySettings.defaultBackgroundColor:', this.currentAppConfig.settings.displaySettings.defaultBackgroundColor);
      console.log('AppData constructor - displaySettings.defaultTxTextColor:', this.currentAppConfig.settings.displaySettings.defaultTxTextColor);
      console.log('AppData constructor - displaySettings.defaultRxTextColor:', this.currentAppConfig.settings.displaySettings.defaultRxTextColor);
      console.log('AppData constructor - displaySettings object:', this.currentAppConfig.settings.displaySettings);
    } else {
      console.error('AppData constructor - displaySettings is not correctly initialized!');
    }

    this.profiles = [];
    this.profiles.push(new Profile('Default profile'));
    makeAutoObservable(this);
  }
}
