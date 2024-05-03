import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { ApplyableNumberField, ApplyableTextField } from 'src/view/Components/ApplyableTextField';
import AppStorage from 'src/model/Storage/AppStorage';

export enum DataTypes {
  ASCII,
  HEX,
}

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
  // Create new version of this class if you need to update the structure
  version = 1;

  /**
   * How to interpret the received data from the serial port.
   */
  dataType = DataTypes.ASCII;

  // ASCII-SPECIFIC SETTINGS
  ansiEscapeCodeParsingEnabled = true;
  maxEscapeCodeLengthChars = '10';
  localTxEcho = false;
  newLineCursorBehavior = NewLineCursorBehaviors.CARRIAGE_RETURN_AND_NEW_LINE;
  swallowNewLine = true;
  carriageReturnCursorBehavior = CarriageReturnCursorBehaviors.DO_NOTHING;
  swallowCarriageReturn = true;
  nonVisibleCharDisplayBehavior = NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS;

  // HEX-SPECIFIC SETTINGS
  hexSeparator = ' ';

  // COPY/PASTE SETTINGS
  whenPastingOnWindowsReplaceCRLFWithLF = true;
  whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;
}

export default class RxSettings {

  appStorage: AppStorage;

  dataType = DataTypes.ASCII;

  //=================================================================
  // ASCII-SPECIFIC SETTINGS
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

  //=================================================================
  // HEX-SPECIFIC SETTINGS
  //=================================================================

  hexSeparator = new ApplyableTextField(' ', z.string());

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
    let config = this.appStorage.getConfig(['settings', 'rx-settings']);

    // UPGRADE PATH
    //===============================================

    if (config === null) {
      // No data exists, create
      config = new DataV1();
      this.appStorage.saveConfig(['settings', 'rx-settings'], config);
    } else if (config.version === 1) {
      console.log('Up-to-date config found');
    } else{
      console.error('Unknown config version found: ', config.version);
      config = new DataV1();
      this.appStorage.saveConfig(['settings', 'rx-settings'], config);
    }

    // At this point we a confident that config represents the latest version, so
    // we can go ahead and update all the app settings with the values from the config object
    let uptodateConfig = config as DataV1;

    // ASCII-SPECIFIC SETTINGS
    this.ansiEscapeCodeParsingEnabled = uptodateConfig.ansiEscapeCodeParsingEnabled;
    this.maxEscapeCodeLengthChars.setDispValue(uptodateConfig.maxEscapeCodeLengthChars);
    this.localTxEcho = uptodateConfig.localTxEcho;
    this.newLineCursorBehavior = uptodateConfig.newLineCursorBehavior;
    this.swallowNewLine = uptodateConfig.swallowNewLine;
    this.carriageReturnCursorBehavior = uptodateConfig.carriageReturnCursorBehavior;
    this.swallowCarriageReturn = uptodateConfig.swallowCarriageReturn;
    this.nonVisibleCharDisplayBehavior = uptodateConfig.nonVisibleCharDisplayBehavior;
    this.whenPastingOnWindowsReplaceCRLFWithLF = uptodateConfig.whenPastingOnWindowsReplaceCRLFWithLF;
    this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = uptodateConfig.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping;

    // HEX-SPECIFIC SETTINGS
    this.hexSeparator.setDispValue(uptodateConfig.hexSeparator);
  }

  saveSettings = () => {
    const config = new DataV1();

    // ASCII-SPECIFIC SETTINGS
    config.ansiEscapeCodeParsingEnabled = this.ansiEscapeCodeParsingEnabled;
    config.maxEscapeCodeLengthChars = this.maxEscapeCodeLengthChars.dispValue
    config.localTxEcho = this.localTxEcho;
    config.newLineCursorBehavior = this.newLineCursorBehavior;
    config.swallowNewLine = this.swallowNewLine;
    config.carriageReturnCursorBehavior = this.carriageReturnCursorBehavior;
    config.swallowCarriageReturn = this.swallowCarriageReturn;
    config.nonVisibleCharDisplayBehavior = this.nonVisibleCharDisplayBehavior;

    // HEX-SPECIFIC SETTINGS
    config.hexSeparator = this.hexSeparator.dispValue;

    // COPY/PASTE
    config.whenPastingOnWindowsReplaceCRLFWithLF = this.whenPastingOnWindowsReplaceCRLFWithLF;
    config.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping;

    this.appStorage.saveConfig(['settings', 'data-processing'], config);
  };

  setDataType = (value: DataTypes) => {
    this.dataType = value;
    this.saveSettings();
  };

  //=================================================================
  // ASCII-SPECIFIC SETTINGS
  //=================================================================

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

  //=================================================================
  // HEX-SPECIFIC SETTINGS
  //=================================================================

  setHexSeparator = (value: string) => {
    this.hexSeparator.setDispValue(value);
    this.saveSettings();
  };
}
