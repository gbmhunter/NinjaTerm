import { makeAutoObservable } from "mobx";

import AppStorage from "src/model/Storage/AppStorage";
import { createSerializableObjectFromConfig, updateConfigFromSerializable } from "src/model/Util/SettingsLoader";


export default class ProfilesSettings {

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

}
