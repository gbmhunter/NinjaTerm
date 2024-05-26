import { makeAutoObservable } from "mobx";
import { boolean, z } from "zod";

import { ApplyableNumberField } from "src/view/Components/ApplyableTextField";
import AppStorage from "src/model/Storage/AppStorage";
import { ProfileManager } from "src/model/ProfileManager/ProfileManager";

/** Enumerates the different possible ways the TX and RX data
 * can be displayed. One of these may be active at any one time.
 */
export enum DataViewConfiguration {
  SINGLE_TERMINAL, // TX echo
  SEPARATE_TX_RX_TERMINALS,
}

// Maps the enums to human-readable names for display
export const dataViewConfigEnumToDisplayName: {
  [key: string]: string;
} = {
  [DataViewConfiguration.SINGLE_TERMINAL]: "Single terminal",
  [DataViewConfiguration.SEPARATE_TX_RX_TERMINALS]: "Separate TX/RX terminals",
};

export class DisplaySettingsConfig {
  version = 1;
  charSizePx = 14;
  verticalRowPaddingPx = 5;
  terminalWidthChars = 120;
  scrollbackBufferSizeRows = 2000;
  dataViewConfiguration = DataViewConfiguration.SINGLE_TERMINAL;
}

export default class DisplaySettings {
  appStorage: AppStorage;

  profileManager: ProfileManager;

  // 14px is a good default size for the terminal text
  charSizePx = new ApplyableNumberField("14", z.coerce.number().int().min(1));

  /**
   * The amount of vertical padding to apply (in pixels) to apply above and below the characters in each row. The char size plus this row padding determines the total row height. Decrease for a denser display of data.
   */
  verticalRowPaddingPx = new ApplyableNumberField("5", z.coerce.number().int().min(1));

  terminalWidthChars = new ApplyableNumberField("120", z.coerce.number().int().min(1));

  scrollbackBufferSizeRows = new ApplyableNumberField("2000", z.coerce.number().int().min(1));

  dataViewConfiguration = DataViewConfiguration.SINGLE_TERMINAL;

  constructor(appStorage: AppStorage, profileManager: ProfileManager) {
    this.appStorage = appStorage;
    this.profileManager = profileManager;
    this.charSizePx.setOnApplyChanged(() => {
      this._saveConfig();
    });
    this.verticalRowPaddingPx.setOnApplyChanged(() => {
      this._saveConfig();
    });
    this.terminalWidthChars.setOnApplyChanged(() => {
      this._saveConfig();
    });
    this.scrollbackBufferSizeRows.setOnApplyChanged(() => {
      this._saveConfig();
    });
    makeAutoObservable(this);
    this._loadConfig();
  }

  setDataViewConfiguration = (value: DataViewConfiguration) => {
    this.dataViewConfiguration = value;
    this._saveConfig();
  };

  _saveConfig = () => {
    let config = this.profileManager.currentAppConfig.settings.displaySettings;

    config.charSizePx = this.charSizePx.appliedValue;
    config.verticalRowPaddingPx = this.verticalRowPaddingPx.appliedValue;
    config.terminalWidthChars = this.terminalWidthChars.appliedValue;
    config.scrollbackBufferSizeRows = this.scrollbackBufferSizeRows.appliedValue;
    config.dataViewConfiguration = this.dataViewConfiguration;

    this.profileManager.saveAppConfig();
  };

  _loadConfig = () => {
    let configToLoad = this.profileManager.currentAppConfig.settings.displaySettings;
    //===============================================
    // UPGRADE PATH
    //===============================================
    const latestVersion = new DisplaySettingsConfig().version;
    if (configToLoad.version === latestVersion) {
      console.log(`Up-to-date config found.`);
    } else {
      console.error(`Out-of-date config version ${configToLoad.version} found.` + ` Updating to version ${latestVersion}.`);
      this._saveConfig();
      configToLoad = this.profileManager.currentAppConfig.settings.displaySettings;
    }

    this.charSizePx.setDispValue(configToLoad.charSizePx.toString());
    this.charSizePx.apply();
    this.verticalRowPaddingPx.setDispValue(configToLoad.verticalRowPaddingPx.toString());
    this.verticalRowPaddingPx.apply();
    this.terminalWidthChars.setDispValue(configToLoad.terminalWidthChars.toString());
    this.terminalWidthChars.apply();
    this.scrollbackBufferSizeRows.setDispValue(configToLoad.scrollbackBufferSizeRows.toString());
    this.scrollbackBufferSizeRows.apply();
    this.dataViewConfiguration = configToLoad.dataViewConfiguration;
  };
}
