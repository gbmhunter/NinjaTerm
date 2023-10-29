import { makeAutoObservable } from "mobx";
import * as Validator from 'validatorjs';

import { App } from "src/App";

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

  app: App;

  charSizePx =  {
    dispValue: '14', // 14px is a good default size for the terminal text
    appliedValue: 14,
    hasError: false,
    errorMsg: '',
    rule: 'required|integer|min:1',
  };

  constructor(app: App) {
    this.app = app;
    makeAutoObservable(this);
  }

  setCharSizePxDisp = (value: string) => {
    this.charSizePx.dispValue = value;
    const validation = new Validator({charSizePx: value}, {charSizePx: this.charSizePx.rule});
    this.charSizePx.hasError = validation.fails();
    if (this.charSizePx.hasError) {
      this.charSizePx.errorMsg = validation.errors.first('charSizePx');
    } else {
      this.charSizePx.errorMsg = '';
    }
  }

  applyCharSizePx = () => {
    if (!this.charSizePx.hasError) {
      this.charSizePx.appliedValue = parseFloat(this.charSizePx.dispValue);
    }
  }
}
