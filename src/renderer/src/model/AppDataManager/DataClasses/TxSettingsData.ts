import { BackspaceKeyPressBehavior, DeleteKeyPressBehavior, EnterKeyPressBehavior } from 'src/model/Settings/TxSettings/TxSettings';

export class TxSettingsData {
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
}
