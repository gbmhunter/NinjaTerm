import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { ApplyableNumberField, ApplyableTextField } from 'src/view/Components/ApplyableTextField';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { DEFAULT_TAB_STOP_WIDTH } from 'src/model/AppDataManager/DataClasses/DisplaySettingsData';

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

  tabStopWidth = new ApplyableNumberField(DEFAULT_TAB_STOP_WIDTH.toString(), z.coerce.number().int().min(1).max(16));

  // Color fields
  // Values can just be made up here, they will be overridden by the settings
  defaultBackgroundColor = new ApplyableTextField('', z.string());
  defaultTxTextColor = new ApplyableTextField('', z.string());
  defaultRxTextColor = new ApplyableTextField('', z.string());

  autoScrollLockOnTx: boolean = true;

  // Tooltip settings
  static DEFAULT_TOOLTIP_DELAY_MS = 1000;
  static DEFAULT_TOOLTIPS_ENABLED = true;
  tooltipsEnabled: boolean = DisplaySettings.DEFAULT_TOOLTIPS_ENABLED;
  tooltipDelayMs = new ApplyableNumberField(
    DisplaySettings.DEFAULT_TOOLTIP_DELAY_MS.toString(),
    z.coerce.number().int().min(0).max(5000));

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
    this.tooltipDelayMs.setOnApplyChanged(() => this._saveConfig());

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

  setAutoScrollLockOnTx = (value: boolean) => {
    this.autoScrollLockOnTx = value;
    this._saveConfig();
  };

  setTooltipsEnabled = (value: boolean) => {
    this.tooltipsEnabled = value;
    this._saveConfig();
  };

  /**
   * Get the basic dynamic tooltip configuration. This takes into account the user's tooltip preferences, which includes whether tooltips are enabled and the delay time.
   * @returns The tooltip configuration.
   */
  getBasicTooltipConfig = () => {
    if (!this.tooltipsEnabled) {
      // Technically only disableHoverListener should be needed to be true, but set all of these just in case
      return {
        title: '',
        disableHoverListener: true,
        disableFocusListener: true,
        disableTouchListener: true,
      };
    }

    return {
      arrow: true,
      enterDelay: this.tooltipDelayMs.appliedValue,
      enterNextDelay: 100,
      leaveDelay: 50,
    };
  };

  /**
   * Save the relevant settings from this class into the current app config in the profile manager.
   */
  _saveConfig = () => {
    let config = this.profileManager.appData.currentAppConfig.settings.displaySettings;

    config.charSizePx = this.charSizePx.appliedValue;
    config.verticalRowPaddingPx = this.verticalRowPaddingPx.appliedValue;
    config.terminalWidthChars = this.terminalWidthChars.appliedValue;
    config.terminalHeightMode = this.terminalHeightMode;
    config.terminalHeightChars = this.terminalHeightChars.appliedValue;
    config.scrollbackBufferSizeRows = this.scrollbackBufferSizeRows.appliedValue;
    config.dataViewConfiguration = this.dataViewConfiguration;
    config.defaultBackgroundColor = this.defaultBackgroundColor.appliedValue;
    config.defaultTxTextColor = this.defaultTxTextColor.appliedValue;
    config.defaultRxTextColor = this.defaultRxTextColor.appliedValue;
    config.tabStopWidth = this.tabStopWidth.appliedValue;
    config.autoScrollLockOnTx = this.autoScrollLockOnTx;
    config.tooltipsEnabled = this.tooltipsEnabled;
    config.tooltipDelayMs = this.tooltipDelayMs.appliedValue;

    this.profileManager.saveAppData();
  };

  /**
   * Load the relevant settings from the current app config in the profile manager into this class.
   */
  _loadConfig = () => {
    let configToLoad = this.profileManager.appData.currentAppConfig.settings.displaySettings;

    this.charSizePx.setDispValue(configToLoad.charSizePx.toString());
    this.charSizePx.apply({notify: false});
    this.verticalRowPaddingPx.setDispValue(configToLoad.verticalRowPaddingPx.toString());
    this.verticalRowPaddingPx.apply({notify: false});
    this.terminalWidthChars.setDispValue(configToLoad.terminalWidthChars.toString());
    this.terminalWidthChars.apply({notify: false});
    this.terminalHeightMode = configToLoad.terminalHeightMode;
    this.terminalHeightChars.setDispValue(configToLoad.terminalHeightChars.toString());
    this.terminalHeightChars.apply({notify: false});
    this.scrollbackBufferSizeRows.setDispValue(configToLoad.scrollbackBufferSizeRows.toString());
    this.scrollbackBufferSizeRows.apply({notify: false});
    this.dataViewConfiguration = configToLoad.dataViewConfiguration;
    this.defaultBackgroundColor.setDispValue(configToLoad.defaultBackgroundColor);
    this.defaultBackgroundColor.apply({notify: false});
    this.defaultTxTextColor.setDispValue(configToLoad.defaultTxTextColor);
    this.defaultTxTextColor.apply({notify: false});
    this.defaultRxTextColor.setDispValue(configToLoad.defaultRxTextColor);
    this.defaultRxTextColor.apply({notify: false});
    this.tabStopWidth.setDispValue(configToLoad.tabStopWidth?.toString() || '8');
    this.tabStopWidth.apply({notify: false});
    this.autoScrollLockOnTx = configToLoad.autoScrollLockOnTx;
    this.tooltipsEnabled = configToLoad.tooltipsEnabled;
    this.tooltipDelayMs.setDispValue(configToLoad.tooltipDelayMs.toString());
    this.tooltipDelayMs.apply({notify: false});
  };
}
