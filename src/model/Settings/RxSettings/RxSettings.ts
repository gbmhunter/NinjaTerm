import { makeAutoObservable } from "mobx";
import { z } from "zod";

import AppStorage from "src/model/Storage/AppStorage";
import { ApplyableNumberField, ApplyableTextField } from "src/view/Components/ApplyableTextField";
import { createSerializableObjectFromConfig, updateConfigFromSerializable } from "src/model/Util/SettingsLoader";

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

class Config {
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

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }
}

const CONFIG_KEY = ['settings', 'rx-settings'];

export default class RxSettings {
  appStorage: AppStorage;

  config = new Config();

  constructor(appStorage: AppStorage) {
    this.appStorage = appStorage;
    this._loadConfig();
    makeAutoObservable(this); // Make sure this is at the end of the constructor

    this.config.maxEscapeCodeLengthChars.setOnApplyChanged(() => {
      this._saveConfig();
    });
    this.config.numberSeparator.setOnApplyChanged(() => {
      this._saveConfig();
    });
    this.config.newLineMatchValueAsHex.setOnApplyChanged(() => {
      this._saveConfig();
    });
    this.config.numPaddingChars.setOnApplyChanged(() => {
      this._saveConfig();
    });
    this.config.floatNumOfDecimalPlaces.setOnApplyChanged(() => {
      this._saveConfig();
    });
  }

  _loadConfig = () => {
    let deserializedConfig = this.appStorage.getConfig(CONFIG_KEY);

    //===============================================
    // UPGRADE PATH
    //===============================================
    if (deserializedConfig === null) {
      // No data exists, create
      console.log(`No config found in local storage for key ${CONFIG_KEY}. Creating...`);
      this._saveConfig();
      return;
    } else if (deserializedConfig.version === this.config.version) {
      console.log(`Up-to-date config found for key ${CONFIG_KEY}.`);
    } else {
      console.error(`Out-of-date config version ${deserializedConfig.version} found for key ${CONFIG_KEY}.` +
                    ` Updating to version ${this.config.version}.`);
      this._saveConfig();
      deserializedConfig = this.appStorage.getConfig(CONFIG_KEY);
    }

    // At this point we are confident that the deserialized config matches what
    // this classes config object wants, so we can go ahead and update.
    updateConfigFromSerializable(deserializedConfig, this.config);
  };

  _saveConfig = () => {
    const serializableConfig = createSerializableObjectFromConfig(this.config);
    this.appStorage.saveConfig(CONFIG_KEY, serializableConfig);
  };

  setDataType = (value: DataType) => {
    this.config.dataType = value;
    this._saveConfig();
  };

  //=================================================================
  // ASCII-SPECIFIC SETTINGS
  //=================================================================

  setAnsiEscapeCodeParsingEnabled = (value: boolean) => {
    this.config.ansiEscapeCodeParsingEnabled = value;
    this._saveConfig();
  };

  setLocalTxEcho = (value: boolean) => {
    this.config.localTxEcho = value;
    this._saveConfig();
  };

  setNewLineCursorBehavior = (value: NewLineCursorBehavior) => {
    this.config.newLineCursorBehavior = value;
    this._saveConfig();
  };

  setSwallowNewLine = (value: boolean) => {
    this.config.swallowNewLine = value;
    this._saveConfig();
  };

  setCarriageReturnBehavior = (value: CarriageReturnCursorBehavior) => {
    this.config.carriageReturnCursorBehavior = value;
    this._saveConfig();
  };

  setSwallowCarriageReturn = (value: boolean) => {
    this.config.swallowCarriageReturn = value;
    this._saveConfig();
  };

  setNonVisibleCharDisplayBehavior = (value: NonVisibleCharDisplayBehaviors) => {
    this.config.nonVisibleCharDisplayBehavior = value;
    this._saveConfig();
  };

  //=================================================================
  // NUMBER-SPECIFIC SETTINGS
  //=================================================================

  setNumberType = (value: NumberType) => {
    this.config.numberType = value;
    this._saveConfig();
  }

  setEndianness = (value: Endianness) => {
    this.config.endianness = value;
    this._saveConfig();
  };

  setPreventHexValuesWrappingAcrossRows = (value: boolean) => {
    this.config.preventValuesWrappingAcrossRows = value;
    this._saveConfig();
  };

  setInsertNewLineOnValue = (value: boolean) => {
    this.config.insertNewLineOnMatchedValue = value;
    this._saveConfig();
  };

  setNewLinePlacementOnValue = (value: NewLinePlacementOnHexValue) => {
    this.config.newLinePlacementOnHexValue = value;
    this._saveConfig();
  };

  setPadValues = (value: boolean) => {
    this.config.padValues = value;
    this._saveConfig();
  }

  setPaddingCharacter = (value: PaddingCharacter) => {
    this.config.paddingCharacter = value;
    this._saveConfig();
  }

  //=================================================================
  // HEX SPECIFIC SETTINGS
  //=================================================================

  setHexCase = (value: HexCase) => {
    this.config.hexCase = value;
    this._saveConfig();
  };

  setPrefixHexValuesWith0x = (value: boolean) => {
    this.config.prefixHexValuesWith0x = value;
    this._saveConfig();
  };

  //=================================================================
  // FLOAT SPECIFIC SETTINGS
  //=================================================================

  setFloatStringConversionMethod = (value: FloatStringConversionMethod) => {
    this.config.floatStringConversionMethod = value;
    this._saveConfig();
  };

  //=================================================================
  // OTHER
  //=================================================================

  /**
   * Provides a descriptive name for the currently selected data type for the app
   * to display in the toolbar.
   * @returns The descriptive name as a string.
   */
  getDataTypeNameForToolbarDisplay = () => {
    if (this.config.dataType === DataType.ASCII) {
      return "ASCII";
    } else {
      return this.config.numberType;
    }
  };
}
