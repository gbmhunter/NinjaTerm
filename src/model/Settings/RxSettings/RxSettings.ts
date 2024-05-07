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

export enum NumberTypes {
  HEX = 'Hex',
  UINT8 = 'uint8',
  UINT16 = 'uint16',
}

export enum PaddingCharacter {
  WHITESPACE,
  ZERO,
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
  selectedNumberType = NumberTypes.HEX;
  hexSeparator = new ApplyableTextField(" ", z.string());
  preventHexValuesWrappingAcrossRows = true;
  insetNewLineOnHexValue = false;
  newLineHexValue = new ApplyableTextField(
    "00",
    z
    .string()
    .length(2)
    .regex(/^([0-9A-Fa-f]{2})$/, "Must be a valid hex number.")
  );
  newLinePlacementOnHexValue = NewLinePlacementOnHexValue.BEFORE;
  padValues = true;
  paddingCharacter = PaddingCharacter.ZERO;

  /**
   * Set to -1 for automatic padding, which will pad up to the largest possible value
   * for the selected number type.
   */
  numPaddingChars = new ApplyableNumberField('-1', z.coerce.number().min(-1).max(10).int());

  // HEX-SPECIFIC SETTINGS
  prefixHexValuesWith0x = false;
  hexCase = HexCase.UPPERCASE;

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }
}

const CONFIG_KEY = ["settings", "rx-settings"];

export default class RxSettings {
  appStorage: AppStorage;

  config = new Config();

  constructor(appStorage: AppStorage) {
    this.appStorage = appStorage;
    this.loadSettings();
    makeAutoObservable(this); // Make sure this is at the end of the constructor

    this.config.maxEscapeCodeLengthChars.setOnApplyChanged(() => {
      this.saveSettings();
    });
    this.config.hexSeparator.setOnApplyChanged(() => {
      this.saveSettings();
    });
    this.config.newLineHexValue.setOnApplyChanged(() => {
      this.saveSettings();
    });
    this.config.numPaddingChars.setOnApplyChanged(() => {
      this.saveSettings();
    });
  }

  loadSettings = () => {
    let deserializedConfig = this.appStorage.getConfig(CONFIG_KEY);

    // UPGRADE PATH
    //===============================================
    if (deserializedConfig === null) {
      // No data exists, create
      console.log("No rx-settings config found in local storage. Creating...");
      this.saveSettings();
      return;
    } else if (deserializedConfig.version === 1) {
      console.log("Up-to-date config found");
    } else {
      console.error("Unknown config version found: ", deserializedConfig.version);
      this.appStorage.saveConfig(CONFIG_KEY, this.config);
    }

    // At this point we are confident that the deserialized config matches what
    // this classes config object wants, so we can go ahead and update.
    updateConfigFromSerializable(deserializedConfig, this.config);
  };

  saveSettings = () => {
    const serializableConfig = createSerializableObjectFromConfig(this.config);
    this.appStorage.saveConfig(CONFIG_KEY, serializableConfig);
  };

  setDataType = (value: DataType) => {
    this.config.dataType = value;
    this.saveSettings();
  };

  //=================================================================
  // ASCII-SPECIFIC SETTINGS
  //=================================================================

  setAnsiEscapeCodeParsingEnabled = (value: boolean) => {
    this.config.ansiEscapeCodeParsingEnabled = value;
    this.saveSettings();
  };

  setLocalTxEcho = (value: boolean) => {
    this.config.localTxEcho = value;
    this.saveSettings();
  };

  setNewLineCursorBehavior = (value: NewLineCursorBehavior) => {
    this.config.newLineCursorBehavior = value;
    this.saveSettings();
  };

  setSwallowNewLine = (value: boolean) => {
    this.config.swallowNewLine = value;
    this.saveSettings();
  };

  setCarriageReturnBehavior = (value: CarriageReturnCursorBehavior) => {
    this.config.carriageReturnCursorBehavior = value;
    this.saveSettings();
  };

  setSwallowCarriageReturn = (value: boolean) => {
    this.config.swallowCarriageReturn = value;
    this.saveSettings();
  };

  setNonVisibleCharDisplayBehavior = (value: NonVisibleCharDisplayBehaviors) => {
    this.config.nonVisibleCharDisplayBehavior = value;
    this.saveSettings();
  };

  //=================================================================
  // NUMBER-SPECIFIC SETTINGS
  //=================================================================

  setSelectedNumberType = (value: NumberTypes) => {
    console.log('setSelectedNumberType', value);
    this.config.selectedNumberType = value;
    this.saveSettings();
  }

  setPreventHexValuesWrappingAcrossRows = (value: boolean) => {
    this.config.preventHexValuesWrappingAcrossRows = value;
    this.saveSettings();
  };

  setInsetNewLineOnHexValue = (value: boolean) => {
    this.config.insetNewLineOnHexValue = value;
    this.saveSettings();
  };

  setNewLinePlacementOnHexValue = (value: NewLinePlacementOnHexValue) => {
    this.config.newLinePlacementOnHexValue = value;
    this.saveSettings();
  };

  setPadValues = (value: boolean) => {
    this.config.padValues = value;
    this.saveSettings();
  }

  setPaddingCharacter = (value: PaddingCharacter) => {
    this.config.paddingCharacter = value;
    this.saveSettings();
  }

  //=================================================================
  // HEX-SPECIFIC SETTINGS
  //=================================================================

  setHexCase = (value: HexCase) => {
    this.config.hexCase = value;
    this.saveSettings();
  };

  setPrefixHexValuesWith0x = (value: boolean) => {
    this.config.prefixHexValuesWith0x = value;
    this.saveSettings();
  };
}
