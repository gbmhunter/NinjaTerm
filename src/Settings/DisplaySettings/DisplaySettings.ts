import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { ApplyableNumberField } from 'src/Components/ApplyableTextField';
import AppStorage from 'src/Storage/AppStorage';

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
export default class DisplaySettings {

  appStorage: AppStorage;

  // 14px is a good default size for the terminal text
  charSizePx = new ApplyableNumberField('14', z.coerce.number().int().min(1));

  /**
   * The amount of vertical padding to apply (in pixels) to apply above and below the characters in each row. The char size plus this row padding determines the total row height. Decrease for a denser display of data.
   */
  verticalRowPaddingPx = new ApplyableNumberField('5', z.coerce.number().int().min(1));

  terminalWidthChars = new ApplyableNumberField('120', z.coerce.number().int().min(1));

  scrollbackBufferSizeRows = new ApplyableNumberField('2000', z.coerce.number().int().min(1));

  dataViewConfiguration = DataViewConfiguration.SINGLE_TERMINAL;


  constructor(appStorage: AppStorage) {
    this.appStorage = appStorage;
    this.charSizePx.setOnApplyChanged(() => {
      this.saveConfig();
    });
    this.verticalRowPaddingPx.setOnApplyChanged(() => {
      this.saveConfig();
    });
    this.terminalWidthChars.setOnApplyChanged(() => {
      this.saveConfig();
    });
    this.scrollbackBufferSizeRows.setOnApplyChanged(() => {
      this.saveConfig();
    });
    makeAutoObservable(this);
    this.loadConfig();
  }

  setDataViewConfiguration = (value: DataViewConfiguration) => {
    this.dataViewConfiguration = value;
    this.saveConfig();
  }

  saveConfig = () => {
    const config = {
      charSizePx: this.charSizePx.dispValue,
      verticalRowPadding: this.verticalRowPaddingPx.dispValue,
      terminalWidthChars: this.terminalWidthChars.dispValue,
      scrollbackBufferSizeRows: this.scrollbackBufferSizeRows.dispValue,
      dataViewConfiguration: this.dataViewConfiguration,
    };

    this.appStorage.saveConfig(['settings', 'display'], config);
  }

  loadConfig = () => {
    const config = this.appStorage.getConfig(['settings', 'display']);
    if (config === null) {
      return;
    }
    if (config.charSizePx !== undefined) {
      this.charSizePx.dispValue = config.charSizePx;
      this.charSizePx.apply();
    }
    if (config.verticalRowPadding !== undefined) {
      this.verticalRowPaddingPx.dispValue = config.verticalRowPadding;
      this.verticalRowPaddingPx.apply();
    }
    if (config.terminalWidthChars !== undefined) {
      this.terminalWidthChars.dispValue = config.terminalWidthChars;
      this.terminalWidthChars.apply();
    }
    if (config.scrollbackBufferSizeRows !== undefined) {
      this.scrollbackBufferSizeRows.dispValue = config.scrollbackBufferSizeRows;
      this.scrollbackBufferSizeRows.apply();
    }
    if (config.dataViewConfiguration !== undefined) {
      this.dataViewConfiguration = config.dataViewConfiguration;
    }
  }
}
