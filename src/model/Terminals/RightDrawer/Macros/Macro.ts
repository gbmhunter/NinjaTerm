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

  processEscapeChars: boolean = true;

  sendOnEnterValueForEveryNewLineInTextBox: boolean = true;

  errorMsg: string = '';

  getNewLineReplacementStr: () => string;

  onChange: (() => void) | null;

  constructor(name: string, getNewLineReplacementStr: () => string, onChange: (() => void) | null = null) {
    this.name = name;
    this.data = '';
    this.getNewLineReplacementStr = getNewLineReplacementStr;
    this.onChange = onChange;

    makeAutoObservable(this); // Make sure this near the end
  }

  setDataType(dataType: MacroDataType) {
    this.dataType = dataType;
    this.validateData();
    if (this.onChange) {
      this.onChange();
    }
  }

  setData(data: string) {
    this.data = data;
    this.validateData();
    if (this.onChange) {
      this.onChange();
    }
  }

  validateData() {
    // Validate the data

    try {
      // TODO: Fix hardcoded \n
      this.dataToBytes();
      this.errorMsg = '';
    } catch (e) {
      if (e instanceof Error) {
        this.errorMsg = e.message;
      } else {
        throw Error("Unexpected error type");
      }
    }

    if (this.onChange) {
      this.onChange();
    }
  }

  setIsSettingsModalOpen(isOpen: boolean) {
    console.log("Set isSettingsModalOpen:", isOpen);
    this.isSettingsModalOpen = isOpen;
  }

  /**
   * Converts the data in the macro's text area to a Uint8Array suitable
   * for sending out the serial port.
   *
   * @param newLineReplacementChar Ignored if the data type is HEX. If the data type is ASCII, this string will replace all instances of LF in the data.
   * @returns The Uint8Array representation of the data.
   */
  dataToBytes = (): Uint8Array => {
    let bytes;
    if (this.dataType === MacroDataType.ASCII) {
      // Replace all instances of LF with the newLinesChar
      // NOTE: This has to be done before JSON.parse() is called below, otherwise the LF that
      // JSON.parse() might introduce into the string will also be converted by this
      // let str = this.data;

      // Split the string into lines
      let lines = this.data.split('\n');

      // Loop through each line
      let processedStr = '';
      for (let i = 0; i < lines.length; i++) {
        // If we are sending the "on enter" sequence for every new line in the text box, then we need to replace
        // all new lines with the newLineReplacementChar
        if (i !== 0 && this.sendOnEnterValueForEveryNewLineInTextBox) {
          processedStr += this.getNewLineReplacementStr();
        }
        // Add the line, parsing as JSON if asked for
        // This will convert all literal "\r" and "\n" to actual CR and LF characters
        // (among others like \t).
        if (this.processEscapeChars) {
          // JSON.parse will throw a SyntaxError if the string is not valid JSON
          try {
            processedStr += JSON.parse(`"${lines[i]}"`);
          } catch (e) {
            throw new Error('Line failed during JSON.parse(). Likely has unfinished escape codes or unescaped quotes.');
          }
        } else {
          processedStr += lines[i];
        }
      }

      // Convert to Uint8Array
      bytes = stringToUint8Array(processedStr);
    } else if (this.dataType === MacroDataType.HEX) {
      // Remove all spaces and new lines
      let str = this.data;
      str = str.replace(/ /g, '');
      str = str.replace(/\n/g, '');

      if (str.length === 0) {
        throw new Error("Hex string is empty.");
      }

      if (str.length % 2 !== 0) {
        throw new Error("Hex string must have an even number of characters.");
      }

      if (/[^a-fA-F0-9]/u.test(str)) {
        throw new Error("Hex string must only contain: the numbers 0-9 and A-F (or a-f).");
      }

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

  /**
   * Returns true if the macro data is not zero and the data is valid, otherwise returns false.
   */
  get canSend() {
    return this.data.length !== 0 && this.errorMsg === '';
  }

  fromJSON = (json: string) => {
    const objFromJson = JSON.parse(json);
    Object.assign(this, objFromJson);
  }

  setOnChange(onChange: () => void) {
    this.onChange = onChange;
  }

  setProcessEscapeChars(allow: boolean) {
    this.processEscapeChars = allow;
    // This could change the validation status, need to
    // re-validate
    this.validateData();
    if (this.onChange) {
      this.onChange();
    }
  }

  setSendOnEnterValueForEveryNewLineInTextBox(allow: boolean) {
    this.sendOnEnterValueForEveryNewLineInTextBox = allow;
    if (this.onChange) {
      this.onChange();
    }
  }
}
