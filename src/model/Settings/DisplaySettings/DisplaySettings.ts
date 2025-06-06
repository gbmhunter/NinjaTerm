import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { ApplyableNumberField, ApplyableTextField } from 'src/view/Components/ApplyableTextField';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';

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

  tabStopWidth = new ApplyableNumberField('8', z.coerce.number().int().min(1).max(16));

  // Color fields
  // Values can just be made up here, they will be overridden by the settings
  defaultBackgroundColor = new ApplyableTextField('', z.string());
  defaultTxTextColor = new ApplyableTextField('', z.string());
  defaultRxTextColor = new ApplyableTextField('', z.string());

  constructor(profileManager: AppDataManager) {
    this.profileManager = profileManager;
    this.charSizePx.setOnApplyChanged(() => this._saveConfig());
    this.verticalRowPaddingPx.setOnApplyChanged(() => this._saveConfig());
    this.terminalWidthChars.setOnApplyChanged(() => this._saveConfig());
    this.terminalHeightChars.setOnApplyChanged(() => this._saveConfig());
    this.scrollbackBufferSizeRows.setOnApplyChanged(() => this._saveConfig());
    this.defaultBackgroundColor.setOnApplyChanged(() => this._saveConfig());
    this.defaultTxTextColor.setOnApplyChanged(() => this._saveConfig());
    this.defaultRxTextColor.setOnApplyChanged(() => this._saveConfig());
    this.tabStopWidth.setOnApplyChanged(() => this._saveConfig());

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

  setRxColorEqualToTx = () => {
    this.defaultRxTextColor.setDispValue(this.defaultTxTextColor.appliedValue);
    this.defaultRxTextColor.apply();
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
    console.log('Saving display settings config. defaultBackgroundColor: ', this.defaultBackgroundColor.appliedValue);
    console.log('Saving display settings config. defaultTxTextColor: ', this.defaultTxTextColor.appliedValue);
    console.log('Saving display settings config. defaultRxTextColor: ', this.defaultRxTextColor.appliedValue);
    config.defaultBackgroundColor = this.defaultBackgroundColor.appliedValue;
    config.defaultTxTextColor = this.defaultTxTextColor.appliedValue;
    config.defaultRxTextColor = this.defaultRxTextColor.appliedValue;
    config.tabStopWidth = this.tabStopWidth.appliedValue;

    this.profileManager.saveAppData();
  };

  _loadConfig = () => {
    let configToLoad = this.profileManager.appData.currentAppConfig.settings.displaySettings;
    console.log('Loading display settings config. configToLoad: ', configToLoad);
    // console.log('Loading display settings config. configToLoad.defaultTxTextColor: ', configToLoad.defaultTxTextColor);

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
    this.defaultBackgroundColor.setDispValue(configToLoad.defaultBackgroundColor);
    this.defaultBackgroundColor.apply({notify: false});
    const defaultTxTextColor = configToLoad.defaultTxTextColor;
    console.log('Loading display settings config. defaultTxTextColor: ', defaultTxTextColor);
    this.defaultTxTextColor.setDispValue(defaultTxTextColor);
    this.defaultTxTextColor.apply({notify: false});
    this.defaultRxTextColor.setDispValue(configToLoad.defaultRxTextColor);
    this.defaultRxTextColor.apply({notify: false});
    this.tabStopWidth.setDispValue(configToLoad.tabStopWidth?.toString() || '8');
    this.tabStopWidth.apply();

    console.log('Loaded display settings config.');
  };
}
