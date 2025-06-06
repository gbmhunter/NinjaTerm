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
  defaultBackgroundColor: string;
  defaultTxTextColor: string;
  defaultRxTextColor: string;

  constructor() {
    // Assign from consts inside the constructor
    this.defaultBackgroundColor = '#000000';
    this.defaultTxTextColor = '#eeeeee';
    this.defaultRxTextColor = '#ffffff';

    console.log('DisplaySettingsData constructor called.');
    console.log('this.defaultBackgroundColor:', this.defaultBackgroundColor);
    console.log('this.defaultTxTextColor:', this.defaultTxTextColor);
    console.log('this.defaultRxTextColor:', this.defaultRxTextColor);

    console.log('DEFAULT_BACKGROUND_COLOR (const):', DEFAULT_BACKGROUND_COLOR);
    console.log('DEFAULT_TX_COLOR (const):', DEFAULT_TX_COLOR);
    console.log('DEFAULT_RX_COLOR (const):', DEFAULT_RX_COLOR);
  }
}
