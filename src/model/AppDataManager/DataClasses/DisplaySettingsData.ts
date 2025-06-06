import { DataViewConfiguration, TerminalHeightMode } from 'src/model/Settings/DisplaySettings/DisplaySettings';

export const DEFAULT_BACKGROUND_COLOR = '#000000';
export const DEFAULT_TX_COLOR = '#ffffff';
export const DEFAULT_RX_COLOR = '#ffffff';

export class DisplaySettingsData {
  charSizePx = 14;
  verticalRowPaddingPx = 5;
  terminalWidthChars = 120;
  terminalHeightMode = TerminalHeightMode.AUTO_HEIGHT;
  terminalHeightChars = 25;
  scrollbackBufferSizeRows = 2000;
  dataViewConfiguration = DataViewConfiguration.SINGLE_TERMINAL;

  // Declare properties without direct initialization using same-module consts
  defaultBackgroundColor = DEFAULT_BACKGROUND_COLOR;
  defaultTxTextColor = DEFAULT_TX_COLOR;
  defaultRxTextColor = DEFAULT_RX_COLOR;
  tabStopWidth = 8;
}
