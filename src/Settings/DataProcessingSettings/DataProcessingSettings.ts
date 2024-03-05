// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { ApplyableNumberField } from 'src/Components/ApplyableTextField';

export enum NewLineCursorBehaviors {
  DO_NOTHING,
  NEW_LINE,
  CARRIAGE_RETURN_AND_NEW_LINE,
}

export enum CarriageReturnCursorBehaviors {
  DO_NOTHING,
  CARRIAGE_RETURN,
  CARRIAGE_RETURN_AND_NEW_LINE,
}

/**
 * Enumerates the possible behaviors for displaying non-visible
 * characters in the terminal. Non-visible is any byte from 0x00-0xFF
 * which is not a visible ASCII character.
 */
export enum NonVisibleCharDisplayBehaviors {
  SWALLOW,
  ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS,
  HEX_GLYPHS,
}

export enum BackspaceKeyPressBehavior {
  SEND_BACKSPACE,
  SEND_DELETE,
}

export enum DeleteKeyPressBehaviors {
  SEND_BACKSPACE,
  SEND_DELETE,
  SEND_VT_SEQUENCE,
}

export default class DataProcessingSettings {
  //=================================================================
  // TX SETTINGS
  //=================================================================

  /**
   * What to do when the user presses the backspace key.
   */
  backspaceKeyPressBehavior = BackspaceKeyPressBehavior.SEND_BACKSPACE;

  /**
   * What to do when the user presses the delete key.
   */
  deleteKeyPressBehavior = DeleteKeyPressBehaviors.SEND_VT_SEQUENCE;

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

  //=================================================================
  // RX SETTINGS
  //=================================================================

  ansiEscapeCodeParsingEnabled = true;

  maxEscapeCodeLengthChars = new ApplyableNumberField('10', z.coerce.number().min(2));

  // If true, local TX data will be echoed to RX
  localTxEcho = false;

  newLineCursorBehavior = NewLineCursorBehaviors.CARRIAGE_RETURN_AND_NEW_LINE;

  // If set to true, \n bytes will be swallowed and not displayed
  // on the terminal UI (which is generally what you want)
  swallowNewLine = true;

  // By default set the \n behavior to do new line and carriage return
  // and \r to do nothing. This works for both \n and \r\n line endings
  carriageReturnCursorBehavior = CarriageReturnCursorBehaviors.DO_NOTHING;

  // If set to true, \r bytes will be swallowed and not displayed
  // on the terminal UI (which is generally what you want)
  swallowCarriageReturn = true;

  // I assume most people by default might want to see unexpected invisible chars? If not
  // this might be better defaulting to SWALLOW?
  nonVisibleCharDisplayBehavior = NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS;

  /** If true, when pasting text into a terminal from the clipboard with Ctrl-Shift-V, all
   * CRLF pairs will be replaced with LF. This is generally what we want to do, because LF will
   * be converted to CRLF when copying TO the clipboard when on Windows.
   */
  whenPastingOnWindowsReplaceCRLFWithLF = true;

  whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;

  // Set to true if the visible data has been changed from the applied
  // data by the user AND data is valid (this is used to enable the "Apply" button)
  // isApplyable = false;

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  setBackspaceKeyPressBehavior = (value: BackspaceKeyPressBehavior) => {
    this.backspaceKeyPressBehavior = value;
  };

  setDeleteKeyPressBehavior = (value: DeleteKeyPressBehaviors) => {
    this.deleteKeyPressBehavior = value;
  };

  setSend0x01Thru0x1AWhenCtrlAThruZPressed = (value: boolean) => {
    this.send0x01Thru0x1AWhenCtrlAThruZPressed = value;
  }

  setSendEscCharWhenAltKeyPressed = (value: boolean) => {
    this.sendEscCharWhenAltKeyPressed = value;
  }

  setAnsiEscapeCodeParsingEnabled = (value: boolean) => {
    this.ansiEscapeCodeParsingEnabled = value;
  };

  setLocalTxEcho = (value: boolean) => {
    this.localTxEcho = value;
  };

  setNewLineCursorBehavior = (value: NewLineCursorBehaviors) => {
    this.newLineCursorBehavior = value;
  };

  setSwallowNewLine = (value: boolean) => {
    this.swallowNewLine = value;
  };

  setCarriageReturnBehavior = (value: CarriageReturnCursorBehaviors) => {
    this.carriageReturnCursorBehavior = value;
  };

  setSwallowCarriageReturn = (value: boolean) => {
    this.swallowCarriageReturn = value;
  };

  setNonVisibleCharDisplayBehavior = (value: NonVisibleCharDisplayBehaviors) => {
    this.nonVisibleCharDisplayBehavior = value;
  };

  setWhenPastingOnWindowsReplaceCRLFWithLF = (value: boolean) => {
    this.whenPastingOnWindowsReplaceCRLFWithLF = value;
  };

  setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = (value: boolean) => {
    this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = value;
  };
}
