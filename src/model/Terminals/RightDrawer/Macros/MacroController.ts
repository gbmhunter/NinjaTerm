import { makeAutoObservable } from "mobx";
import { App } from "src/model/App";
import { Macro } from "./Macro";
import { EnterKeyPressBehavior } from "src/model/Settings/TxSettings/TxSettings";

const NUM_MACROS = 8;

const CONFIG_KEY = ["macros"];
const CONFIG_VERSION = 1;

class Config {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = CONFIG_VERSION;

  constructor() {
    // makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  macros: any[] = [];
}

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
            if (this.app.settings.txSettings.config.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_LF) {
              return "\n";
            } else if (this.app.settings.txSettings.config.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_CR) {
              return "\r";
            } else if (this.app.settings.txSettings.config.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_CRLF) {
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
    console.log("Set macro to display in modal:", macro);
    this.macroToDisplayInModal = macro;
  }

  setIsModalOpen(isOpen: boolean) {
    console.log("Set isModalOpen:", isOpen);
    this.isModalOpen = isOpen;
  }

  send(macro: Macro) {
    console.log("Send macro data:", macro.data);
    // Send the data to the serial port
    // If the user presses enter in the multiline text field, it will add a newline character
    // (0x0A or 10) to the string.
    let outputData;
    outputData = macro.dataToBytes();
    console.log("Data:", outputData);
    this.app.writeBytesToSerialPort(outputData);
  }

  _saveConfig = () => {
    let config = new Config();
    config.macros = this.macrosArray.map((macro) => {
      return JSON.stringify(macro);
    });
    console.log("Saving config: ", config);
    this.app.appStorage.saveConfig(CONFIG_KEY, config);
  };

  _loadConfig() {
    let deserializedConfig = this.app.appStorage.getConfig(CONFIG_KEY);

    //===============================================
    // UPGRADE PATH
    //===============================================
    if (deserializedConfig === null) {
      // No data exists, create
      console.log(`No config found in local storage for key "${CONFIG_KEY}". Creating...`);
      this._saveConfig();
      return;
    } else if (deserializedConfig.version === CONFIG_VERSION) {
      console.log(`Up-to-date config found for key "${CONFIG_KEY}".`);
    } else {
      console.error(`Out-of-date config version ${deserializedConfig.version} found for key "${CONFIG_KEY}".` + ` Updating to version ${CONFIG_VERSION}.`);
      this._saveConfig();
      return;
    }

    // If we get here we loaded a valid config. Apply config.
    this.recreateMacros(deserializedConfig.macros.length);
    for (let i = 0; i < deserializedConfig.macros.length; i++) {
      const macroData = deserializedConfig.macros[i];
      let macro = this.macrosArray[i];
      macro.fromJSON(macroData);
    };
  }
}
