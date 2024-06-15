import { makeAutoObservable } from "mobx";
import { stringToUint8Array } from 'src/model/Util/Util';

export enum MacroDataType {
  ASCII = "ASCII",
  HEX = "HEX",
}

export class MacroConfig {
  version = 1;
  name = '';
  dataType = MacroDataType.ASCII;
  data = '';
  processEscapeChars = true;
  sendOnEnterValueForEveryNewLineInTextBox = true;
  sendBreakAtEndOfEveryLineOfHex = false;
}

function concatenate(resultConstructor: any, ...arrays: any[]) {
  let totalLength = 0;
  for (const arr of arrays) {
      totalLength += arr.length;
  }
  const result = new resultConstructor(totalLength);
  let offset = 0;
  for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
  }
  return result;
}

export class TxStepData {
  data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }
}

export class TxStepBreak {

}

export class TxSequence {
  steps: (TxStepData | TxStepBreak)[] = [];
}

export class Macro {
  name: string;

  dataType: MacroDataType = MacroDataType.ASCII;
  data: string;
  isSettingsModalOpen: boolean = false;

  processEscapeChars: boolean = true;

  sendOnEnterValueForEveryNewLineInTextBox: boolean = true;

  sendBreakAtEndOfEveryLineOfHex: boolean = false;

  errorMsg: string = '';

  /**
   * Callback function which is passed to the constructor.
   */
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
  dataToBytes = (): TxSequence => {
    let txSequence = new TxSequence();
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
      let txStepData = new TxStepData(stringToUint8Array(processedStr));
      txSequence.steps.push(txStepData);
    } else if (this.dataType === MacroDataType.HEX) {
      // If "sendEnterValueForEveryNewLineInTextBox" is true, then we need to parse the hex
      // per line
      let linesOfHex;
      if (this.sendBreakAtEndOfEveryLineOfHex) {
        // Split the string into lines, since we need to send break signals
        // between each line
        linesOfHex = this.data.split('\n');
      } else {
        // Treat the entire string as one hex string since no
        // break signals are needed
        linesOfHex = [this.data];
      }

      for (let i = 0; i < linesOfHex.length; i++) {
        // Remove all spaces and new lines. If break signals at the end of every line
        // is disabled, there might be new lines here, and we just ignore them along
        // with all spaces.
        let str = linesOfHex[i];
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
        let txStepData = new TxStepData(this._hexStringToUint8Array(str));
        txSequence.steps.push(txStepData);

        if (this.sendBreakAtEndOfEveryLineOfHex) {
          // Add a break signal
          txSequence.steps.push(new TxStepBreak());
        }
      }
    } else {
      throw new Error("Invalid data type");
    }


    //   // Remove all spaces and new lines
    //   let str = this.data;
    //   str = str.replace(/ /g, '');
    //   str = str.replace(/\n/g, '');

    //   if (str.length === 0) {
    //     throw new Error("Hex string is empty.");
    //   }

    //   if (str.length % 2 !== 0) {
    //     throw new Error("Hex string must have an even number of characters.");
    //   }

    //   if (/[^a-fA-F0-9]/u.test(str)) {
    //     throw new Error("Hex string must only contain: the numbers 0-9 and A-F (or a-f).");
    //   }

    //   // Convert hex string to Uint8Array
    //   bytes = this._hexStringToUint8Array(str);
    // } else {
    //   throw new Error("Invalid data type");
    // }

    return txSequence;
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

  loadConfig = (config: MacroConfig) => {
    this.name = config.name;
    this.data = config.data;
    this.dataType = config.dataType;
    this.processEscapeChars = config.processEscapeChars;
    this.sendOnEnterValueForEveryNewLineInTextBox = config.sendOnEnterValueForEveryNewLineInTextBox;
    this.sendBreakAtEndOfEveryLineOfHex = config.sendBreakAtEndOfEveryLineOfHex
  }

  toConfig = (): MacroConfig => {
    return {
      version: 1,
      name: this.name,
      data: this.data,
      dataType: this.dataType,
      processEscapeChars: this.processEscapeChars,
      sendOnEnterValueForEveryNewLineInTextBox: this.sendOnEnterValueForEveryNewLineInTextBox,
      sendBreakAtEndOfEveryLineOfHex: this.sendBreakAtEndOfEveryLineOfHex,
    };
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

  setSendBreakAtEndOfEveryLineOfHex(allow: boolean) {
    this.sendBreakAtEndOfEveryLineOfHex = allow;
    // This could change the validation status, need to
    // re-validate
    this.validateData();
    if (this.onChange) {
      this.onChange();
    }
  }
}
