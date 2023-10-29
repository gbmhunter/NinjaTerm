import { makeAutoObservable } from "mobx";
import * as Validator from 'validatorjs';

import { App } from "src/App";

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
