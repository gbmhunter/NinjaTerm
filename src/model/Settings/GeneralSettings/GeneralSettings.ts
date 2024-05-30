import { makeAutoObservable } from "mobx";
import { ProfileManager } from "src/model/ProfileManager/ProfileManager";

export class GeneralSettingsConfig {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 1;

  whenPastingOnWindowsReplaceCRLFWithLF = true;
  whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;
}

export default class RxSettings {
  profileManager: ProfileManager;

  whenPastingOnWindowsReplaceCRLFWithLF = true;
  whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;

  constructor(profileManager: ProfileManager) {
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
    let config = this.profileManager.currentAppConfig.settings.generalSettings;

    config.whenPastingOnWindowsReplaceCRLFWithLF = this.whenPastingOnWindowsReplaceCRLFWithLF;
    config.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping;

    this.profileManager.saveAppConfig();
  };

  _loadConfig = () => {
    let configToLoad = this.profileManager.currentAppConfig.settings.generalSettings;
    //===============================================
    // UPGRADE PATH
    //===============================================
    const latestVersion = new GeneralSettingsConfig().version;
    if (configToLoad.version === latestVersion) {
      // Do nothing
    } else {
      console.log(`Out-of-date config version ${configToLoad.version} found.` + ` Updating to version ${latestVersion}.`);
      this._saveConfig();
      configToLoad = this.profileManager.currentAppConfig.settings.generalSettings;
    }

    this.whenPastingOnWindowsReplaceCRLFWithLF = configToLoad.whenPastingOnWindowsReplaceCRLFWithLF;
    this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = configToLoad.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping;
  };
}
