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

/** The font used to render data in the terminal. */
export enum TerminalFont {
  NINJATERM = 'NinjaTerm', // The bundled NinjaTerm font. ASCII only.
  IBM_VGA = 'IBM VGA', // The bundled IBM VGA 8x16 DOS font. Covers CP437, including box-drawing characters.
  PERFECT_DOS_VGA = 'Perfect DOS VGA 437', // The bundled Perfect DOS VGA 437 font. Also covers the CP437 box-drawing characters.
  SYSTEM_MONOSPACE = 'System monospace', // Whatever the OS provides (Consolas/Menlo/DejaVu Sans Mono/...).
  CUSTOM = 'Custom', // A font family named by the user in terminalFontCustomName.
}

// Maps the enums to human-readable names for display
export const terminalFontEnumToDisplayName: {
  [key: string]: string;
} = {
  [TerminalFont.NINJATERM]: 'NinjaTerm (default)',
  [TerminalFont.IBM_VGA]: 'IBM VGA (DOS/CP437)',
  [TerminalFont.PERFECT_DOS_VGA]: 'Perfect DOS VGA 437',
  [TerminalFont.SYSTEM_MONOSPACE]: 'System monospace',
  [TerminalFont.CUSTOM]: 'Custom...',
};

/**
 * The CSS font-family names for the bundled fonts, as declared by the
 * `@font-face` rules in `SingleTerminalView.module.css`.
 */
const NINJATERM_FONT_FAMILY = 'NinjaTerm';
const IBM_VGA_FONT_FAMILY = 'WebPlusIBMVGA';
const PERFECT_DOS_VGA_FONT_FAMILY = 'PerfectDOSVGA437';

/**
 * A good monospace font per platform (Windows / macOS / Linux), tried before
 * falling back to whatever generic `monospace` resolves to.
 */
const SYSTEM_MONOSPACE_FAMILIES = 'Consolas, Menlo, "DejaVu Sans Mono"';

/**
 * Always appended to the terminal's font-family stack.
 *
 * The NinjaTerm font is the only place the private-use control-glyph (U+E000+)
 * and hex-glyph (U+E100+) characters exist, so it has to stay reachable
 * whichever font the user picks. The generic monospace families after it catch
 * anything neither the chosen font nor NinjaTerm covers (e.g. box-drawing
 * characters when the NinjaTerm font is selected), so that such characters are
 * still rendered at a fixed width and the terminal's character grid holds.
 */
export const TERMINAL_FONT_FALLBACK_STACK = `${NINJATERM_FONT_FAMILY}, ${SYSTEM_MONOSPACE_FAMILIES}, monospace`;

export default class DisplaySettings {
  profileManager: AppDataManager;

  // 14px is a good default size for the terminal text
  charSizePx = new ApplyableNumberField('14', z.coerce.number().int().min(1));

  /**
   * The amount of vertical padding to apply (in pixels) to apply above and below the characters in each row. The char size plus this row padding determines the total row height. Decrease for a denser display of data.
   *
   * Zero is allowed, and is what the bundled DOS fonts need. They are bitmap
   * fonts whose glyphs fill their cell exactly (ascent - descent == 1 em), so
   * any padding at all leaves a gap between rows and the vertical strokes of
   * box-drawing characters no longer join up. NinjaTerm's own font has built-in
   * leading (1.17 em) and wants a few pixels here.
   */
  verticalRowPaddingPx = new ApplyableNumberField('5', z.coerce.number().int().min(0));

  terminalWidthChars = new ApplyableNumberField('120', z.coerce.number().int().min(1));

  terminalHeightMode = TerminalHeightMode.AUTO_HEIGHT;

  terminalFont = TerminalFont.NINJATERM;

  /**
   * The font family to use when `terminalFont` is CUSTOM. Free text, since it
   * names a font installed on the user's machine (e.g. "Perfect DOS VGA 437").
   * Not validated — if the font isn't installed the stack just falls through to
   * the next family.
   */
  terminalFontCustomName = new ApplyableTextField('', z.string());

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
    this.terminalFontCustomName.setOnApplyChanged(() => this._saveConfig());

    this._loadConfig();
    this.profileManager.registerOnConfigReload(['settings.displaySettings'], () => {
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

  setTerminalFont = (value: TerminalFont) => {
    this.terminalFont = value;
    this._saveConfig();
  };

  /**
   * The complete CSS `font-family` value for terminal rows: the user's chosen
   * font, followed by the fallback stack that keeps the private-use glyphs and
   * the character grid working. See `TERMINAL_FONT_FALLBACK_STACK`.
   */
  get terminalFontFamily(): string {
    let chosenFamily: string | null = null;
    if (this.terminalFont === TerminalFont.NINJATERM) {
      // Already the first entry of the fallback stack.
      chosenFamily = null;
    } else if (this.terminalFont === TerminalFont.IBM_VGA) {
      chosenFamily = IBM_VGA_FONT_FAMILY;
    } else if (this.terminalFont === TerminalFont.PERFECT_DOS_VGA) {
      chosenFamily = PERFECT_DOS_VGA_FONT_FAMILY;
    } else if (this.terminalFont === TerminalFont.SYSTEM_MONOSPACE) {
      // The system families have to go in front of NinjaTerm to win for the ASCII
      // range too. They are already in the fallback stack, so build the whole
      // stack here rather than appending and listing them twice.
      return `${SYSTEM_MONOSPACE_FAMILIES}, ${NINJATERM_FONT_FAMILY}, monospace`;
    } else if (this.terminalFont === TerminalFont.CUSTOM) {
      const customName = this.terminalFontCustomName.appliedValue.trim();
      // An empty custom name would produce a leading comma and invalidate the
      // whole declaration, so treat it as "no choice" and use the default.
      chosenFamily = customName === '' ? null : `"${customName.replace(/"/g, '')}"`;
    }

    if (chosenFamily === null) {
      return TERMINAL_FONT_FALLBACK_STACK;
    }
    return `${chosenFamily}, ${TERMINAL_FONT_FALLBACK_STACK}`;
  }

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
    const config = this.profileManager.appData.currentAppConfig.settings.displaySettings;

    config.charSizePx = this.charSizePx.appliedValue;
    config.verticalRowPaddingPx = this.verticalRowPaddingPx.appliedValue;
    config.terminalWidthChars = this.terminalWidthChars.appliedValue;
    config.terminalHeightMode = this.terminalHeightMode;
    config.terminalFont = this.terminalFont;
    config.terminalFontCustomName = this.terminalFontCustomName.appliedValue;
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
    const configToLoad = this.profileManager.appData.currentAppConfig.settings.displaySettings;

    this.charSizePx.setDispValue(configToLoad.charSizePx.toString());
    this.charSizePx.apply({notify: false});
    this.verticalRowPaddingPx.setDispValue(configToLoad.verticalRowPaddingPx.toString());
    this.verticalRowPaddingPx.apply({notify: false});
    this.terminalWidthChars.setDispValue(configToLoad.terminalWidthChars.toString());
    this.terminalWidthChars.apply({notify: false});
    this.terminalHeightMode = configToLoad.terminalHeightMode;
    this.terminalFont = configToLoad.terminalFont;
    this.terminalFontCustomName.setDispValue(configToLoad.terminalFontCustomName);
    this.terminalFontCustomName.apply({notify: false});
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
