import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import type { DisplaySettingsData } from 'src/model/AppDataManager/DataClasses/DisplaySettingsData';
import { SettingsBranch } from '../SettingsBranch';

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

  /** See `SettingsBranch` for how this class relates to `DisplaySettingsData`. */
  private readonly branch = new SettingsBranch<DisplaySettingsData>(
    'settings.displaySettings',
    (config) => config.settings.displaySettings,
  );

  // Tooltip defaults. Referenced by `DisplaySettingsData`, so they stay here.
  static DEFAULT_TOOLTIP_DELAY_MS = 1000;
  static DEFAULT_TOOLTIPS_ENABLED = true;

  // 14px (see `DisplaySettingsData`) is a good default size for the terminal text
  charSizePx = this.branch.applyableNumber('charSizePx', z.coerce.number().int().min(1));

  /**
   * The amount of vertical padding to apply (in pixels) to apply above and below the characters in each row. The char size plus this row padding determines the total row height. Decrease for a denser display of data.
   *
   * Zero is allowed, and is what the bundled DOS fonts need. They are bitmap
   * fonts whose glyphs fill their cell exactly (ascent - descent == 1 em), so
   * any padding at all leaves a gap between rows and the vertical strokes of
   * box-drawing characters no longer join up. NinjaTerm's own font has built-in
   * leading (1.17 em) and wants a few pixels here.
   */
  verticalRowPaddingPx = this.branch.applyableNumber('verticalRowPaddingPx', z.coerce.number().int().min(0));

  terminalWidthChars = this.branch.applyableNumber('terminalWidthChars', z.coerce.number().int().min(1));

  get terminalHeightMode() { return this.branch.data.terminalHeightMode; }
  setTerminalHeightMode = this.branch.setter('terminalHeightMode');

  get terminalFont() { return this.branch.data.terminalFont; }
  setTerminalFont = this.branch.setter('terminalFont');

  /**
   * The font family to use when `terminalFont` is CUSTOM. Free text, since it
   * names a font installed on the user's machine (e.g. "Perfect DOS VGA 437").
   * Not validated — if the font isn't installed the stack just falls through to
   * the next family.
   */
  terminalFontCustomName = this.branch.applyableText('terminalFontCustomName', z.string());

  /** Must be a positive integer in the range [1, 100]. */
  terminalHeightChars = this.branch.applyableNumber('terminalHeightChars', z.coerce.number().int().min(1).max(100));

  scrollbackBufferSizeRows = this.branch.applyableNumber('scrollbackBufferSizeRows', z.coerce.number().int().min(1));

  get dataViewConfiguration() { return this.branch.data.dataViewConfiguration; }
  setDataViewConfiguration = this.branch.setter('dataViewConfiguration');

  tabStopWidth = this.branch.applyableNumber('tabStopWidth', z.coerce.number().int().min(1).max(16));

  // Color fields
  defaultBackgroundColor = this.branch.applyableText('defaultBackgroundColor', z.string());
  defaultTxTextColor = this.branch.applyableText('defaultTxTextColor', z.string());
  defaultRxTextColor = this.branch.applyableText('defaultRxTextColor', z.string());

  get autoScrollLockOnTx() { return this.branch.data.autoScrollLockOnTx; }
  setAutoScrollLockOnTx = this.branch.setter('autoScrollLockOnTx');

  // Tooltip settings
  get tooltipsEnabled() { return this.branch.data.tooltipsEnabled; }
  setTooltipsEnabled = this.branch.setter('tooltipsEnabled');

  tooltipDelayMs = this.branch.applyableNumber('tooltipDelayMs', z.coerce.number().int().min(0).max(5000));

  constructor(profileManager: AppDataManager) {
    this.profileManager = profileManager;
    this.branch.attach(profileManager);
    makeAutoObservable<DisplaySettings, 'branch'>(this, { branch: false }); // Make sure this is at the end of the constructor
  }

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
}
