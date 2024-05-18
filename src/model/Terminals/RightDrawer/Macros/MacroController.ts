import { makeAutoObservable } from 'mobx';
import { App } from 'src/model/App';
import { Macro } from './Macro';

export class MacroController {

  app: App;

  macrosArray: Macro[] = [];

  macroToDisplayInModal: Macro | null = null;

  isModalOpen: boolean = false;

  constructor(app: App) {

    this.app = app;

    // Create individual macros. These will be displayed in the right-hand drawer
    // in the terminal view.
    for (let i = 0; i < 3; i++) {
      this.macrosArray.push(new Macro(`M${i}`));
    }

    makeAutoObservable(this); // Make sure this near the end
  }

  setMacroToDisplayInModal(macro: Macro) {
    console.log('Set macro to display in modal:', macro);
    this.macroToDisplayInModal = macro;
  }

  setIsModalOpen(isOpen: boolean) {
    console.log('Set isModalOpen:', isOpen);
    this.isModalOpen = isOpen;
  }

  send(macro: Macro) {
    console.log("Send macro data:", macro.data);
    // Send the data to the serial port
    // If the user presses enter in the multiline text field, it will add a newline character
    // (0x0A or 10) to the string.
    let outputData;
    outputData = macro.textAreaToBytes('\n');
    console.log("Data:", outputData);
    this.app.writeBytesToSerialPort(outputData);
  }

}
