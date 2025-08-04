import { makeAutoObservable } from "mobx";
import { ProfileConfig } from "./ProfileConfig";

/**
 * This class represents all the data stored in a user profile. It is used to store use-specific
 * settings for the application (e.g. all the settings to talk to a particular
 * embedded device). The class is serializable to JSON.
 */
export class Profile {
  name: string = '';
  rootConfig: ProfileConfig;

  constructor(name: string) {
    this.name = name;
    this.rootConfig = new ProfileConfig();
    makeAutoObservable(this);
  }
}
