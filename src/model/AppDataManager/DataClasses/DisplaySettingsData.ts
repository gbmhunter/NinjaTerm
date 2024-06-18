import { DataViewConfiguration } from "src/model/Settings/DisplaySettings/DisplaySettings";

export class DisplaySettingsDataV1 {
  version = 1;
  charSizePx = 14;
  verticalRowPaddingPx = 5;
  terminalWidthChars = 120;
  scrollbackBufferSizeRows = 2000;
  dataViewConfiguration = DataViewConfiguration.SINGLE_TERMINAL;
}
