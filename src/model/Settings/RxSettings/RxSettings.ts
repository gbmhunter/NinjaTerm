import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { ApplyableTextFieldV2, AppliedValue, ApplyableNumberFieldV2 } from 'src/view/Components/ApplyableTextFieldV2/ApplyableTextFieldV2';
import AppStorage from 'src/model/Storage/AppStorage';
import { ApplyableNumberField, ApplyableTextField } from 'src/view/Components/ApplyableTextField';

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

class ConfigV1 {
  // METADATA
  // Create new version of this class if you need to update the structure
  version = 1;

  /**
   * How to interpret the received data from the serial port.
   */
  dataType = DataType.ASCII;

  // ASCII-SPECIFIC SETTINGS
  ansiEscapeCodeParsingEnabled = true;
  maxEscapeCodeLengthChars = new ApplyableNumberField('10', z.coerce.number().min(2));
  localTxEcho = false;
  newLineCursorBehavior = NewLineCursorBehavior.CARRIAGE_RETURN_AND_NEW_LINE;
  swallowNewLine = true;
  carriageReturnCursorBehavior = CarriageReturnCursorBehavior.DO_NOTHING;
  swallowCarriageReturn = true;
  nonVisibleCharDisplayBehavior = NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS;

  // HEX-SPECIFIC SETTINGS
  hexSeparator = new ApplyableTextField(' ', z.string());
  hexCase = HexCase.UPPERCASE;
  prefixHexValuesWith0x = false;
  preventHexValuesWrappingAcrossRows = true;
  insetNewLineOnHexValue = false;
  newLineHexValue = new ApplyableTextField('00', z.string().length(2).regex(/^([0-9A-Fa-f]{2})$/, 'Must be a valid hex number.'));
  newLinePlacementOnHexValue = NewLinePlacementOnHexValue.BEFORE;

  // COPY/PASTE SETTINGS
  whenPastingOnWindowsReplaceCRLFWithLF = true;
  whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }
}

const CONFIG_KEY = ['settings', 'rx-settings'];

export default class RxSettings {

  appStorage: AppStorage;

  // dataType = DataType.ASCII;

  // //=================================================================
  // // ASCII-SPECIFIC SETTINGS
  // //=================================================================

  // ansiEscapeCodeParsingEnabled = true;

  // maxEscapeCodeLengthChars = new ApplyableNumberField('10', z.coerce.number().min(2));

  // // If true, local TX data will be echoed to RX
  // localTxEcho = false;

  // newLineCursorBehavior = NewLineCursorBehavior.CARRIAGE_RETURN_AND_NEW_LINE;

  // // If set to true, \n bytes will be swallowed and not displayed
  // // on the terminal UI (which is generally what you want)
  // swallowNewLine = true;

  // // By default set the \n behavior to do new line and carriage return
  // // and \r to do nothing. This works for both \n and \r\n line endings
  // carriageReturnCursorBehavior = CarriageReturnCursorBehavior.DO_NOTHING;

  // // If set to true, \r bytes will be swallowed and not displayed
  // // on the terminal UI (which is generally what you want)
  // swallowCarriageReturn = true;

  // // I assume most people by default might want to see unexpected invisible chars? If not
  // // this might be better defaulting to SWALLOW?
  // nonVisibleCharDisplayBehavior = NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS;

  // //=================================================================
  // // HEX-SPECIFIC SETTINGS
  // //=================================================================

  // hexSeparator = new ApplyableTextField(' ', z.string());

  // hexCase = HexCase.UPPERCASE;

  // /**
  //  * If true, displayed hex values in the terminal will all be prefixed with "0x".
  //  * Defaults to false because typically the 0x is just noise and not needed.
  //  */
  // prefixHexValuesWith0x = false;

  // preventHexValuesWrappingAcrossRows = true;

  // insetNewLineOnHexValue = false;

  // newLinePlacementOnHexValue = NewLinePlacementOnHexValue.BEFORE;

  // /** If true, when pasting text into a terminal from the clipboard with Ctrl-Shift-V, all
  //  * CRLF pairs will be replaced with LF. This is generally what we want to do, because LF will
  //  * be converted to CRLF when copying TO the clipboard when on Windows.
  //  */
  // whenPastingOnWindowsReplaceCRLFWithLF = true;

  // whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;

  config = new ConfigV1();

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
      // config = new DataV1();
      console.log('No rx-settings config found in local storage. Creating...');
      this.saveSettings();
      return;
    } else if (config.version === 1) {
      console.log('Up-to-date config found');
    } else{
      console.error('Unknown config version found: ', config.version);
      // config = new DataV1();
      this.appStorage.saveConfig(CONFIG_KEY, this.config);
    }

    // At this point we a confident that config represents the latest version, so
    // we can go ahead and update all the app settings with the values from the config object
    let upToDateConfig = config as ConfigV1;

    let me = this as any
    Object.keys(this.config).forEach(function(key, index) {
      // console.log('key:', key, 'index:', index);
      let key1 = key as keyof ConfigV1;
      // console.log(typeof (me.config[key1]));

      // If key doesn't exist in data stored in local storage, skip it
      if (!(key1 in upToDateConfig)) {
        console.log('Key not found in upToDateConfig:', key1);
        return;
      }

      if (typeof (me.config[key1]) == 'number' ||
          typeof (me.config[key1]) == 'string' ||
          typeof (me.config[key1]) == 'boolean'){
        // Primitive types can be directly assigned
        let foundVal: any = upToDateConfig[key1];
        me.config[key1] = foundVal;
      } else if (typeof (me.config[key1]) == 'object') {
        // ApplyableTextField
        //===============================
        if (me.config[key1] instanceof ApplyableTextField) {
          let foundVal: any = upToDateConfig[key1];
          console.log('Found applyable text field:', key1, 'value:', foundVal);
          me.config[key1].setDispValue(foundVal);
          me.config[key1].apply();
        } else if (me.config[key1] instanceof ApplyableNumberField) {
          let foundVal: any = upToDateConfig[key1];
          console.log('Found applyable number field:', key1, 'value:', foundVal);
          // Convert applied value back to displayed value and re-apply
          me.config[key1].setDispValue(foundVal.toString());
          me.config[key1].apply();
        } else {
          console.error('Unknown object type for key:', key);
        }
      } else {
        console.error('Unknown type for key:', key);
      }
    });
  }

  saveSettings = () => {
    console.log('Saving RX settings config. config:', JSON.stringify(this.config));
    // Loop through all config properties and save them
    let me = this as any
    let serializableConfig: any = {};
    Object.keys(this.config).forEach(function(key, index) {
      // console.log('key:', key, 'index:', index);
      let key1 = key as keyof ConfigV1;
      // console.log(typeof (me.config[key1]));
      if (typeof (me.config[key1]) == 'number' ||
          typeof (me.config[key1]) == 'string' ||
          typeof (me.config[key1]) == 'boolean'){
        serializableConfig[key1] = me.config[key1];
      }  else if (typeof (me.config[key1]) == 'object') {
        // ApplyableTextField
        //===============================
        if (me.config[key1] instanceof ApplyableTextField) {
          const applyableTextField = me.config[key1] as ApplyableTextField;
          // console.log('Saving applyable text field:', key1, 'value:', applyableTextField.appliedValue);
          serializableConfig[key1] = applyableTextField.appliedValue;
        } else if (me.config[key1] instanceof ApplyableNumberField) {
          const applyableNumberField = me.config[key1] as ApplyableNumberField;
          // console.log('Saving applyable text field:', key1, 'value:', applyableNumberField.appliedValue);
          // Store the applied value, which will be a number
          serializableConfig[key1] = applyableNumberField.appliedValue;
        } else {
          console.error('Unknown object type for key:', key);
        }
      } else {
        console.error('Unknown type for key:', key);
      }
    });

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
  }

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
  }
}
