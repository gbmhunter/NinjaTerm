import { DataViewConfiguration, TerminalHeightMode } from 'src/model/Settings/DisplaySettings/DisplaySettings';

export class DisplaySettingsDataV1 {
  version = 1;
  charSizePx = 14;
  verticalRowPaddingPx = 5;
  terminalWidthChars = 120;
  scrollbackBufferSizeRows = 2000;
  dataViewConfiguration = DataViewConfiguration.SINGLE_TERMINAL;
}

export class DisplaySettingsDataV2 {
  version = 1;
  charSizePx = 14;
  verticalRowPaddingPx = 5;
  terminalWidthChars = 120;
  terminalHeightMode = TerminalHeightMode.AUTO_HEIGHT;
  terminalHeightChars = 25;
  scrollbackBufferSizeRows = 2000;
  dataViewConfiguration = DataViewConfiguration.SINGLE_TERMINAL;
}
