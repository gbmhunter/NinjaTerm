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

  /**
   * Buffer of decoded but not-yet-finalised RX bytes. Bytes are appended via
   * `onRxBytes`; complete lines (terminated by `\n`, with an optional `\r`
   * stripped before matching) are extracted and tested against each macro
   * with `sendOnRxMatch=true`. Cleared on disconnect so stale partial lines
   * can't bleed into the next session.
   */
  private _rxLineBuffer: string = '';

  /** Streaming UTF-8 decoder shared across `onRxBytes` calls. */
  private _rxDecoder: TextDecoder = new TextDecoder('utf-8', { fatal: false });

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

    const config = this.app.profileManager.appData.currentAppConfig.terminal.macroController;

    config.macroConfigs = this.macrosArray.map((macro) => {
      return macro.toConfig();
    });

    this.app.profileManager.saveAppData();
  };

  _loadConfig() {
    const configToLoad = this.app.profileManager.appData.currentAppConfig.terminal.macroController;

    // If we get here we loaded a valid config. Apply config.
    this.recreateMacros(configToLoad.macroConfigs.length);
    for (let i = 0; i < configToLoad.macroConfigs.length; i++) {
      const macroConfig = configToLoad.macroConfigs[i];
      const macro = this.macrosArray[i];
      macro.loadConfig(macroConfig);
    };
  }

  /**
   * Feed received bytes from the serial port into the auto-response line
   * matcher. Called from `App.parseRxData`, which is the single chokepoint
   * for inbound RX data (TX echo does not pass through it). The matcher
   * accumulates a line buffer, splits off complete lines on `\n`, and tests
   * each finalised line against macros with `sendOnRxMatch=true`.
   *
   * Issue #364.
   */
  onRxBytes(bytes: Uint8Array): void {
    // `stream: true` preserves trailing partial multi-byte sequences across
    // calls so a UTF-8 codepoint split across two packets decodes correctly.
    this._rxLineBuffer += this._rxDecoder.decode(bytes, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = this._rxLineBuffer.indexOf('\n')) !== -1) {
      let line = this._rxLineBuffer.slice(0, newlineIdx);
      // Strip a single trailing CR so CRLF endings match identically to LF endings.
      if (line.endsWith('\r')) {
        line = line.slice(0, -1);
      }
      this._rxLineBuffer = this._rxLineBuffer.slice(newlineIdx + 1);
      this._handleFinalisedRxLine(line);
    }
  }

  /**
   * Test a single finalised RX line against every macro with
   * `sendOnRxMatch=true` and fire each match.
   */
  private _handleFinalisedRxLine(line: string): void {
    for (const macro of this.macrosArray) {
      if (!macro.sendOnRxMatch) {
        continue;
      }
      const regex = macro.rxMatchRegex;
      if (regex !== null && regex.test(line)) {
        // Fire-and-forget: macro send writes bytes asynchronously but we
        // don't need to await it for the matcher's correctness.
        void this.send(macro);
      }
    }
  }

  /**
   * Called by the connection-state reaction in `App` when the port
   * transitions to OPENED. Fires every macro flagged with `sendOnConnect`.
   */
  onConnect(): void {
    for (const macro of this.macrosArray) {
      if (macro.sendOnConnect) {
        void this.send(macro);
      }
    }
  }

  /**
   * Called by the connection-state reaction in `App` when the port closes.
   * Drops any partial line so it can't be falsely joined with the first
   * bytes of the next session.
   */
  onDisconnect(): void {
    this._rxLineBuffer = '';
  }
}
