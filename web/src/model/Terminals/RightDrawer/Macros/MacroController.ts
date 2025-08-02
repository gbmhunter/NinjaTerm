import { makeAutoObservable } from "mobx";

import { App } from "src/model/App";
import { Macro, TxStepBreak, TxStepData } from "./Macro";
import { EnterKeyPressBehavior } from "src/model/Settings/TxSettings/TxSettings";

export const NUM_MACROS = 8;

export class MacroController {
  app: App;

  macrosArray: Macro[] = [];

  macroToDisplayInModal: Macro | null = null;

  isModalOpen: boolean = false;

  constructor(app: App) {
    this.app = app;

    this.recreateMacros(NUM_MACROS);

    makeAutoObservable(this); // Make sure this near the end

    this._loadConfig();
  }

  /**
   * Recreate the macros array with the given number of macros.
   * @param numMacros The number of macros to put into the macros array.
   */
  recreateMacros(numMacros: number) {

    // Remove all elements from macroArray
    this.macrosArray.splice(0, this.macrosArray.length);
    // Create individual macros. These will be displayed in the right-hand drawer
    // in the terminal view.
    for (let i = 0; i < numMacros; i++) {
      // Macros are numbered from 1 so that Ctrl+1, Ctrl+2, etc. can be used to send them
      this.macrosArray.push(
        new Macro(
          `M${i + 1}`,
          () => {
            if (this.app.settings.txSettings.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_LF) {
              return "\n";
            } else if (this.app.settings.txSettings.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_CR) {
              return "\r";
            } else if (this.app.settings.txSettings.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_CRLF) {
              return "\r\n";
            } else {
              throw new Error("Unknown enter key press behavior");
            }
          },
          this._saveConfig
        )
      );
    }
  }

  setMacroToDisplayInModal(macro: Macro) {
    this.macroToDisplayInModal = macro;
  }

  setIsModalOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  /**
   * Send the provided macro data to the serial port.
   * @param macro The macro to send.
   */
  send = async (macro: Macro) => {
    // Send the data to the serial port
    // If the user presses enter in the multiline text field, it will add a newline character
    // (0x0A or 10) to the string.
    const outputData = macro.dataToTxSequence();
    for (let i = 0; i < outputData.steps.length; i++) {
      // Determine type of item in array. If data, write to port. If break, send a break.
      const currStep = outputData.steps[i];
      if (currStep instanceof TxStepData) {
        this.app.writeBytesToSerialPort(currStep.data);
      } else if (currStep instanceof TxStepBreak) {
        await this.app.sendBreakSignal();
      }
    }
  }

  _saveConfig = () => {

    let config = this.app.profileManager.appData.currentAppConfig.terminal.macroController;

    config.macroConfigs = this.macrosArray.map((macro) => {
      return macro.toConfig();
    });

    this.app.profileManager.saveAppData();
  };

  _loadConfig() {
    let configToLoad = this.app.profileManager.appData.currentAppConfig.terminal.macroController;

    // If we get here we loaded a valid config. Apply config.
    this.recreateMacros(configToLoad.macroConfigs.length);
    for (let i = 0; i < configToLoad.macroConfigs.length; i++) {
      const macroConfig = configToLoad.macroConfigs[i];
      let macro = this.macrosArray[i];
      macro.loadConfig(macroConfig);
    };
  }
}
