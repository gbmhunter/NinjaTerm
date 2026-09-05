import { makeAutoObservable } from "mobx";
import { z } from "zod";

import type { AppDataManager } from "src/model/AppDataManager/AppDataManager";
import type { Session } from "src/model/Session/Session";
import type { RxSettingsData } from "src/model/AppDataManager/DataClasses/RxSettingsData";
import { SettingsBranch } from "../SettingsBranch";

export enum DataType {
  ASCII,
  NUMBER,
}

export enum NewLineCursorBehavior {
  DO_NOTHING,
  NEW_LINE,
  CARRIAGE_RETURN_AND_NEW_LINE,
}

export enum CarriageReturnCursorBehavior {
  DO_NOTHING,
  CARRIAGE_RETURN,
  CARRIAGE_RETURN_AND_NEW_LINE,
}

/**
 * How to handle a received backspace (0x08) or DEL (0x7F) byte.
 */
export enum BackspaceBehavior {
  // Don't treat it specially; the byte is rendered/swallowed like any other
  // non-visible char (per the non-visible char display setting). This was the
  // behavior before backspace handling existed.
  DO_NOTHING,
  // Move the cursor one column left without deleting anything (strict ANSI/VT
  // backspace behavior).
  MOVE_CURSOR_LEFT,
  // Move the cursor one column left and delete the character there
  // (destructive backspace).
  DELETE_CHAR,
}

/**
 * How to handle a received form-feed (FF, 0x0C) byte.
 */
export enum FormFeedBehavior {
  // Don't treat it specially; the byte is rendered/swallowed like any other
  // non-visible char (per the non-visible char display setting). This is the
  // standards-correct default (ECMA-48/VT100 do not clear the screen on FF).
  DO_NOTHING,
  // Erase the visible screen but keep the scrollback buffer (equivalent to the
  // ANSI ESC[2J erase-in-display sequence).
  CLEAR_SCREEN,
  // Erase the visible screen and the scrollback buffer (equivalent to ESC[3J).
  CLEAR_SCREEN_AND_SCROLLBACK,
}

/**
 * The character encoding of received data, i.e. how bytes are turned into the
 * characters shown in the terminal.
 *
 * All of these encodings agree on bytes 0x00-0x7F — below 0x20 is a control
 * character and 0x20-0x7E is printable ASCII — and differ only in what 0x80 and
 * above mean. That is why only the high bytes are actually decoded.
 *
 * This is a separate question from `NonVisibleCharDisplayBehaviors`, which
 * decides how bytes that *aren't* text get displayed.
 */
export enum CharacterEncoding {
  // 7-bit ASCII: bytes 0x80+ are not text. They are rendered or swallowed as
  // non-visible characters per the non-visible char display setting. This is the
  // original NinjaTerm behavior and stays the default, because for a debugging
  // tool seeing the raw byte value is usually more useful than guessing an
  // encoding.
  ASCII,
  // Bytes 0x80+ are UTF-8. Multi-byte sequences are accumulated across chunks.
  // Invalid sequences fall back to hex glyphs so the raw bytes stay visible.
  UTF8,
  // Bytes 0x80+ are code page 437, the original IBM PC / MS-DOS character set.
  // This is what DOS-style text-mode UIs use to draw frames and borders (e.g.
  // byte 0xDA is the top-left corner, 0xC4 the horizontal line).
  CP437,
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

export enum HexCase {
  UPPERCASE,
  LOWERCASE,
}

export enum NewLinePlacementOnHexValue {
  BEFORE,
  AFTER,
}

/**
 * The support ways we can interpret received data as numbers.
 */
export enum NumberType {
  HEX = 'Hex',
  UINT8 = 'uint8',
  INT8 = 'int8',
  UINT16 = 'uint16',
  INT16 = 'int16',
  UINT32 = 'uint32',
  INT32 = 'int32',
  UINT64 = 'uint64',
  INT64 = 'int64',
  FLOAT32 = 'float32',
  FLOAT64 = 'float64',
}

export enum FloatStringConversionMethod {
  TO_STRING = "toString()",
  TO_FIXED = "toFixed()",
}

export enum PaddingCharacter {
  WHITESPACE,
  ZERO,
}

/**
 * The different ways multi-byte numbers can be sent across the serial port.
 */
export enum Endianness {
  LITTLE_ENDIAN = 'Little Endian', // LSB is sent first.
  BIG_ENDIAN = 'Big Endian', // MSB is sent first.
}

/**
 * The different ways to format timestamps that can be added to the start of each line of received data.
 */
export enum TimestampFormat {
  // ISO8601 format with millisecond precision and no timezone (e.g. "2025-06-04T11:18:50.833")
  ISO8601_WITHOUT_TIMEZONE = 'ISO8601',
  // ISO8601 format with millisecond precision and timezone (e.g. "2025-06-04T11:18:50.833+12:00")
  ISO8601_WITH_TIMEZONE = 'ISO8601WithTimezone',
  // e.g. 2025-06-04 11:18:50.833
  LOCAL = 'Local',
  // e.g. 1748991831
  UNIX_SECONDS = 'UnixSeconds',
  // e.g. 1748991831.833
  UNIX_SECONDS_AND_MILLISECONDS = 'UnixSecondsAndMilliseconds',
  // User defined timestamp format
  CUSTOM = 'Custom',
}

export default class RxSettings {

  session: Session;

  /** App-wide data (presets, MCP flags). Reached through the session. */
  get profileManager(): AppDataManager {
    return this.session.app.profileManager;
  }

  /** See `SettingsBranch` for how this class relates to `RxSettingsData`. */
  private readonly branch = new SettingsBranch<RxSettingsData>(
    'settings.rxSettings',
    (config) => config.settings.rxSettings,
  );

  /** How to interpret the received data from the serial port. */
  get dataType() { return this.branch.data.dataType; }
  setDataType = this.branch.setter('dataType');

  //=================================================================
  // ASCII-SPECIFIC SETTINGS
  //=================================================================

  get ansiEscapeCodeParsingEnabled() { return this.branch.data.ansiEscapeCodeParsingEnabled; }
  setAnsiEscapeCodeParsingEnabled = this.branch.setter('ansiEscapeCodeParsingEnabled');

  /**
   * Sequences longer than this are abandoned and emitted as plain data, so this
   * has to comfortably fit the longest sequence we want to handle. The default of
   * 25 (see `RxSettingsData`) covers three-digit CUP coordinates (ESC[100;120H)
   * and true-colour SGR (ESC[38;2;255;255;255m) with room to spare.
   */
  maxEscapeCodeLengthChars = this.branch.applyableNumber('maxEscapeCodeLengthChars', z.coerce.number().min(2));

  /**
   * When enabled, CSI escape sequences that are received but not supported (or
   * are malformed) are rendered inline in the terminal as a highlighted marker
   * rather than being silently discarded. A troubleshooting aid, off by default
   * so normal output is unaffected.
   */
  get showUnknownEscapeCodes() { return this.branch.data.showUnknownEscapeCodes; }
  setShowUnknownEscapeCodes = this.branch.setter('showUnknownEscapeCodes');

  get localTxEcho() { return this.branch.data.localTxEcho; }
  setLocalTxEcho = this.branch.setter('localTxEcho');

  get newLineCursorBehavior() { return this.branch.data.newLineCursorBehavior; }
  setNewLineCursorBehavior = this.branch.setter('newLineCursorBehavior');

  get swallowNewLine() { return this.branch.data.swallowNewLine; }
  setSwallowNewLine = this.branch.setter('swallowNewLine');

  get carriageReturnCursorBehavior() { return this.branch.data.carriageReturnCursorBehavior; }
  setCarriageReturnBehavior = this.branch.setter('carriageReturnCursorBehavior');

  get swallowCarriageReturn() { return this.branch.data.swallowCarriageReturn; }
  setSwallowCarriageReturn = this.branch.setter('swallowCarriageReturn');

  get backspaceBehavior() { return this.branch.data.backspaceBehavior; }
  setBackspaceBehavior = this.branch.setter('backspaceBehavior');

  get formFeedBehavior() { return this.branch.data.formFeedBehavior; }
  setFormFeedBehavior = this.branch.setter('formFeedBehavior');

  get characterEncoding() { return this.branch.data.characterEncoding; }
  setCharacterEncoding = this.branch.setter('characterEncoding');

  get nonVisibleCharDisplayBehavior() { return this.branch.data.nonVisibleCharDisplayBehavior; }
  setNonVisibleCharDisplayBehavior = this.branch.setter('nonVisibleCharDisplayBehavior');

  //=================================================================
  // NUMBER-SPECIFIC SETTINGS
  //=================================================================

  get numberType() { return this.branch.data.numberType; }
  setNumberType = this.branch.setter('numberType');

  get endianness() { return this.branch.data.endianness; }
  setEndianness = this.branch.setter('endianness');

  numberSeparator = this.branch.applyableText('numberSeparator', z.string());

  get preventValuesWrappingAcrossRows() { return this.branch.data.preventValuesWrappingAcrossRows; }
  setPreventHexValuesWrappingAcrossRows = this.branch.setter('preventValuesWrappingAcrossRows');

  get insertNewLineOnMatchedValue() { return this.branch.data.insertNewLineOnMatchedValue; }
  setInsertNewLineOnValue = this.branch.setter('insertNewLineOnMatchedValue');

  newLineMatchValueAsHex = this.branch.applyableText(
    'newLineMatchValueAsHex',
    z.string().regex(/^([0-9A-Fa-f]*)$/, "Must be a valid hex number."),
  );

  get newLinePlacementOnHexValue() { return this.branch.data.newLinePlacementOnHexValue; }
  setNewLinePlacementOnValue = this.branch.setter('newLinePlacementOnHexValue');

  get padValues() { return this.branch.data.padValues; }
  setPadValues = this.branch.setter('padValues');

  get paddingCharacter() { return this.branch.data.paddingCharacter; }
  setPaddingCharacter = this.branch.setter('paddingCharacter');

  /**
   * Set to -1 for automatic padding, which will pad up to the largest possible value
   * for the selected number type.
   */
  numPaddingChars = this.branch.applyableNumber('numPaddingChars', z.coerce.number().min(-1).max(100).int());

  //=================================================================
  // HEX SPECIFIC SETTINGS
  //=================================================================

  numBytesPerHexNumber = this.branch.applyableNumber('numBytesPerHexNumber', z.coerce.number().min(1).max(10).int());

  get hexCase() { return this.branch.data.hexCase; }
  setHexCase = this.branch.setter('hexCase');

  get prefixHexValuesWith0x() { return this.branch.data.prefixHexValuesWith0x; }
  setPrefixHexValuesWith0x = this.branch.setter('prefixHexValuesWith0x');

  //=================================================================
  // FLOAT SPECIFIC SETTINGS
  //=================================================================

  get floatStringConversionMethod() { return this.branch.data.floatStringConversionMethod; }
  setFloatStringConversionMethod = this.branch.setter('floatStringConversionMethod');

  floatNumOfDecimalPlaces = this.branch.applyableNumber('floatNumOfDecimalPlaces', z.coerce.number().min(0).max(100).int());

  //=================================================================
  // TIMESTAMP SETTINGS
  //=================================================================

  get addTimestamps() { return this.branch.data.addTimestamps; }
  setAddTimestamps = this.branch.setter('addTimestamps');

  get timestampFormat() { return this.branch.data.timestampFormat; }
  setTimestampFormat = this.branch.setter('timestampFormat');

  customTimestampFormatString = this.branch.applyableText('customTimestampFormatString', z.string());

  //=================================================================
  // OTHER SETTINGS
  //=================================================================

  get showWarningOnRxBreakSignal() { return this.branch.data.showWarningOnRxBreakSignal; }
  setShowWarningOnRxBreakSignal = this.branch.setter('showWarningOnRxBreakSignal');

  constructor(session: Session) {
    this.session = session;
    this.branch.attach(session);
    makeAutoObservable<RxSettings, 'branch'>(this, { branch: false, session: false }); // Make sure this is at the end of the constructor
  }

  getDataTypeNameForToolbarDisplay = () => {
    return RxSettings.computeDataTypeNameForToolbarDisplay(this.dataType, this.numberType);
  };

  static computeDataTypeNameForToolbarDisplay = (dataType: DataType, numberType: NumberType) => {
    if (dataType === DataType.ASCII) {
      return "ASCII";
    } else {
      return numberType;
    }
  }
}
