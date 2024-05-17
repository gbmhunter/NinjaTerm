import { makeAutoObservable } from "mobx";
import { App } from "src/model/App";

export enum MacroDataType {
  ASCII = 'ASCII',
  HEX = 'HEX',
}

export class Macro {
  app: App;
  name: string;

  dataType: MacroDataType = MacroDataType.ASCII;
  data: string;
  isSettingsModalOpen: boolean = false;

  constructor(app: App, name: string, data: string) {
    this.app = app;
    this.name = name;
    this.data = data;

    makeAutoObservable(this); // Make sure this near the end
  }

  setDataType(dataType: MacroDataType) {
    this.dataType = dataType;
  }

  setData(data: string) {
    this.data = data;
  }

  send() {
    console.log('Send macro data:', this.data);
    // Send the data to the serial port
    // Convert string to Uint8Array
    // If the user presses enter in the multiline text field, it will add a newline character
    // (0x0A or 10) to the string.
    const data = new TextEncoder().encode(this.data);
    console.log('Data:', data);
    this.app.writeBytesToSerialPort(data);
  }

  setIsSettingsModalOpen(isOpen: boolean) {
    console.log('Set isSettingsModalOpen:', isOpen);
    this.isSettingsModalOpen = isOpen;
  }
}
