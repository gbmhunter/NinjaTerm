import { makeAutoObservable } from "mobx";
import { AppDataManager } from "src/model/AppDataManager/AppDataManager";

export default class GeneralSettings {
  profileManager: AppDataManager;

  whenPastingOnWindowsReplaceCRLFWithLF = true;
  whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;

  constructor(profileManager: AppDataManager) {
    this.profileManager = profileManager;
    this._loadConfig();
    this.profileManager.registerOnProfileLoad(() => {
      this._loadConfig();
    });
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  setWhenPastingOnWindowsReplaceCRLFWithLF = (value: boolean) => {
    this.whenPastingOnWindowsReplaceCRLFWithLF = value;
    this._saveConfig();
  };

  setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = (value: boolean) => {
    this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = value;
    this._saveConfig();
  };

  _saveConfig = () => {
    let config = this.profileManager.appData.currentAppConfig.settings.generalSettings;

    config.whenPastingOnWindowsReplaceCRLFWithLF = this.whenPastingOnWindowsReplaceCRLFWithLF;
    config.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping;

    this.profileManager.saveAppData();
  };

  _loadConfig = () => {
    let configToLoad = this.profileManager.appData.currentAppConfig.settings.generalSettings;

    this.whenPastingOnWindowsReplaceCRLFWithLF = configToLoad.whenPastingOnWindowsReplaceCRLFWithLF;
    this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = configToLoad.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping;
  };

  clearAppDataAndRefresh = () => {
    localStorage.clear();
    window.location.reload();
  };
}
