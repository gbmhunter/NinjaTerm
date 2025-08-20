import { makeAutoObservable } from "mobx";

import { Profile } from "./Profile";
import { RootConfig } from "./RootConfig";

export const LATEST_VERSION = 4;

export class AppData {
  // Version of the AppData class.
  // Increment this whenever the AppData class structure changes.
  version = LATEST_VERSION;

  profiles: Profile[] = [];

  /**
   * Represents the current application configuration. This is saved regularly so that when the app reloads,
   * it can restore the last known configuration.
   */
  currentAppConfig = new RootConfig();

  /**
   * Flag to track whether the user has dismissed the promotional modal for the installable version.
   * If true, the modal will not be shown again.
   */
  hideInstallableVersionPromo: boolean = false;

  constructor() {
    this.profiles = [];
    this.profiles.push(new Profile('Default profile'));
    makeAutoObservable(this);
  }
}
