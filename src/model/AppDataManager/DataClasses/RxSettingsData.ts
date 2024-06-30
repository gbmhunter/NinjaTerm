import { CarriageReturnCursorBehavior, DataType, Endianness, FloatStringConversionMethod, HexCase, NewLineCursorBehavior, NewLinePlacementOnHexValue, NonVisibleCharDisplayBehaviors, NumberType, PaddingCharacter } from "src/model/Settings/RxSettings/RxSettings";

export class RxSettingsDataV1 {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 1;

  /**
   * How to interpret the received data from the serial port.
   */
  dataType = DataType.ASCII;

  // ASCII-SPECIFIC SETTINGS
  ansiEscapeCodeParsingEnabled = true;
  maxEscapeCodeLengthChars = 10;
  localTxEcho = false;
  newLineCursorBehavior = NewLineCursorBehavior.CARRIAGE_RETURN_AND_NEW_LINE;
  swallowNewLine = true;
  carriageReturnCursorBehavior = CarriageReturnCursorBehavior.DO_NOTHING;
  swallowCarriageReturn = true;
  nonVisibleCharDisplayBehavior = NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS;

  // NUMBER-SPECIFIC SETTINGS
  numberType = NumberType.HEX;
  endianness = Endianness.LITTLE_ENDIAN;
  numberSeparator = " ";
  preventValuesWrappingAcrossRows = true;
  insertNewLineOnMatchedValue = false;
  newLineMatchValueAsHex = "00";
  newLinePlacementOnHexValue = NewLinePlacementOnHexValue.BEFORE;
  padValues = true;
  paddingCharacter = PaddingCharacter.ZERO;

  /**
   * Set to -1 for automatic padding, which will pad up to the largest possible value
   * for the selected number type.
   */
  numPaddingChars = -1;

  // HEX SPECIFIC SETTINGS
  numBytesPerHexNumber = 1;
  hexCase = HexCase.UPPERCASE;
  prefixHexValuesWith0x = false;

  // FLOAT SPECIFIC SETTINGS
  floatStringConversionMethod = FloatStringConversionMethod.TO_STRING;
  floatNumOfDecimalPlaces = 5;

  // OTHER SETTINGS
  showWarningOnRxBreakSignal = true;
}
