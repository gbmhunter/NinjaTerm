import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { ApplyableNumberField } from 'src/view/Components/ApplyableTextField';
import AppStorage from 'src/model/Storage/AppStorage';

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

class DataV1 {
  // METADATA
  version = 1;

  backspaceKeyPressBehavior = BackspaceKeyPressBehavior.SEND_BACKSPACE;
  deleteKeyPressBehavior = DeleteKeyPressBehaviors.SEND_VT_SEQUENCE;
  send0x01Thru0x1AWhenCtrlAThruZPressed = true;
  sendEscCharWhenAltKeyPressed = true;

  ansiEscapeCodeParsingEnabled = true;
  maxEscapeCodeLengthChars = '10';
  localTxEcho = false;
  newLineCursorBehavior = NewLineCursorBehaviors.CARRIAGE_RETURN_AND_NEW_LINE;
  swallowNewLine = true;
  carriageReturnCursorBehavior = CarriageReturnCursorBehaviors.DO_NOTHING;
  swallowCarriageReturn = true;
  nonVisibleCharDisplayBehavior = NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS;

  // COPY/PASTE SETTINGS
  whenPastingOnWindowsReplaceCRLFWithLF = true;
  whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;
}

export default class DataProcessingSettings {

  appStorage: AppStorage;

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

  constructor(appStorage: AppStorage) {
    this.appStorage = appStorage;
    makeAutoObservable(this); // Make sure this is at the end of the constructor
    this.loadSettings();
  }

  loadSettings = () => {
    let config = this.appStorage.getConfig(['settings', 'data-processing']);
    console.log('config: ', config);

    // UPGRADE PATH
    //===============================================

    if (config === null) {
      config = new DataV1();
      this.appStorage.saveConfig(['settings', 'data-processing'], config);
    } else if (config.version === 1) {
      console.log('Up-to-date config found');

      let configAsDataV1 = config as DataV1;
      this.backspaceKeyPressBehavior = configAsDataV1.backspaceKeyPressBehavior;
      this.deleteKeyPressBehavior = configAsDataV1.deleteKeyPressBehavior;
      this.send0x01Thru0x1AWhenCtrlAThruZPressed = configAsDataV1.send0x01Thru0x1AWhenCtrlAThruZPressed;

      this.ansiEscapeCodeParsingEnabled = configAsDataV1.ansiEscapeCodeParsingEnabled;
      this.maxEscapeCodeLengthChars.setDispValue(configAsDataV1.maxEscapeCodeLengthChars);
      this.localTxEcho = configAsDataV1.localTxEcho;
      this.newLineCursorBehavior = configAsDataV1.newLineCursorBehavior;
      this.swallowNewLine = configAsDataV1.swallowNewLine;
      this.carriageReturnCursorBehavior = configAsDataV1.carriageReturnCursorBehavior;
      this.swallowCarriageReturn = configAsDataV1.swallowCarriageReturn;
      this.nonVisibleCharDisplayBehavior = configAsDataV1.nonVisibleCharDisplayBehavior;
      this.whenPastingOnWindowsReplaceCRLFWithLF = configAsDataV1.whenPastingOnWindowsReplaceCRLFWithLF;
      this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = configAsDataV1.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping;
    } else{
      console.error('Unknown config version found: ', config.version);
    }
  }

  saveSettings = () => {
    const config = new DataV1();

    // TX SETTINGS
    config.backspaceKeyPressBehavior = this.backspaceKeyPressBehavior;
    config.deleteKeyPressBehavior = this.deleteKeyPressBehavior;
    config.send0x01Thru0x1AWhenCtrlAThruZPressed = this.send0x01Thru0x1AWhenCtrlAThruZPressed;
    config.sendEscCharWhenAltKeyPressed = this.sendEscCharWhenAltKeyPressed;

    config.ansiEscapeCodeParsingEnabled = this.ansiEscapeCodeParsingEnabled;
    config.maxEscapeCodeLengthChars = this.maxEscapeCodeLengthChars.dispValue
    config.localTxEcho = this.localTxEcho;
    config.newLineCursorBehavior = this.newLineCursorBehavior;
    config.swallowNewLine = this.swallowNewLine;
    config.carriageReturnCursorBehavior = this.carriageReturnCursorBehavior;
    config.swallowCarriageReturn = this.swallowCarriageReturn;
    config.nonVisibleCharDisplayBehavior = this.nonVisibleCharDisplayBehavior;

    // COPY/PASTE
    config.whenPastingOnWindowsReplaceCRLFWithLF = this.whenPastingOnWindowsReplaceCRLFWithLF;
    config.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping;

    this.appStorage.saveConfig(['settings', 'data-processing'], config);
  };

  setBackspaceKeyPressBehavior = (value: BackspaceKeyPressBehavior) => {
    this.backspaceKeyPressBehavior = value;
    this.saveSettings();
  };

  setDeleteKeyPressBehavior = (value: DeleteKeyPressBehaviors) => {
    this.deleteKeyPressBehavior = value;
    this.saveSettings();
  };

  setSend0x01Thru0x1AWhenCtrlAThruZPressed = (value: boolean) => {
    this.send0x01Thru0x1AWhenCtrlAThruZPressed = value;
    this.saveSettings();
  }

  setSendEscCharWhenAltKeyPressed = (value: boolean) => {
    this.sendEscCharWhenAltKeyPressed = value;
    this.saveSettings();
  }

  setAnsiEscapeCodeParsingEnabled = (value: boolean) => {
    this.ansiEscapeCodeParsingEnabled = value;
    this.saveSettings();
  };

  setLocalTxEcho = (value: boolean) => {
    this.localTxEcho = value;
    this.saveSettings();
  };

  setNewLineCursorBehavior = (value: NewLineCursorBehaviors) => {
    this.newLineCursorBehavior = value;
    this.saveSettings();
  };

  setSwallowNewLine = (value: boolean) => {
    this.swallowNewLine = value;
    this.saveSettings();
  };

  setCarriageReturnBehavior = (value: CarriageReturnCursorBehaviors) => {
    this.carriageReturnCursorBehavior = value;
    this.saveSettings();
  };

  setSwallowCarriageReturn = (value: boolean) => {
    this.swallowCarriageReturn = value;
    this.saveSettings();
  };

  setNonVisibleCharDisplayBehavior = (value: NonVisibleCharDisplayBehaviors) => {
    this.nonVisibleCharDisplayBehavior = value;
    this.saveSettings();
  };

  setWhenPastingOnWindowsReplaceCRLFWithLF = (value: boolean) => {
    this.whenPastingOnWindowsReplaceCRLFWithLF = value;
    this.saveSettings();
  };

  setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = (value: boolean) => {
    this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = value;
    this.saveSettings();
  };
}
