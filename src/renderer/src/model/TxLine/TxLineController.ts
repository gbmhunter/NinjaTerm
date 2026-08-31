import { makeAutoObservable, runInAction } from 'mobx';

import { EnterKeyPressBehavior, enterKeyBytes } from 'src/model/Settings/TxSettings/TxSettings';
import { stringToUint8Array } from 'src/model/Util/Util';

/** DOM id of the line bar's <input>, shared by the view and the focus helpers. */
export const TX_LINE_BAR_INPUT_ID = 'tx-line-bar-input';

/** Moves focus to the line bar's input, if it is mounted. */
export function focusTxLineBar(): void {
  const input = document.getElementById(TX_LINE_BAR_INPUT_ID) as HTMLInputElement | null;
  input?.focus();
}

/**
 * Parks focus back on `#outer-border` so keystrokes keep reaching
 * `App.handleKeyDown`. Without this, unmounting the line bar drops focus to
 * `document.body` -- outside `#outer-border` -- and the terminal stops
 * receiving keys until the user clicks somewhere in the app. Same trick as
 * `FindBar.closeAndRestoreFocus`.
 */
export function focusOuterBorder(): void {
  const outerBorder = document.getElementById('outer-border') as HTMLElement | null;
  outerBorder?.focus();
}

/** How many previously-sent lines to keep for Up/Down recall. */
export const MAX_HISTORY_ENTRIES = 100;

/**
 * Holds the line the user is composing while TX line mode is active.
 *
 * The point of line mode is that the whole line leaves in a *single* write.
 * Character mode issues one write -- and so, on a socket, one TCP segment --
 * per keystroke, which devices that parse one datagram per command (SCPI
 * instruments over TCP being the common case) silently drop. See issue #410.
 *
 * The text itself lives here as a plain string and the view renders it into a
 * real <input>, so the caret, selection, Home/End and clipboard behaviour all
 * come from the browser rather than being reimplemented against the terminal
 * grid.
 */
export default class TxLineController {
  /** The text currently being composed. */
  pendingLine = '';

  /** Previously sent lines, most recent last. */
  history: string[] = [];

  /**
   * Where we are while walking `history` with Up/Down.
   * `history.length` means "not walking, showing the live pendingLine".
   */
  historyIndex = 0;

  /**
   * What `pendingLine` was when the user started walking history, so that
   * pressing Down past the newest entry restores what they had typed rather
   * than blanking it.
   */
  private _stashedLine = '';

  constructor() {
    makeAutoObservable(this);
  }

  setPendingLine = (value: string) => {
    this.pendingLine = value;
    // Typing abandons the history walk; the text is now the user's own again.
    this.historyIndex = this.history.length;
  };

  clear = () => {
    this.pendingLine = '';
    this.historyIndex = this.history.length;
  };

  /**
   * Builds the bytes for the current line: the text, then the line terminator
   * implied by the Enter-key setting.
   *
   * Uses the same `stringToUint8Array` encoder as macros, so line mode and a
   * macro holding the same text produce byte-identical output.
   */
  buildBytes = (enterKeyPressBehavior: EnterKeyPressBehavior): Uint8Array => {
    const textBytes = stringToUint8Array(this.pendingLine);
    const terminator = enterKeyBytes(enterKeyPressBehavior);
    const bytes = new Uint8Array(textBytes.length + terminator.length);
    bytes.set(textBytes, 0);
    bytes.set(terminator, textBytes.length);
    return bytes;
  };

  /**
   * Records the just-sent line in the history and clears the input.
   * Consecutive duplicates are collapsed -- re-sending the same query over and
   * over is the normal workflow here, and it shouldn't fill the history.
   */
  commitToHistory = () => {
    runInAction(() => {
      const line = this.pendingLine;
      if (line.length > 0 && this.history[this.history.length - 1] !== line) {
        this.history.push(line);
        if (this.history.length > MAX_HISTORY_ENTRIES) {
          this.history.shift();
        }
      }
      this.pendingLine = '';
      this.historyIndex = this.history.length;
      this._stashedLine = '';
    });
  };

  /** Step back through history (Up arrow). No-op at the oldest entry. */
  historyPrev = () => {
    if (this.history.length === 0 || this.historyIndex === 0) {
      return;
    }
    if (this.historyIndex === this.history.length) {
      // Starting a walk -- remember what was typed so Down can restore it.
      this._stashedLine = this.pendingLine;
    }
    this.historyIndex -= 1;
    this.pendingLine = this.history[this.historyIndex];
  };

  /**
   * Step forward through history (Down arrow). Stepping past the newest entry
   * restores whatever the user had typed before they started walking.
   */
  historyNext = () => {
    if (this.historyIndex >= this.history.length) {
      return;
    }
    this.historyIndex += 1;
    if (this.historyIndex === this.history.length) {
      this.pendingLine = this._stashedLine;
    } else {
      this.pendingLine = this.history[this.historyIndex];
    }
  };
}
