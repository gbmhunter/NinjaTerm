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
  currentAppConfig = new RootConfig();

  constructor() {
    this.profiles = [];
    this.profiles.push(new Profile('Default profile'));
    makeAutoObservable(this);
  }
}
