import { makeAutoObservable } from "mobx";
import { RootConfigV2, RootConfigV3 } from "./RootConfig";

/**
 * This class represents all the data stored in a user profile. It is used to store use-specific
 * settings for the application (e.g. all the settings to talk to a particular
 * embedded device). The class is serializable to JSON.
 */
export class ProfileV2 {
  name: string = '';
  rootConfig: RootConfigV2 = new RootConfigV2();

  constructor(name: string) {
    this.name = name;
    makeAutoObservable(this);
  }
}

export class ProfileV3 {
  name: string = '';
  rootConfig: RootConfigV3 = new RootConfigV3();

  constructor(name: string) {
    this.name = name;
    makeAutoObservable(this);
  }
}
