import { makeAutoObservable } from "mobx";
import { z } from "zod";

import AppStorage from "src/model/Storage/AppStorage";
import { ApplyableNumberField, ApplyableTextField } from "src/view/Components/ApplyableTextField";
import { createSerializableObjectFromConfig, updateConfigFromSerializable } from "src/model/Util/SettingsLoader";

export enum DataType {
  ASCII,
  HEX,
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

  // HEX-SPECIFIC SETTINGS
  hexSeparator = new ApplyableTextField(" ", z.string());
  hexCase = HexCase.UPPERCASE;
  prefixHexValuesWith0x = false;
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

  // COPY/PASTE SETTINGS
  whenPastingOnWindowsReplaceCRLFWithLF = true;
  whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;

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
  }

  loadSettings = () => {
    let config = this.appStorage.getConfig(CONFIG_KEY);

    // UPGRADE PATH
    //===============================================

    if (config === null) {
      // No data exists, create
      console.log("No rx-settings config found in local storage. Creating...");
      this.saveSettings();
      return;
    } else if (config.version === 1) {
      console.log("Up-to-date config found");
    } else {
      console.error("Unknown config version found: ", config.version);
      this.appStorage.saveConfig(CONFIG_KEY, this.config);
    }

    // At this point we a confident that config represents the latest version, so
    // we can go ahead and update all the app settings with the values from the config object
    updateConfigFromSerializable(config, this.config);
  };

  saveSettings = () => {
    console.log("Saving RX settings config. config:", JSON.stringify(this.config));
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

  setWhenPastingOnWindowsReplaceCRLFWithLF = (value: boolean) => {
    this.config.whenPastingOnWindowsReplaceCRLFWithLF = value;
    this.saveSettings();
  };

  setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = (value: boolean) => {
    this.config.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = value;
    this.saveSettings();
  };

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

  setPreventHexValuesWrappingAcrossRows = (value: boolean) => {
    this.config.preventHexValuesWrappingAcrossRows = value;
    this.saveSettings();
  };

  setInsetNewLineOnHexValue = (value: boolean) => {
    this.config.insetNewLineOnHexValue = value;
    this.saveSettings();
  };

  // setNewlineHexValueDisplayed = (value: string) => {
  //   this.data.newLineHexValue.displayed = value;
  //   const validation = this.data.newLineHexValue.schema.safeParse(value);
  //   if (validation.success) {
  //     this.data.newLineHexValue.errorMsg = '';
  //   } else {
  //     this.data.newLineHexValue.errorMsg = validation.error.errors[0].message;
  //   }
  //   this.saveSettings();
  // }

  // applyNewlineHexValue = () => {
  //   this.saveSettings();
  // }

  setNewLinePlacementOnHexValue = (value: NewLinePlacementOnHexValue) => {
    this.config.newLinePlacementOnHexValue = value;
    this.saveSettings();
  };
}
