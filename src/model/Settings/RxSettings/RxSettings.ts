import { makeAutoObservable } from "mobx";
import { z } from "zod";

import { ApplyableNumberField, ApplyableTextField } from "src/view/Components/ApplyableTextField";
import { AppDataManager } from "src/model/AppDataManager/AppDataManager";

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

export class RxSettingsConfig {
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

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }
}

const CONFIG_KEY = ['settings', 'rx-settings'];

export default class RxSettings {

  profileManager: AppDataManager;

  /**
   * How to interpret the received data from the serial port.
   */
  dataType = DataType.ASCII;

  // ASCII-SPECIFIC SETTINGS
  ansiEscapeCodeParsingEnabled = true;
  maxEscapeCodeLengthChars = new ApplyableNumberField("10", z.coerce.number().min(2));
  localTxEcho = false;
  newLineCursorBehavior = NewLineCursorBehavior.CARRIAGE_RETURN_AND_NEW_LINE;
  swallowNewLine = true;
  carriageReturnCursorBehavior = CarriageReturnCursorBehavior.DO_NOTHING;
  swallowCarriageReturn = true;
  nonVisibleCharDisplayBehavior = NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS;

  // NUMBER-SPECIFIC SETTINGS
  numberType = NumberType.HEX;
  endianness = Endianness.LITTLE_ENDIAN;
  numberSeparator = new ApplyableTextField(" ", z.string());
  preventValuesWrappingAcrossRows = true;
  insertNewLineOnMatchedValue = false;
  newLineMatchValueAsHex = new ApplyableTextField(
    "00",
    z
    .string()
    .regex(/^([0-9A-Fa-f]*)$/, "Must be a valid hex number.")
  );
  newLinePlacementOnHexValue = NewLinePlacementOnHexValue.BEFORE;
  padValues = true;
  paddingCharacter = PaddingCharacter.ZERO;

  /**
   * Set to -1 for automatic padding, which will pad up to the largest possible value
   * for the selected number type.
   */
  numPaddingChars = new ApplyableNumberField('-1', z.coerce.number().min(-1).max(100).int());

  // HEX SPECIFIC SETTINGS
  numBytesPerHexNumber = new ApplyableNumberField('1', z.coerce.number().min(1).max(10).int());
  hexCase = HexCase.UPPERCASE;
  prefixHexValuesWith0x = false;

  // FLOAT SPECIFIC SETTINGS
  floatStringConversionMethod = FloatStringConversionMethod.TO_STRING;
  floatNumOfDecimalPlaces = new ApplyableNumberField("5", z.coerce.number().min(0).max(100).int());

  // OTHER SETTINGS
  showWarningOnRxBreakSignal = true;


  constructor(profileManager: AppDataManager) {
    this.profileManager = profileManager;
    this._loadConfig();
    this.profileManager.registerOnProfileLoad(() => {
      this._loadConfig();
    });
    this.maxEscapeCodeLengthChars.setOnApplyChanged(() => {
      this._saveConfig();
    });
    this.numberSeparator.setOnApplyChanged(() => {
      this._saveConfig();
    });
    this.newLineMatchValueAsHex.setOnApplyChanged(() => {
      this._saveConfig();
    });
    this.numPaddingChars.setOnApplyChanged(() => {
      this._saveConfig();
    });
    this.floatNumOfDecimalPlaces.setOnApplyChanged(() => {
      this._saveConfig();
    });
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  _loadConfig = () => {
    let configToLoad = this.profileManager.appData.currentAppConfig.settings.rxSettings
    //===============================================
    // UPGRADE PATH
    //===============================================
    const latestVersion = new RxSettingsConfig().version;
    if (configToLoad.version === latestVersion) {
      // Do nothing
    } else {
      console.log(`Out-of-date config version ${configToLoad.version} found.` +
                    ` Updating to version ${latestVersion}.`);
      this._saveConfig();
      configToLoad = this.profileManager.appData.currentAppConfig.settings.rxSettings
    }

    /**
     * How to interpret the received data from the serial port.
     */
    this.dataType = configToLoad.dataType;

    // ASCII-SPECIFIC SETTINGS
    this.ansiEscapeCodeParsingEnabled = configToLoad.ansiEscapeCodeParsingEnabled;
    this.maxEscapeCodeLengthChars.setDispValue(configToLoad.maxEscapeCodeLengthChars.toString());
    this.maxEscapeCodeLengthChars.apply();
    this.localTxEcho = configToLoad.localTxEcho;
    this.newLineCursorBehavior = configToLoad.newLineCursorBehavior;
    this.swallowNewLine = configToLoad.swallowNewLine;
    this.carriageReturnCursorBehavior = configToLoad.carriageReturnCursorBehavior;
    this.swallowCarriageReturn = configToLoad.swallowCarriageReturn;
    this.nonVisibleCharDisplayBehavior = configToLoad.nonVisibleCharDisplayBehavior;

    // NUMBER-SPECIFIC SETTINGS
    this.numberType = configToLoad.numberType;
    this.endianness = configToLoad.endianness;
    this.numberSeparator.setDispValue(configToLoad.numberSeparator);
    this.numberSeparator.apply();
    this.preventValuesWrappingAcrossRows = configToLoad.preventValuesWrappingAcrossRows;
    this.insertNewLineOnMatchedValue = configToLoad.insertNewLineOnMatchedValue;
    this.newLineMatchValueAsHex.setDispValue(configToLoad.newLineMatchValueAsHex);
    this.newLineMatchValueAsHex.apply();
    this.newLinePlacementOnHexValue = configToLoad.newLinePlacementOnHexValue;
    this.padValues = configToLoad.padValues;
    this.paddingCharacter = configToLoad.paddingCharacter;

    /**
     * Set to -1 for automatic padding, which will pad up to the largest possible value
     * for the selected number type.
     */
    this.numPaddingChars.setDispValue(configToLoad.numPaddingChars.toString());
    this.numPaddingChars.apply();

    // HEX SPECIFIC SETTINGS
    this.numBytesPerHexNumber.setDispValue(configToLoad.numBytesPerHexNumber.toString());
    this.numBytesPerHexNumber.apply();
    this.hexCase = configToLoad.hexCase;
    this.prefixHexValuesWith0x = configToLoad.prefixHexValuesWith0x;

    // FLOAT SPECIFIC SETTINGS
    this.floatStringConversionMethod = configToLoad.floatStringConversionMethod;
    this.floatNumOfDecimalPlaces.setDispValue(configToLoad.floatNumOfDecimalPlaces.toString());
    this.floatNumOfDecimalPlaces.apply();

    // OTHER SETTINGS
    this.showWarningOnRxBreakSignal = configToLoad.showWarningOnRxBreakSignal;
  };

  _saveConfig = () => {
    let config = this.profileManager.appData.currentAppConfig.settings.rxSettings;
    config.dataType = this.dataType;

    // ASCII-SPECIFIC SETTINGS
    config.ansiEscapeCodeParsingEnabled = this.ansiEscapeCodeParsingEnabled;
    config.maxEscapeCodeLengthChars = this.maxEscapeCodeLengthChars.appliedValue;
    config.localTxEcho = this.localTxEcho;
    config.newLineCursorBehavior = this.newLineCursorBehavior;
    config.swallowNewLine = this.swallowNewLine;
    config.carriageReturnCursorBehavior = this.carriageReturnCursorBehavior;
    config.swallowCarriageReturn = this.swallowCarriageReturn;
    config.nonVisibleCharDisplayBehavior = this.nonVisibleCharDisplayBehavior;

    // NUMBER-SPECIFIC SETTINGS
    config.numberType = this.numberType;
    config.endianness = this.endianness;
    config.numberSeparator = this.numberSeparator.appliedValue;
    config.preventValuesWrappingAcrossRows = this.preventValuesWrappingAcrossRows;
    config.insertNewLineOnMatchedValue = this.insertNewLineOnMatchedValue;
    config.newLineMatchValueAsHex = this.newLineMatchValueAsHex.appliedValue;
    config.newLinePlacementOnHexValue = this.newLinePlacementOnHexValue;
    config.padValues = this.padValues;
    config.paddingCharacter = this.paddingCharacter;
    config.numPaddingChars = this.numPaddingChars.appliedValue;

    // HEX SPECIFIC SETTINGS
    config.numBytesPerHexNumber = this.numBytesPerHexNumber.appliedValue;
    config.hexCase = this.hexCase;
    config.prefixHexValuesWith0x = this.prefixHexValuesWith0x;

    // FLOAT SPECIFIC SETTINGS
    config.floatStringConversionMethod = this.floatStringConversionMethod;
    config.floatNumOfDecimalPlaces = this.floatNumOfDecimalPlaces.appliedValue;

    // OTHER SETTINGS
    config.showWarningOnRxBreakSignal = this.showWarningOnRxBreakSignal;

    this.profileManager.saveAppData();
  };

  setDataType = (value: DataType) => {
    this.dataType = value;
    this._saveConfig();
  };

  //=================================================================
  // ASCII-SPECIFIC SETTINGS
  //=================================================================

  setAnsiEscapeCodeParsingEnabled = (value: boolean) => {
    this.ansiEscapeCodeParsingEnabled = value;
    this._saveConfig();
  };

  setLocalTxEcho = (value: boolean) => {
    this.localTxEcho = value;
    this._saveConfig();
  };

  setNewLineCursorBehavior = (value: NewLineCursorBehavior) => {
    this.newLineCursorBehavior = value;
    this._saveConfig();
  };

  setSwallowNewLine = (value: boolean) => {
    this.swallowNewLine = value;
    this._saveConfig();
  };

  setCarriageReturnBehavior = (value: CarriageReturnCursorBehavior) => {
    this.carriageReturnCursorBehavior = value;
    this._saveConfig();
  };

  setSwallowCarriageReturn = (value: boolean) => {
    this.swallowCarriageReturn = value;
    this._saveConfig();
  };

  setNonVisibleCharDisplayBehavior = (value: NonVisibleCharDisplayBehaviors) => {
    this.nonVisibleCharDisplayBehavior = value;
    this._saveConfig();
  };

  //=================================================================
  // NUMBER-SPECIFIC SETTINGS
  //=================================================================

  setNumberType = (value: NumberType) => {
    this.numberType = value;
    this._saveConfig();
  }

  setEndianness = (value: Endianness) => {
    this.endianness = value;
    this._saveConfig();
  };

  setPreventHexValuesWrappingAcrossRows = (value: boolean) => {
    this.preventValuesWrappingAcrossRows = value;
    this._saveConfig();
  };

  setInsertNewLineOnValue = (value: boolean) => {
    this.insertNewLineOnMatchedValue = value;
    this._saveConfig();
  };

  setNewLinePlacementOnValue = (value: NewLinePlacementOnHexValue) => {
    this.newLinePlacementOnHexValue = value;
    this._saveConfig();
  };

  setPadValues = (value: boolean) => {
    this.padValues = value;
    this._saveConfig();
  }

  setPaddingCharacter = (value: PaddingCharacter) => {
    this.paddingCharacter = value;
    this._saveConfig();
  }

  //=================================================================
  // HEX SPECIFIC SETTINGS
  //=================================================================

  setHexCase = (value: HexCase) => {
    this.hexCase = value;
    this._saveConfig();
  };

  setPrefixHexValuesWith0x = (value: boolean) => {
    this.prefixHexValuesWith0x = value;
    this._saveConfig();
  };

  //=================================================================
  // FLOAT SPECIFIC SETTINGS
  //=================================================================

  setFloatStringConversionMethod = (value: FloatStringConversionMethod) => {
    this.floatStringConversionMethod = value;
    this._saveConfig();
  };

  //=================================================================
  // OTHER
  //=================================================================

  setShowWarningOnRxBreakSignal = (value: boolean) => {
    this.showWarningOnRxBreakSignal = value;
    this._saveConfig();
  };

  /**
   * Provides a descriptive name for the currently selected data type for the app
   * to display in the toolbar.
   * @returns The descriptive name as a string.
   */
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
