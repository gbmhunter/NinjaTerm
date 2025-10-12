import { makeAutoObservable } from "mobx";
import { AppDataManager } from "src/model/AppDataManager/AppDataManager";

export default class SoundsSettings {
  profileManager: AppDataManager;

  playSoundsOnPassFail = false;

  constructor(profileManager: AppDataManager) {
    this.profileManager = profileManager;
    this._loadConfig();
    this.profileManager.registerOnProfileLoad(() => {
      this._loadConfig();
    });
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  setPlaySoundsOnPassFail = (value: boolean) => {
    this.playSoundsOnPassFail = value;
    this._saveConfig();
  };

  _saveConfig = () => {
    let config = this.profileManager.appData.currentAppConfig.settings.soundsSettings;

    config.playSoundsOnPassFail = this.playSoundsOnPassFail;

    this.profileManager.saveAppData();
  };

  _loadConfig = () => {
    let configToLoad = this.profileManager.appData.currentAppConfig.settings.soundsSettings;

    this.playSoundsOnPassFail = configToLoad.playSoundsOnPassFail;
  };
}
