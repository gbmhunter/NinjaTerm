import { makeAutoObservable } from 'mobx';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import type { TxSettingsData } from 'src/model/AppDataManager/DataClasses/TxSettingsData';
import { SettingsBranch } from '../SettingsBranch';

export enum EnterKeyPressBehavior {
  SEND_LF = 'Send LF',
  SEND_CR = 'Send CR',
  SEND_CRLF = 'Send CRLF',
  SEND_BREAK = 'Send break', // Send the break signal (not a character)
}

export enum TxMode {
  /** Send each keystroke down the wire the moment it is pressed. */
  CHARACTER = 'Character',
  /** Compose a line in the input bar, then send it as a single write on Enter. */
  LINE = 'Line',
}

/**
 * The bytes that terminate a line for a given Enter-key behavior.
 *
 * Shared by character mode (one keystroke at a time) and line mode (the whole
 * line in one write) so the two cannot drift apart.
 *
 * Returns an empty array for SEND_BREAK: a break is a line-condition on the
 * wire rather than a character, so it is sent out-of-band by the caller.
 */
export function enterKeyBytes(behavior: EnterKeyPressBehavior): number[] {
  switch (behavior) {
    case EnterKeyPressBehavior.SEND_LF:
      return [0x0a];
    case EnterKeyPressBehavior.SEND_CR:
      return [0x0d];
    case EnterKeyPressBehavior.SEND_CRLF:
      return [0x0d, 0x0a];
    case EnterKeyPressBehavior.SEND_BREAK:
      return [];
    default:
      throw Error('Unsupported enter key press behavior!');
  }
}

export enum BackspaceKeyPressBehavior {
  SEND_BACKSPACE,
  SEND_DELETE,
}

export enum DeleteKeyPressBehavior {
  SEND_BACKSPACE,
  SEND_DELETE,
  SEND_VT_SEQUENCE,
}

export default class TxSettings {

  profileManager: AppDataManager;

  /** See `SettingsBranch` for how this class relates to `TxSettingsData`. */
  private readonly branch = new SettingsBranch<TxSettingsData>(
    'settings.txSettings',
    (config) => config.settings.txSettings,
  );

  /**
   * Whether keystrokes are sent as they are typed, or buffered into a line
   * that is sent in one go when Enter is pressed.
   *
   * Line mode exists because character mode issues one write (and so, on a
   * socket, one TCP segment) per keystroke. Devices that parse one datagram
   * per command -- SCPI instruments over TCP being the common case -- ignore
   * a command that arrives fragmented across several segments.
   */
  get txMode() { return this.branch.data.txMode; }
  setTxMode = this.branch.setter('txMode');

  get enterKeyPressBehavior() { return this.branch.data.enterKeyPressBehavior; }
  setEnterKeyPressBehavior = this.branch.setter('enterKeyPressBehavior');

  /** What to do when the user presses the backspace key. */
  get backspaceKeyPressBehavior() { return this.branch.data.backspaceKeyPressBehavior; }
  setBackspaceKeyPressBehavior = this.branch.setter('backspaceKeyPressBehavior');

  /** What to do when the user presses the delete key. */
  get deleteKeyPressBehavior() { return this.branch.data.deleteKeyPressBehavior; }
  setDeleteKeyPressBehavior = this.branch.setter('deleteKeyPressBehavior');

  /**
   * If true, hex bytes 0x01-0x1A will be sent when the user
   * presses Ctrl+A thru Ctrl+Z
   */
  get send0x01Thru0x1AWhenCtrlAThruZPressed() { return this.branch.data.send0x01Thru0x1AWhenCtrlAThruZPressed; }
  setSend0x01Thru0x1AWhenCtrlAThruZPressed = this.branch.setter('send0x01Thru0x1AWhenCtrlAThruZPressed');

  /**
   * If true, [ESC] + <char> will be sent when the user presses
   * Alt-<char> (e.g. Alt-A will send the bytes 0x1B 0x41).
   *
   * This emulates standard meta key behavior in most terminals.
   */
  get sendEscCharWhenAltKeyPressed() { return this.branch.data.sendEscCharWhenAltKeyPressed; }
  setSendEscCharWhenAltKeyPressed = this.branch.setter('sendEscCharWhenAltKeyPressed');

  /**
   * If true, Ctrl+C copies selected text to clipboard (like Windows Terminal/iTerm2).
   * If no text is selected, Ctrl+C sends 0x03 as normal. Ctrl+V always pastes from clipboard.
   * If false, Ctrl+C/V always send control codes (0x03/0x16); use Ctrl+Shift+C/V for copy/paste.
   */
  get useCtrlCVForCopyPaste() { return this.branch.data.useCtrlCVForCopyPaste; }
  setUseCtrlCVForCopyPaste = this.branch.setter('useCtrlCVForCopyPaste');

  /**
   * If true (default), Ctrl+F opens the in-pane Find bar. If false, Ctrl+F
   * passes through to the Ctrl+A–Z handler so the ACK control byte (0x06)
   * is sent to the connected device. The on-screen Find magnifier buttons
   * work regardless of this setting.
   */
  get useCtrlFForFind() { return this.branch.data.useCtrlFForFind; }
  setUseCtrlFForFind = this.branch.setter('useCtrlFForFind');

  constructor(profileManager: AppDataManager) {
    this.profileManager = profileManager;
    this.branch.attach(profileManager);
    makeAutoObservable<TxSettings, 'branch'>(this, { branch: false }); // Make sure this is at the end of the constructor
  }
}
