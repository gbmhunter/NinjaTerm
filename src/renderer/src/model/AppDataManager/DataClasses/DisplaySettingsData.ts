import DisplaySettings, { DataViewConfiguration, TerminalFont, TerminalHeightMode } from 'src/model/Settings/DisplaySettings/DisplaySettings';

export const DEFAULT_BACKGROUND_COLOR = '#000000';
export const DEFAULT_TX_COLOR = '#ffffff';
export const DEFAULT_RX_COLOR = '#ffffff';

export const DEFAULT_TAB_STOP_WIDTH = 8;

export class DisplaySettingsData {
  charSizePx = 14;
  verticalRowPaddingPx = 5;
  terminalWidthChars = 120;
  terminalHeightMode = TerminalHeightMode.AUTO_HEIGHT;
  terminalFont = TerminalFont.NINJATERM;
  terminalFontCustomName = '';
  terminalHeightChars = 25;
  scrollbackBufferSizeRows = 2000;
  dataViewConfiguration = DataViewConfiguration.SINGLE_TERMINAL;

  // Declare properties without direct initialization using same-module consts
  defaultBackgroundColor = DEFAULT_BACKGROUND_COLOR;
  defaultTxTextColor = DEFAULT_TX_COLOR;
  defaultRxTextColor = DEFAULT_RX_COLOR;
  tabStopWidth = DEFAULT_TAB_STOP_WIDTH;
  autoScrollLockOnTx = true;

  // Tooltip settings
  tooltipsEnabled = DisplaySettings.DEFAULT_TOOLTIPS_ENABLED;
  tooltipDelayMs = DisplaySettings.DEFAULT_TOOLTIP_DELAY_MS;
}
