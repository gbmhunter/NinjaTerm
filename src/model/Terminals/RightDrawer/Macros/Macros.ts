import { makeAutoObservable } from 'mobx';
import { App } from 'src/model/App';

export class Macro {
  app: App;
  name: string;
  data: string;

  constructor(app: App, name: string, data: string) {
    this.app = app;
    this.name = name;
    this.data = data;

    makeAutoObservable(this); // Make sure this near the end
  }

  setData(data: string) {
    this.data = data;
  }

  send() {
    console.log('Send macro data:', this.data);
    // Send the data to the serial port
    // Convert string to Uint8Array
    const data = new TextEncoder().encode(this.data);
    this.app.writeBytesToSerialPort(data);
  }
}

export class Macros {

  macrosArray: Macro[] = [];

  constructor(app: App) {

    // Create individual macros. These will be displayed in the right-hand drawer
    // in the terminal view.
    for (let i = 0; i < 3; i++) {
      this.macrosArray.push(new Macro(app, `M${i}`, ''));
    }

    makeAutoObservable(this); // Make sure this near the end
  }

}
