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

  /**
   *
   * @param newLineReplacementChar Ignored if the data type is HEX. If the data type is ASCII, this string will replace all instances of LF in the data.
   * @returns
   */
  textAreaToBytes = (newLineReplacementChar: string): Uint8Array => {
    let bytes;
    if (this.dataType === MacroDataType.ASCII) {
      // Replace all instances of LF with the newLinesChar
      let str = this.data;
      str = str.replace(/\n/g, newLineReplacementChar);
      // Convert to Uint8Array
      bytes = stringToUint8Array(str);
    } else if (this.dataType === MacroDataType.HEX) {
      // Remove all spaces and new lines
      let str = this.data;
      str = str.replace(/ /g, '');
      str = str.replace(/\n/g, '');
      // Convert hex string to Uint8Array
      bytes = this._hexStringToUint8Array(str);
    } else {
      throw new Error("Invalid data type");
    }

    return bytes;
  }

  /**
   * Converts a hex string to a Uint8Array.
   * @param hexString Should be valid hex string only containing the characters 0-9 and A-F (or a-f). Should have an even number of characters. If not, an error will be thrown.
   * @returns The Uint8Array representation of the hex string.
   */
  _hexStringToUint8Array = (hexString: string): Uint8Array => {
    if (!this._isHex(hexString)) {
      throw new Error("Invalid hex string");
    }
    const output = Uint8Array.from(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    return output;
  }

  _isHex = (str: string): boolean => {
    return str.length !== 0 && str.length % 2 === 0 && !/[^a-fA-F0-9]/u.test(str);
  }
}
