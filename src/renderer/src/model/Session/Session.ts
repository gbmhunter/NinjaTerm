import { makeAutoObservable, reaction, runInAction } from 'mobx';

import type { App } from '../App';
import { MainPanes } from '../MainPanes';
import { Settings } from '../Settings/Settings';
import { DataViewConfiguration } from '../Settings/DisplaySettings/DisplaySettings';
import { ConnState } from '../Settings/PortSettings/PortSettings';
import {
  BackspaceKeyPressBehavior,
  DeleteKeyPressBehavior,
  EnterKeyPressBehavior,
  TxMode,
  enterKeyBytes,
} from '../Settings/TxSettings/TxSettings';
import { PresetController } from '../Presets/PresetController';
import { ConfigBranch } from '../Presets/PresetScope';
import { ConnController } from '../ConnController/ConnController';
import Terminals from '../Terminals/Terminals';
import { SingleTerminal, DataDirection } from '../Terminals/SingleTerminal/SingleTerminal';
import TxLineController, { focusTxLineBar } from '../TxLine/TxLineController';
import Graphing from '../Graphing/Graphing';
import Logging from '../Logging/Logging';
import FakePortsController from '../FakePorts/FakePortsController';
import { SelectionInfo } from '../SelectionController/SelectionController';
import { isRunningOnWindows } from '../Util/Util';
import { isTypingInField } from '../Util/KeyboardUtil';
import { ProfileConfig } from '../AppDataManager/DataClasses/ProfileConfig';
import { SessionData } from '../AppDataManager/DataClasses/SessionData';

/**
 * One session: a connection plus everything configured around it -- the
 * connection settings, the terminal panes and their RX/TX/display settings,
 * macros, filters, highlight rules, logging and graphing.
 *
 * This is what `App` used to be, minus the things that are genuinely
 * application-wide (presets, the snackbar, the updater, the MCP server, the
 * main-pane selection). `App` holds a list of these and an active one; the
 * views read the active session through `App`'s delegating getters, so a tab
 * switch re-renders everything with no view knowing sessions exist.
 *
 * Every session-owned class takes its `Session`, not the `App`, and reads
 * settings and the connection through it. That is what keeps session B's
 * connection reading session B's baud rate while session A is the one on
 * screen.
 *
 * The persisted half is `SessionData` in `appData.sessions`; `config` reads
 * through to it and is the single copy of every setting (see `SettingsBranch`).
 */
export class Session {
  readonly app: App;

  /** Matches `SessionData.id`. Stable for the life of the session. */
  readonly id: string;

  settings: Settings;

  presetController: PresetController;

  /**
   * Responsible for all connection related functionality. This supports different types of connections (serial port, socket, Bluetooth).
   */
  connController: ConnController;

  terminals: Terminals;

  /** Holds the line being composed when TX line mode is active. */
  txLineController: TxLineController;

  graphing: Graphing;

  logging: Logging;

  fakePortController: FakePortsController;

  numBytesReceived = 0;

  numBytesTransmitted = 0;

  // Rate tracking for TX/RX
  rxRateBps: number = 0;
  txRateBps: number = 0;

  // Time window for rate calculation (in milliseconds)
  private readonly RATE_CALCULATION_WINDOW_MS = 3000; // 3 seconds

  // Hard cap so a burst of small chunks (e.g. one BLE notification per byte)
  // can't grow these arrays without bound between cleanup ticks. With a
  // 500ms cleanup interval, 2048 entries is well above the chunk count any
  // real transport would produce in that window.
  private readonly MAX_DATA_POINTS = 2048;

  /**
   * Trim point for the arrays below. Recording lets them overshoot `MAX_DATA_POINTS`
   * and then trims back in one splice, rather than splicing a single entry off the
   * front on every push — that is O(n) in the array length, so once at the cap it
   * made recording a data point O(n) instead of O(1). The overshoot is harmless:
   * `updateTransmissionRates` filters by timestamp regardless.
   */
  private readonly DATA_POINT_TRIM_AT = 2 * 2048;

  // Arrays to track byte counts over time. Deliberately not observable — see the
  // `makeAutoObservable` call in the constructor.
  private rxDataPoints: Array<{ timestamp: number; bytes: number }> = [];
  private txDataPoints: Array<{ timestamp: number; bytes: number }> = [];

  /**
   * Name of the preset most recently applied to this session. Shown in the
   * window title while this session is active.
   */
  lastAppliedPresetName: string = 'No preset';

  /**
   * Who to tell when a preset or undo has rewritten part of `config`. Each
   * `SettingsBranch` registers here to re-seed its applyable fields; the
   * collection-shaped controllers (rules, macros, filters) register to rebuild
   * their lists.
   */
  private _configReloadCallbacks: { branches: ConfigBranch[]; callback: () => void }[] = [];

  // Disposer for the connection-state reaction that drives auto-response
  // macros' on-connect / on-disconnect triggers (issue #364).
  private connStateReactionDispose: (() => void) | null = null;

  constructor(app: App, id: string) {
    this.app = app;
    this.id = id;
    if (this.findData() === undefined) {
      throw new Error(`No session with id "${id}" in app data.`);
    }

    this.settings = new Settings(this);

    // Needs settings to already exist.
    this.presetController = new PresetController(this);

    this.connController = new ConnController(this);

    this.terminals = new Terminals(this);

    this.txLineController = new TxLineController();

    this.graphing = new Graphing(this);

    this.logging = new Logging(this);

    this.fakePortController = new FakePortsController(this);

    // Drive auto-response macros: fire on-connect macros each time the port
    // transitions to OPENED, and reset the RX-line buffer on close so a
    // stale partial line can't bleed into the next connection (issue #364).
    this.connStateReactionDispose = reaction(
      () => this.connController.connState,
      (state) => {
        const macroController = this.terminals.rightDrawer.macroController;
        if (state === ConnState.OPENED) {
          macroController.onConnect();
        } else if (state === ConnState.CLOSED) {
          macroController.onDisconnect();
        }
      },
    );

    makeAutoObservable<Session, 'rxDataPoints' | 'txDataPoints' | '_configReloadCallbacks' | 'connStateReactionDispose'>(this, {
      app: false,
      // Nothing observes these reactively: they are read only by
      // `updateTransmissionRates`, on a timer, which writes the `rxRateBps` /
      // `txRateBps` observables the status bar actually watches.
      rxDataPoints: false,
      txDataPoints: false,
      _configReloadCallbacks: false,
      connStateReactionDispose: false,
    });
  }

  //================================================================================
  // Persisted half
  //================================================================================

  private findData(): SessionData | undefined {
    return this.app.profileManager.appData.sessions.find((session) => session.id === this.id);
  }

  /** This session's row in `appData.sessions`. */
  get data(): SessionData {
    const data = this.findData();
    if (data === undefined) {
      throw new Error(`Session "${this.id}" is no longer in app data. Was it closed?`);
    }
    return data;
  }

  /**
   * This session's whole configuration -- the single copy of every setting.
   * `SettingsBranch` and the collection controllers read and write through it.
   */
  get config(): ProfileConfig {
    return this.data.config;
  }

  get name(): string {
    return this.data.name;
  }

  setName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed === '') {
      return;
    }
    this.data.name = trimmed;
    this.saveAppData();
  };

  /** True when this is the session whose tab is selected. */
  get isActive(): boolean {
    return this.app.activeSessionId === this.id;
  }

  //================================================================================
  // App-wide services, reachable through the session for the classes it owns
  //================================================================================

  get snackbar() {
    return this.app.snackbar;
  }

  get profileManager() {
    return this.app.profileManager;
  }

  saveAppData = () => {
    this.app.profileManager.saveAppData();
  };

  /**
   * Switches the main pane to the terminal, but only if this session is the
   * one on screen. A background session finishing a reconnect must not yank
   * the user away from what they are looking at.
   */
  showTerminalPane = () => {
    if (this.isActive) {
      this.app.setShownMainPane(MainPanes.TERMINAL);
    }
  };

  //================================================================================
  // Config reload notifications
  //================================================================================

  /**
   * Ask to be told when part of this session's config is reloaded.
   *
   * @param branches The config branches this callback cares about. It is only
   *    invoked when one of them is among those that changed, so a preset that
   *    only touches RX settings doesn't make the rules pane rebuild its list and
   *    close its edit modal.
   */
  registerOnConfigReload = (branches: ConfigBranch[], callback: () => void) => {
    this._configReloadCallbacks.push({ branches, callback });
  };

  /**
   * Tell every registered part of this session to re-read `config`. Called
   * after a preset patches it in place, or undo replaces subtrees of it.
   *
   * @param changedBranches Undefined means "everything changed".
   */
  notifyConfigReloaded = (changedBranches?: ConfigBranch[]) => {
    for (const { branches, callback } of this._configReloadCallbacks) {
      if (changedBranches === undefined || branches.some((b) => changedBranches.includes(b))) {
        callback();
      }
    }
  };

  //================================================================================
  // Data path
  //================================================================================

  /**
   * This is called from whatever connection type is currently being used. All data should be funnelled through this function no matter what the connection type is.
   *
   * A prototype method rather than an arrow field (as is `writeBytesToSerialPort`)
   * so tests can spy on or replace it per instance.
   *
   * @param rxData The received data.
   */
  parseRxData(rxData: Uint8Array) {
    const performanceMonitor = this.app.performanceMonitor;

    // Start performance monitoring for data processing
    performanceMonitor.startTiming('dataProcessing');

    // Process data immediately
    performanceMonitor.startTiming('terminalRender');
    this.terminals.txRxTerminal.parseData(rxData, DataDirection.RX);
    this.terminals.rxTerminal.parseData(rxData, DataDirection.RX);
    performanceMonitor.endTiming('terminalRender');

    performanceMonitor.startTiming('graphingProcessing');
    this.graphing.parseData(rxData);
    performanceMonitor.endTiming('graphingProcessing');

    this.logging.handleRxData(rxData);

    // Auto-response macros: feed raw RX bytes into the macro controller's
    // line matcher. TX (including local echo) never enters parseRxData, so
    // a macro can't accidentally trigger itself via its own response.
    this.terminals.rightDrawer.macroController.onRxBytes(rxData);

    // Sound playback for matching regex rules is driven by per-row reactions
    // in `SingleTerminal` (see the `_setupRuleSoundReaction` setup there),
    // not from this raw-byte path. That gives line-level granularity and
    // avoids re-firing as bytes trickle in.

    // End performance monitoring and record metrics
    const totalProcessingTime = performanceMonitor.endTiming('dataProcessing');
    performanceMonitor.recordDataProcessing(rxData.length, totalProcessingTime);

    // Update stats
    this.numBytesReceived += rxData.length;
    this.recordRxDataPoint(rxData.length);

    // Push raw text to the MCP service for streaming resource subscribers,
    // tagged with this session so a client can follow one stream.
    if (this.app.profileManager.appData.mcpEnabled) {
      const text = new TextDecoder('utf-8', { fatal: false }).decode(rxData);
      window.electronAPI.mcp.pushRxData(this.id, text);
    }
  }

  /**
   * Writes bytes to the serial port. Also:
   * - Sends the data to the TX terminal view
   * - Sends the data to the TX/RX terminal view, if local TX echo is enabled.
   * - Sends the data to the logger.
   *
   * @param bytesToWrite
   */
  async writeBytesToSerialPort(bytesToWrite: Uint8Array) {
    try {
      await this.connController.writeData(bytesToWrite);
    } catch (error) {
      this.snackbar.sendToSnackbar(`Error writing data: ${error}`, 'error');
      return;
    }

    this.terminals.txTerminal.parseData(bytesToWrite, DataDirection.TX);
    // Check if local TX echo is enabled, and if so, send the data to
    // the combined single terminal.
    if (this.settings.rxSettings.localTxEcho) {
      this.terminals.txRxTerminal.parseData(bytesToWrite, DataDirection.TX);
    }

    // Also send this data to the logger, it may need it
    this.logging.handleTxData(bytesToWrite);

    runInAction(() => {
      this.numBytesTransmitted += bytesToWrite.length;
    });

    // Record data point for rate calculation
    this.recordTxDataPoint(bytesToWrite.length);
  }

  /**
   * Sends a break signal to the serial port for 200ms. Port must be open otherwise an error will be shown.
   */
  async sendBreakSignal() {
    // TODO: Implement break signal support in the main process IPC handlers
    this.snackbar.sendToSnackbar('Break signal not yet implemented in Electron version.', 'warning');
  }

  /**
   * Sends the line currently held in the TX line bar, then clears it.
   *
   * The whole line -- text plus terminator -- goes out in ONE call to
   * `writeBytesToSerialPort`, and so one call to `ConnController.writeData`.
   * That is the entire point of line mode: character mode writes once per
   * keystroke, which on a socket means one TCP segment per character, and
   * instruments that parse one datagram per command ignore the result.
   * See issue #410.
   */
  async sendPendingLine() {
    if (this.connController.connState !== ConnState.OPENED) {
      this.snackbar.sendToSnackbar('Cannot send, the connection is not open.', 'error');
      return;
    }

    const behavior = this.settings.txSettings.enterKeyPressBehavior;
    const bytesToWrite = this.txLineController.buildBytes(behavior);

    if (this.settings.displaySettings.autoScrollLockOnTx) {
      this.terminals.activeTerminal.setScrollLock(true);
    }

    if (bytesToWrite.length > 0) {
      await this.writeBytesToSerialPort(bytesToWrite);
    }

    // A break is a line condition rather than a character, so it follows the
    // text out-of-band. Matches what character mode does on Enter.
    if (behavior === EnterKeyPressBehavior.SEND_BREAK) {
      await this.sendBreakSignal();
    }

    this.txLineController.commitToHistory();
  }

  clearAllData = () => {
    this.terminals.txRxTerminal.clear();
    this.terminals.txTerminal.clear();
    this.terminals.rxTerminal.clear();
  };

  //================================================================================
  // Keyboard, clipboard and find
  //================================================================================

  /**
   * This is called from either the TX/RX terminal or TX terminal
   * (i.e. any terminal pane that is allowed to send data). This function
   * determines what the user has pressed and what data to send out the
   * serial port because of it.
   *
   * An arrow function because it is passed around as a callback (the
   * terminals receive it at construction).
   *
   * @param event The React keydown event.
   */
  handleTerminalKeyDown = async (event: React.KeyboardEvent) => {
    // Capture all key presses and prevent default actions or bubbling.
    // preventDefault() prevents a Tab press from moving focus to another element on screen
    event.preventDefault();
    event.stopPropagation();

    if (this.connController.connState !== ConnState.OPENED) {
      // Serial port is not open, so don't send anything
      return;
    }

    // In line mode nothing is sent per-keystroke; the line bar owns the text
    // until Enter. The bar normally has focus, but the terminal can still hold
    // it (e.g. straight after a click), so forward a printable key into the
    // buffer and move focus there rather than dropping the keystroke.
    if (this.settings.txSettings.txMode === TxMode.LINE) {
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        this.txLineController.setPendingLine(this.txLineController.pendingLine + event.key);
      }
      focusTxLineBar();
      return;
    }

    // Serial port is open, let's send it to the serial
    // port

    // Convert event.key to required ASCII number. This would be easier if we could
    // use keyCode, but this method is deprecated!
    const bytesToWrite: number[] = [];
    // List of allowed symbols, includes space char also
    const symbols = '`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/? ';

    // List of all alphanumeric chars
    const alphabeticChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqurstuvwxyz';
    const alphaNumericChars = alphabeticChars + '0123456789';
    let sendBreakSignal = false;
    if (event.key === 'Control' || event.key === 'Shift' || event.key === 'Alt') {
      // Don't send anything if a control/shift/alt key was pressed by itself
      return;
    }
    //===========================================================
    // Ctrl-Shift-B: Send break signal
    //===========================================================
    else if (event.ctrlKey && event.shiftKey && event.key === 'B') {
      // Set flag to true, this is handled at the bottom of the function
      // and determines whether we send the break signal or data.
      sendBreakSignal = true;
    } else if (event.ctrlKey) {
      // Most presses with the Ctrl key held down should do nothing. One exception is
      // if sending 0x01-0x1A when Ctrl-A through Ctrl-Z is pressed is enabled
      if (this.settings.txSettings.send0x01Thru0x1AWhenCtrlAThruZPressed && event.key.length === 1 && alphabeticChars.includes(event.key)) {
        // Ctrl-A through Ctrl-Z is has been pressed
        // Send 0x01 through 0x1A, which is easily done by getting the char, converting to
        // uppercase if lowercase and then subtracting 64
        bytesToWrite.push(event.key.toUpperCase().charCodeAt(0) - 64);
      } else {
        // Ctrl key was pressed, but we don't want to send anything
        return;
      }
    } else if (event.altKey) {
      if (this.settings.txSettings.sendEscCharWhenAltKeyPressed && event.key.length === 1 && alphabeticChars.includes(event.key)) {
        // Alt-A through Alt-Z is has been pressed
        // Send ESC char (0x1B) followed by the char
        bytesToWrite.push(0x1b);
        bytesToWrite.push(event.key.charCodeAt(0));
      } else {
        // Alt key was pressed with another key, but we don't want to do anything with it
        return;
      }
    } else if (event.key === 'Enter') {
      if (this.settings.txSettings.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_BREAK) {
        // A break is a line condition, not a character. Flag it so the send at
        // the bottom sends the break instead of falling through to an
        // (empty) write.
        sendBreakSignal = true;
      } else {
        bytesToWrite.push(...enterKeyBytes(this.settings.txSettings.enterKeyPressBehavior));
      }
    } else if (event.key.length === 1 && alphaNumericChars.includes(event.key)) {
      // Pressed key is alphanumeric
      bytesToWrite.push(event.key.charCodeAt(0));
    } else if (event.key.length === 1 && symbols.includes(event.key)) {
      // Pressed key is a symbol (e.g. ';?.,<>)
      // Do same thing as with alphanumeric cars
      bytesToWrite.push(event.key.charCodeAt(0));
    }
    //===========================================================
    // HANDLE BACKSPACE AND DELETE KEY PRESSES
    //===========================================================
    else if (event.key === 'Backspace') {
      // Work out whether to send BS (0x08) or DEL (0x7F) based on settings
      if (this.settings.txSettings.backspaceKeyPressBehavior === BackspaceKeyPressBehavior.SEND_BACKSPACE) {
        bytesToWrite.push(0x08);
      } else if (this.settings.txSettings.backspaceKeyPressBehavior === BackspaceKeyPressBehavior.SEND_DELETE) {
        bytesToWrite.push(0x7f);
      } else {
        throw Error('Unsupported backspace key press behavior!');
      }
    } else if (event.key === 'Delete') {
      // Delete also has the option of sending [ESC][3~
      if (this.settings.txSettings.deleteKeyPressBehavior === DeleteKeyPressBehavior.SEND_BACKSPACE) {
        bytesToWrite.push(0x08);
      } else if (this.settings.txSettings.deleteKeyPressBehavior === DeleteKeyPressBehavior.SEND_DELETE) {
        bytesToWrite.push(0x7f);
      } else if (this.settings.txSettings.deleteKeyPressBehavior === DeleteKeyPressBehavior.SEND_VT_SEQUENCE) {
        bytesToWrite.push(0x1b, '['.charCodeAt(0), '3'.charCodeAt(0), '~'.charCodeAt(0));
      } else {
        throw Error('Unsupported delete key press behavior!');
      }
    }
    //===========================================================
    // HANDLE ARROW KEY PRESSES
    //===========================================================
    else if (event.key === 'ArrowLeft') {
      // Send 'ESC[D' (go back 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'D'.charCodeAt(0));
    } else if (event.key === 'ArrowRight') {
      // Send 'ESC[C' (go forward 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'C'.charCodeAt(0));
    } else if (event.key === 'ArrowUp') {
      // Send 'ESC[A' (go up 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'A'.charCodeAt(0));
    } else if (event.key === 'ArrowDown') {
      // Send 'ESC[B' (go down 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'B'.charCodeAt(0));
    } else if (event.key === 'Tab') {
      // Send horizontal tab, HT, 0x09
      bytesToWrite.push(0x09);
    } else {
      // If we get here, we don't know what to do with the key press
      console.log('Unsupported char! event=', event);
      return;
    }

    // If we get here, we are either:
    // 1. Sending a break signal
    // 2. Sending data
    // In all other cases, we would have returned by now.
    // It is now safe to enable autoscroll to the bottom
    // if the setting is enabled. If we had done it above it would be buggy,
    // for example the user could be pressing Ctrl-Shift-C to copy text to the clipboard
    // and the autoscroll would suddenly be enabled.
    if (this.settings.displaySettings.autoScrollLockOnTx) {
      // Only the active terminal can produce typed-TX traffic now (no
      // click-focus), so lock its scroll directly.
      this.terminals.activeTerminal.setScrollLock(true);
    }

    if (sendBreakSignal) {
      await this.sendBreakSignal();
    } else {
      await this.writeBytesToSerialPort(Uint8Array.from(bytesToWrite));
    }
  };

  /**
   * Pastes text from the clipboard to the serial port.
   * Called by both Ctrl-Shift-V and smart Ctrl-V.
   */
  handlePasteFromClipboard = async (event: React.KeyboardEvent) => {
    event.preventDefault();
    // Get clipboard text and send it out the serial port. Paste is allowed
    // whenever the terminal pane is shown and the user isn't typing into a
    // form field — the active terminal is the implicit target.
    let text = await navigator.clipboard.readText();

    // Convert CRLF to LF if setting is enabled
    if (this.settings.generalSettings.whenPastingOnWindowsReplaceCRLFWithLF && isRunningOnWindows()) {
      text = text.replace(/\r\n/g, '\n');
    }

    // Make sure serial port is open
    if (this.connController.connState !== ConnState.OPENED) {
      return;
    }

    // Only paste if the terminal pane is the active view and no input field
    // is currently absorbing keys.
    if (this.app.shownMainPane !== MainPanes.TERMINAL || isTypingInField(event)) {
      return;
    }

    // In line mode a paste belongs in the buffer, not straight down the wire.
    // (When the line bar itself has focus this method has already returned via
    // isTypingInField, and the browser's native paste handles it.) Any newlines
    // are kept verbatim, so the pasted block still leaves as a single write.
    if (this.settings.txSettings.txMode === TxMode.LINE) {
      this.txLineController.setPendingLine(this.txLineController.pendingLine + text);
      focusTxLineBar();
      return;
    }

    // Convert string to Uint8Array
    const dataAsUint8Array = new TextEncoder().encode(text);
    await this.writeBytesToSerialPort(dataAsUint8Array);
  };

  /**
   * Copies the selected text to the clipboard. Called for Ctrl-Shift-C, and
   * for smart Ctrl-C when there is a selection.
   */
  handleCopyToClipboard = (event: React.KeyboardEvent) => {
    // Prevents Ctrl-Shift-C from opening the browser's dev tools
    event.preventDefault();
    event.stopPropagation();

    const selection = window.getSelection();
    if (selection === null) {
      return;
    }

    // Work out if the selection is contained within a single terminal pane, and if so,
    // handle the copy in a special manner (no just a basic toString())
    const terminalsToCheck = [this.terminals.txRxTerminal, this.terminals.txTerminal, this.terminals.rxTerminal];
    let terminalSelectionWasIn: SingleTerminal | null = null;
    let selectionInfo: SelectionInfo | null = null;
    for (let i = 0; i < terminalsToCheck.length; i += 1) {
      const terminal = terminalsToCheck[i];
      selectionInfo = terminal.getSelectionInfoIfWithinTerminal();
      if (selectionInfo !== null) {
        // Found a terminal that the selection is contained within, break out of loop
        terminalSelectionWasIn = terminal;
        break;
      }
    }

    // Selection lives in one terminal pane = walk it ourselves; otherwise
    // fall back to a plain `toString()` of the live DOM selection.
    // WARNING: As per spec at https://w3c.github.io/clipboard-apis/#dom-clipboard-writetext,
    //   on Windows we should replace `\n` with `\r\n` before creating a textBlob.
    const clipboardText = selectionInfo !== null
      ? this.extractClipboardTextFromTerminal(selectionInfo, terminalSelectionWasIn!)
      : selection.toString();

    navigator.clipboard.writeText(clipboardText);
    // Create toast telling user that text was copied to clipboard
    this.snackbar.sendToSnackbar(`${clipboardText.length} chars copied to clipboard.`, 'success');
  };

  /** True if any of this session's terminals holds the current DOM selection. */
  hasTerminalSelection = (): boolean => {
    const terminalsToCheck = [this.terminals.txRxTerminal, this.terminals.txTerminal, this.terminals.rxTerminal];
    return terminalsToCheck.some((t) => t.getSelectionInfoIfWithinTerminal() !== null);
  };

  /** Forgets the cached selection on every terminal, so a second Ctrl-C sends 0x03. */
  clearTerminalSelectionCache = () => {
    for (const t of [this.terminals.txRxTerminal, this.terminals.txTerminal, this.terminals.rxTerminal]) {
      t.lastKnownSelectionInfo = null;
    }
  };

  /**
   * Given selection info and the terminal the selection was in, this function walks through the rows
   * contained in the selection and extracts the text suitable for copying to the clipboard.
   *
   * @param selectionInfo Information about the selection, generated by the SelectionController.
   * @param terminalSelectionWasIn The terminal that the selection was wholly contained within.
   * @returns Text extracted from the terminal rows, suitable for copying to the clipboard.
   */
  private extractClipboardTextFromTerminal(selectionInfo: SelectionInfo, terminalSelectionWasIn: SingleTerminal): string {
    // Extract number from end of the row ID
    // row ID is in form <terminal id>-row-<number>
    const firstRowIdNumOnly = parseInt(selectionInfo.firstRowId.split('-').slice(-1)[0]);
    const lastRowIdNumOnly = parseInt(selectionInfo.lastRowId.split('-').slice(-1)[0]);

    // Get the index of these row numbers in the terminal
    const firstRowIndex = terminalSelectionWasIn.terminalRows.findIndex((row) => row.uniqueRowId === firstRowIdNumOnly);
    const lastRowIndex = terminalSelectionWasIn.terminalRows.findIndex((row) => row.uniqueRowId === lastRowIdNumOnly);

    // Iterate from the first to the last row, and extract the text from each row
    let textToCopy = '';
    for (let i = firstRowIndex; i <= lastRowIndex; i += 1) {
      const terminalRow = terminalSelectionWasIn.terminalRows[i];

      // Add a newline character between each successive row, except if:
      //    - The terminal row was created due to wrapping AND setting is enabled.
      //    This means the user can paste the text into
      //    a text editor and it won't have additional new lines added just because the text wrapped in
      //    the terminal. New lines will only be added if the terminal row was created because of
      //    a new line character or an ANSI escape sequence (e.g. cursor down).
      if (i !== firstRowIndex && (terminalRow.wasCreatedDueToWrapping === false || !this.settings.generalSettings.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping)) {
        textToCopy += '\n';
      }

      if (i === firstRowIndex && i === lastRowIndex) {
        // If this is the first and last row, only copy from the start to the end of the selection
        textToCopy += terminalRow.getText().slice(selectionInfo.firstColIdx, selectionInfo.lastColIdx);
      } else if (i === firstRowIndex) {
        // If this is the first row, only copy from the start of the selection
        textToCopy += terminalRow.getText().slice(selectionInfo.firstColIdx);
      } else if (i === lastRowIndex) {
        // If this is the last row, only copy to the end of the selection
        textToCopy += terminalRow.getText().slice(0, selectionInfo.lastColIdx);
      } else {
        // If this is neither the first nor the last row, copy the entire row
        textToCopy += terminalRow.getText();
      }
    }

    return textToCopy;
  }

  /**
   * Opens the Find bar on the terminal that contains the most searchable
   * data: the combined pane in single mode, the RX pane in separate-TX/RX
   * mode. With click-focus removed there's no per-user-action variation to
   * consider — the target is purely a function of pane mode.
   */
  openFindOnPreferredTerminal = () => {
    const isSeparate = this.settings.displaySettings.dataViewConfiguration === DataViewConfiguration.SEPARATE_TX_RX_TERMINALS;
    const target = isSeparate ? this.terminals.rxTerminal : this.terminals.txRxTerminal;
    target.openFind();
  };

  //================================================================================
  // Rate tracking
  //================================================================================

  /**
   * Updates the transmission rates by calculating averages over the time window.
   * Called on a timer by `App`, once per tick for every session.
   */
  updateTransmissionRates = () => {
    const now = Date.now();
    const cutoffTime = now - this.RATE_CALCULATION_WINDOW_MS;

    // Remove old data points
    this.rxDataPoints = this.rxDataPoints.filter((point) => point.timestamp > cutoffTime);
    this.txDataPoints = this.txDataPoints.filter((point) => point.timestamp > cutoffTime);

    // Calculate rates (bytes per second)
    const rxTotalBytes = this.rxDataPoints.reduce((sum, point) => sum + point.bytes, 0);
    const txTotalBytes = this.txDataPoints.reduce((sum, point) => sum + point.bytes, 0);

    const timeWindowInSeconds = this.RATE_CALCULATION_WINDOW_MS / 1000;

    runInAction(() => {
      this.rxRateBps = rxTotalBytes / timeWindowInSeconds;
      this.txRateBps = txTotalBytes / timeWindowInSeconds;
    });
  };

  private recordRxDataPoint(bytes: number) {
    this._recordDataPoint(this.rxDataPoints, bytes);
  }

  private recordTxDataPoint(bytes: number) {
    this._recordDataPoint(this.txDataPoints, bytes);
  }

  /**
   * Appends a data point, trimming the oldest entries once the array has grown
   * past `DATA_POINT_TRIM_AT`. Shared by the RX and TX recorders, which differed
   * only in which array they touched.
   */
  private _recordDataPoint(points: Array<{ timestamp: number; bytes: number }>, bytes: number) {
    points.push({
      timestamp: Date.now(),
      bytes: bytes,
    });
    if (points.length >= this.DATA_POINT_TRIM_AT) {
      points.splice(0, points.length - this.MAX_DATA_POINTS);
    }
  }

  //================================================================================
  // Lifecycle
  //================================================================================

  /**
   * Releases everything this session holds outside the MobX graph: the
   * connection's IPC listeners and timers, macro interval timers, and the
   * connection-state reaction. Called when the session is closed and when the
   * app shuts down.
   */
  cleanup() {
    this.connController.cleanup();
    this.terminals.rightDrawer.macroController.cleanup();
    if (this.connStateReactionDispose) {
      this.connStateReactionDispose();
      this.connStateReactionDispose = null;
    }
  }
}
