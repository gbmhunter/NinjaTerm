import { makeAutoObservable } from "mobx";
import { RootConfig } from "./RootConfig";

/**
 * This class represents all the data stored in a user profile. It is used to store use-specific
 * settings for the application (e.g. all the settings to talk to a particular
 * embedded device). The class is serializable to JSON.
 */
export class Profile {
  name: string = '';
  rootConfig: RootConfig = new RootConfig();

  constructor(name: string) {
    this.name = name;
    makeAutoObservable(this);
  }
}
