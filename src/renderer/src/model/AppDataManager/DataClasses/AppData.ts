import { makeAutoObservable } from "mobx";

import { Profile } from "./Profile";
import { ProfileConfig } from "./ProfileConfig";

export const LATEST_VERSION = 7;

export class AppData {
  // Version of the AppData class.
  // Increment this whenever the AppData class structure changes.
  version = LATEST_VERSION;

  profiles: Profile[] = [];

  /**
   * Represents the current application configuration. This is saved regularly so that when the app reloads,
   * it can restore the last known configuration.
   */
  currentAppConfig = new ProfileConfig();

  /**
   * Global app setting for enabling/disabling automatic updates.
   * This is stored at the app level rather than per-profile since it affects the entire application.
   */
  autoUpdatesEnabled = true;

  constructor() {
    this.profiles = [];
    this.profiles.push(new Profile('Default profile'));
    makeAutoObservable(this);
  }
}
