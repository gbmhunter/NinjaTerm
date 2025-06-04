import { DataViewConfiguration, TerminalHeightMode } from 'src/model/Settings/DisplaySettings/DisplaySettings';

export class DisplaySettingsData {
  charSizePx = 14;
  verticalRowPaddingPx = 5;
  terminalWidthChars = 120;
  terminalHeightMode = TerminalHeightMode.AUTO_HEIGHT;
  terminalHeightChars = 25;
  scrollbackBufferSizeRows = 2000;
  dataViewConfiguration = DataViewConfiguration.SINGLE_TERMINAL;
  backgroundColor = '#000000'; // Default to black
  txColor = '#00FF00'; // Default green
  rxColor = '#FFFF00'; // Default yellow
}
