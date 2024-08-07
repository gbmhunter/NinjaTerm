import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { ApplyableNumberField } from 'src/view/Components/ApplyableTextField';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { c } from 'vite/dist/node/types.d-aGj9QkWt';

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
  [DataViewConfiguration.SINGLE_TERMINAL]: 'Single terminal',
  [DataViewConfiguration.SEPARATE_TX_RX_TERMINALS]: 'Separate TX/RX terminals',
};

export enum TerminalHeightMode {
  AUTO_HEIGHT = 'Auto', // Terminal height is set by the maximum number of whole rows that can fit in the terminal window (will change as the window height changes).
  FIXED_HEIGHT = 'Fixed', // Terminal height is set to a fixed number of rows specified in the terminal height field.
}

export default class DisplaySettings {
  profileManager: AppDataManager;

  // 14px is a good default size for the terminal text
  charSizePx = new ApplyableNumberField('14', z.coerce.number().int().min(1));

  /**
   * The amount of vertical padding to apply (in pixels) to apply above and below the characters in each row. The char size plus this row padding determines the total row height. Decrease for a denser display of data.
   */
  verticalRowPaddingPx = new ApplyableNumberField('5', z.coerce.number().int().min(1));

  terminalWidthChars = new ApplyableNumberField('120', z.coerce.number().int().min(1));

  terminalHeightMode = TerminalHeightMode.AUTO_HEIGHT;

  /**
   * Must be a positive integer in the range [1, 100].
   */
  terminalHeightChars = new ApplyableNumberField('25', z.coerce.number().int().min(1).max(100));

  scrollbackBufferSizeRows = new ApplyableNumberField('2000', z.coerce.number().int().min(1));

  dataViewConfiguration = DataViewConfiguration.SINGLE_TERMINAL;

  constructor(profileManager: AppDataManager) {
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
    this._loadConfig();
    this.profileManager.registerOnProfileLoad(() => {
      this._loadConfig();
    });
    makeAutoObservable(this);
  }

  setDataViewConfiguration = (value: DataViewConfiguration) => {
    this.dataViewConfiguration = value;
    this._saveConfig();
  };

  setTerminalHeightMode = (value: TerminalHeightMode) => {
    this.terminalHeightMode = value;
    this._saveConfig();
  };

  _saveConfig = () => {
    let config = this.profileManager.appData.currentAppConfig.settings.displaySettings;

    config.charSizePx = this.charSizePx.appliedValue;
    config.verticalRowPaddingPx = this.verticalRowPaddingPx.appliedValue;
    config.terminalWidthChars = this.terminalWidthChars.appliedValue;
    config.terminalHeightMode = this.terminalHeightMode;
    config.terminalHeightChars = this.terminalHeightChars.appliedValue;
    config.scrollbackBufferSizeRows = this.scrollbackBufferSizeRows.appliedValue;
    config.dataViewConfiguration = this.dataViewConfiguration;

    this.profileManager.saveAppData();
  };

  _loadConfig = () => {
    let configToLoad = this.profileManager.appData.currentAppConfig.settings.displaySettings;

    this.charSizePx.setDispValue(configToLoad.charSizePx.toString());
    this.charSizePx.apply();
    this.verticalRowPaddingPx.setDispValue(configToLoad.verticalRowPaddingPx.toString());
    this.verticalRowPaddingPx.apply();
    this.terminalWidthChars.setDispValue(configToLoad.terminalWidthChars.toString());
    this.terminalWidthChars.apply();
    this.terminalHeightMode = configToLoad.terminalHeightMode;
    this.terminalHeightChars.setDispValue(configToLoad.terminalHeightChars.toString());
    this.terminalHeightChars.apply();
    this.scrollbackBufferSizeRows.setDispValue(configToLoad.scrollbackBufferSizeRows.toString());
    this.scrollbackBufferSizeRows.apply();
    this.dataViewConfiguration = configToLoad.dataViewConfiguration;
  };
}
