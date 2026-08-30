import { comparer, makeAutoObservable, reaction, runInAction } from "mobx";

import { App } from "src/model/App";
import { Macro, TxStepBreak, TxStepData } from "./Macro";
import { EnterKeyPressBehavior } from "src/model/Settings/TxSettings/TxSettings";
import { ConnState } from "src/model/Settings/PortSettings/PortSettings";

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

  /**
   * Active `setInterval` handles for macros with `sendOnInterval=true` while
   * the port is OPENED. Keyed by macro reference; the stored `ms` lets
   * `_refreshIntervalTimers` skip restarting a timer when only an unrelated
   * macro changed.
   */
  private _intervalTimers: Map<Macro, { handle: ReturnType<typeof setInterval>; ms: number }> = new Map();

  /** Disposer for the MobX reaction that drives the interval-timer lifecycle. */
  private _intervalReactionDispose: (() => void) | null = null;

  constructor(app: App) {
    this.app = app;

    this.recreateMacros(NUM_MACROS);

    makeAutoObservable(this); // Make sure this near the end

    this._loadConfig();

    // Macros are part of a profile, so they have to be re-read when one is
    // loaded. Without this, loading a profile restored everything except the
    // macros, which kept the previous profile's until the app restarted.
    this.app.profileManager.registerOnConfigReload(['terminal.macroController'], () => {
      this._loadConfig();
    });

    // Drive interval-trigger timers: whenever the port's connection state or
    // any macro's `sendOnInterval` / `intervalMs` changes, recompute which
    // timers should be running. `comparer.structural` is needed because the
    // tracker returns a fresh object each call.
    this._intervalReactionDispose = reaction(
      () => ({
        opened: this.app.connController.connState === ConnState.OPENED,
        macroStates: this.macrosArray.map((m) => ({
          sendOnInterval: m.sendOnInterval,
          intervalMs: m.intervalMs,
        })),
      }),
      () => this._refreshIntervalTimers(),
      { equals: comparer.structural, fireImmediately: true },
    );
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

    // Batched: recreateMacros() splices macrosArray, which the interval-timer
    // reaction tracks. Without this the reaction would fire mid-rebuild, once
    // per macro, against a half-populated array.
    runInAction(() => {
      // The modal holds a reference to a Macro object, and every one of them is
      // about to be replaced. Close it rather than leave it pointing at a macro
      // that is no longer in the array (RulesSettings._loadConfig does the same
      // for its rule edit modal).
      this.macroToDisplayInModal = null;
      this.isModalOpen = false;

      // If we get here we loaded a valid config. Apply config.
      this.recreateMacros(configToLoad.macroConfigs.length);
      for (let i = 0; i < configToLoad.macroConfigs.length; i++) {
        const macroConfig = configToLoad.macroConfigs[i];
        const macro = this.macrosArray[i];
        macro.loadConfig(macroConfig);
      }
    });
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

  /**
   * Bring the interval-timer set in sync with the current observable state:
   * for each macro whose `sendOnInterval` is true and `intervalMs` is a
   * positive integer, ensure a timer is running with that period (recreating
   * if the period changed). Clear timers for macros that no longer qualify
   * (toggle off, invalid interval, or port closed).
   *
   * Called by the MobX `reaction` set up in the constructor.
   */
  private _refreshIntervalTimers(): void {
    const opened = this.app.connController.connState === ConnState.OPENED;

    // Build the desired set of (macro, intervalMs) pairs.
    const desired = new Map<Macro, number>();
    if (opened) {
      for (const macro of this.macrosArray) {
        if (!macro.sendOnInterval) continue;
        const ms = macro.intervalMsNumber;
        if (ms !== null) {
          desired.set(macro, ms);
        }
      }
    }

    // Clear any active timer no longer wanted.
    for (const [macro, entry] of this._intervalTimers) {
      if (!desired.has(macro)) {
        clearInterval(entry.handle);
        this._intervalTimers.delete(macro);
      }
    }

    // Start / restart timers for everything in `desired`. If a macro already
    // has a timer with the same period, leave its countdown alone.
    for (const [macro, ms] of desired) {
      const existing = this._intervalTimers.get(macro);
      if (existing !== undefined && existing.ms === ms) {
        continue;
      }
      if (existing !== undefined) {
        clearInterval(existing.handle);
      }
      const handle = setInterval(() => {
        void this.send(macro);
      }, ms);
      this._intervalTimers.set(macro, { handle, ms });
    }
  }

  /**
   * Tear down the interval reaction and any live timers. Intended for tests
   * and any future App.cleanup() integration. Idempotent.
   */
  cleanup(): void {
    if (this._intervalReactionDispose !== null) {
      this._intervalReactionDispose();
      this._intervalReactionDispose = null;
    }
    for (const entry of this._intervalTimers.values()) {
      clearInterval(entry.handle);
    }
    this._intervalTimers.clear();
  }
}
