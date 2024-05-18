import { makeAutoObservable } from "mobx";
import { App } from "src/model/App";
import { z } from "zod";
import { stringToUint8Array } from 'src/model/Util/Util';

export enum MacroDataType {
  ASCII = "ASCII",
  HEX = "HEX",
}

export class Macro {
  name: string;

  dataType: MacroDataType = MacroDataType.ASCII;
  data: string;
  isSettingsModalOpen: boolean = false;

  errorMsg: string = '';

  constructor(name: string) {
    this.name = name;
    this.data = '';

    makeAutoObservable(this); // Make sure this near the end
  }

  setDataType(dataType: MacroDataType) {
    this.dataType = dataType;
    this.validateData();
  }

  setData(data: string) {
    this.data = data;
    this.validateData();
  }

  validateData() {
    // Validate the data
    // If it's ASCII, make sure it's valid ASCII
    // If it's HEX, make sure it's valid HEX
    let validation;
    if (this.dataType === MacroDataType.ASCII) {
      // Validate ASCII
      validation = z.string().safeParse(this.data);
    } else if (this.dataType === MacroDataType.HEX) {
      // Validate HEX
      validation = z.string().regex(/^([0-9A-Fa-f]*)$/, "Must be a valid hex number.").safeParse(this.data);
    } else {
      throw new Error("Invalid data type");
    }

    console.log("Validation:", validation);

    if (validation.success) {
      this.errorMsg = '';
    } else {
      // We want to keep this simple, just show the first
      // error message
      this.errorMsg = validation.error.errors[0].message;
    }
  }

  setIsSettingsModalOpen(isOpen: boolean) {
    console.log("Set isSettingsModalOpen:", isOpen);
    this.isSettingsModalOpen = isOpen;
  }

  textAreaToBytes = (newLineReplacementChar: string) => {
    // Replace all instances of LF with the newLinesChar
    let str = this.data;
    str = str.replace(/\n/g, newLineReplacementChar);
    // Convert to Uint8Array
    return stringToUint8Array(str);
  }
}
