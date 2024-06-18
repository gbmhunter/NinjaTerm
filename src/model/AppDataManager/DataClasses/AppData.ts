import { makeAutoObservable } from "mobx";
import { ProfileV2, ProfileV3 } from "./Profile";
import { RootConfigV2, RootConfigV3 } from "./RootConfig";

/**
 * This class represents all the data that the app needs to store/load from
 * local storage (i.e. the root object). It must be serializable to JSON.
 */
export class AppDataV1 {

  version = 1;

  profiles: ProfileV2[] = [];

  /**
   * Represents the current application configuration. This is saved regularly so that when the app reloads,
   * it can restore the last known configuration.
   */
  currentAppConfig: RootConfigV2 = new RootConfigV2();

  constructor() {
    makeAutoObservable(this);
  }
}

export class AppDataV2 {

  version = 2;

  profiles: ProfileV3[] = [];

  /**
   * Represents the current application configuration. This is saved regularly so that when the app reloads,
   * it can restore the last known configuration.
   */
  currentAppConfig: RootConfigV3 = new RootConfigV3();

  constructor() {
    this.profiles = [];
    this.profiles.push(new ProfileV3('Default profile'));
    makeAutoObservable(this);
  }
}
