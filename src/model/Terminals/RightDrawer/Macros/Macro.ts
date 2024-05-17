import { makeAutoObservable } from "mobx";
import { App } from "src/model/App";
import { z } from "zod";

export enum MacroDataType {
  ASCII = "ASCII",
  HEX = "HEX",
}

export class Macro {
  app: App;
  name: string;

  dataType: MacroDataType = MacroDataType.ASCII;
  data: string;
  isSettingsModalOpen: boolean = false;

  errorMsg: string = '';

  constructor(app: App, name: string, data: string) {
    this.app = app;
    this.name = name;
    this.data = data;

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

  send() {
    console.log("Send macro data:", this.data);
    // Send the data to the serial port
    // If the user presses enter in the multiline text field, it will add a newline character
    // (0x0A or 10) to the string.
    let data;
    if (this.dataType === MacroDataType.ASCII) {
      data = new TextEncoder().encode(this.data);
    } else if (this.dataType === MacroDataType.HEX) {
      // Remove spaces and new lines
      const hexString = this.data.replace(/[\s\n]/g, '');
      // Convert to Uint8Array
      data = new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    } else {
      throw new Error("Invalid data type.");
    }
    console.log("Data:", data);
    this.app.writeBytesToSerialPort(data);
  }

  setIsSettingsModalOpen(isOpen: boolean) {
    console.log("Set isSettingsModalOpen:", isOpen);
    this.isSettingsModalOpen = isOpen;
  }
}
