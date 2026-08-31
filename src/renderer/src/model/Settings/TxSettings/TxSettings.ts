import { makeAutoObservable } from 'mobx';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';

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

  /**
   * Whether keystrokes are sent as they are typed, or buffered into a line
   * that is sent in one go when Enter is pressed.
   *
   * Line mode exists because character mode issues one write (and so, on a
   * socket, one TCP segment) per keystroke. Devices that parse one datagram
   * per command -- SCPI instruments over TCP being the common case -- ignore
   * a command that arrives fragmented across several segments.
   */
  txMode = TxMode.CHARACTER;

  enterKeyPressBehavior = EnterKeyPressBehavior.SEND_LF;

  /**
   * What to do when the user presses the backspace key.
   */
  backspaceKeyPressBehavior = BackspaceKeyPressBehavior.SEND_BACKSPACE;

  /**
   * What to do when the user presses the delete key.
   */
  deleteKeyPressBehavior = DeleteKeyPressBehavior.SEND_VT_SEQUENCE;

  /**
   * If true, hex bytes 0x01-0x1A will be sent when the user
   * presses Ctrl+A thru Ctrl+Z
   */
  send0x01Thru0x1AWhenCtrlAThruZPressed = true;

  /**
   * If true, [ESC] + <char> will be sent when the user presses
   * Alt-<char> (e.g. Alt-A will send the bytes 0x1B 0x41).
   *
   * This emulates standard meta key behavior in most terminals.
   */
  sendEscCharWhenAltKeyPressed = true;

  /**
   * If true, Ctrl+C copies selected text to clipboard (like Windows Terminal/iTerm2).
   * If no text is selected, Ctrl+C sends 0x03 as normal. Ctrl+V always pastes from clipboard.
   * If false, Ctrl+C/V always send control codes (0x03/0x16); use Ctrl+Shift+C/V for copy/paste.
   */
  useCtrlCVForCopyPaste = true;

  /**
   * If true (default), Ctrl+F opens the in-pane Find bar. If false, Ctrl+F
   * passes through to the Ctrl+A–Z handler so the ACK control byte (0x06)
   * is sent to the connected device. The on-screen Find magnifier buttons
   * work regardless of this setting.
   */
  useCtrlFForFind = true;

  constructor(profileManager: AppDataManager) {
    this.profileManager = profileManager;
    this._loadConfig();
    this.profileManager.registerOnConfigReload(['settings.txSettings'], () => {
      this._loadConfig();
    });
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  _loadConfig = () => {
    const configToLoad = this.profileManager.appData.currentAppConfig.settings.txSettings;

    this.txMode = configToLoad.txMode;
    this.enterKeyPressBehavior = configToLoad.enterKeyPressBehavior;
    this.backspaceKeyPressBehavior = configToLoad.backspaceKeyPressBehavior;
    this.deleteKeyPressBehavior = configToLoad.deleteKeyPressBehavior;
    this.send0x01Thru0x1AWhenCtrlAThruZPressed = configToLoad.send0x01Thru0x1AWhenCtrlAThruZPressed;
    this.sendEscCharWhenAltKeyPressed = configToLoad.sendEscCharWhenAltKeyPressed;
    this.useCtrlCVForCopyPaste = configToLoad.useCtrlCVForCopyPaste;
    this.useCtrlFForFind = configToLoad.useCtrlFForFind;
  };

  _saveConfig = () => {
    const config = this.profileManager.appData.currentAppConfig.settings.txSettings;

    config.txMode = this.txMode;
    config.enterKeyPressBehavior = this.enterKeyPressBehavior;
    config.backspaceKeyPressBehavior = this.backspaceKeyPressBehavior;
    config.deleteKeyPressBehavior = this.deleteKeyPressBehavior;
    config.send0x01Thru0x1AWhenCtrlAThruZPressed = this.send0x01Thru0x1AWhenCtrlAThruZPressed;
    config.sendEscCharWhenAltKeyPressed = this.sendEscCharWhenAltKeyPressed;
    config.useCtrlCVForCopyPaste = this.useCtrlCVForCopyPaste;
    config.useCtrlFForFind = this.useCtrlFForFind;

    this.profileManager.saveAppData();
  };

  setTxMode = (value: TxMode) => {
    this.txMode = value;
    this._saveConfig();
  };

  setEnterKeyPressBehavior = (value: EnterKeyPressBehavior) => {
    this.enterKeyPressBehavior = value;
    this._saveConfig();
  };

  setBackspaceKeyPressBehavior = (value: BackspaceKeyPressBehavior) => {
    this.backspaceKeyPressBehavior = value;
    this._saveConfig();
  };

  setDeleteKeyPressBehavior = (value: DeleteKeyPressBehavior) => {
    this.deleteKeyPressBehavior = value;
    this._saveConfig();
  };

  setSend0x01Thru0x1AWhenCtrlAThruZPressed = (value: boolean) => {
    this.send0x01Thru0x1AWhenCtrlAThruZPressed = value;
    this._saveConfig();
  }

  setSendEscCharWhenAltKeyPressed = (value: boolean) => {
    this.sendEscCharWhenAltKeyPressed = value;
    this._saveConfig();
  }

  setUseCtrlCVForCopyPaste = (value: boolean) => {
    this.useCtrlCVForCopyPaste = value;
    this._saveConfig();
  }

  setUseCtrlFForFind = (value: boolean) => {
    this.useCtrlFForFind = value;
    this._saveConfig();
  }
}
