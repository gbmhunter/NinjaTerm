/* eslint-disable prettier/prettier */
// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable } from 'mobx';
import * as Validator from 'validatorjs';

// eslint-disable-next-line import/no-cycle
import { App } from 'model/App';

/** Enumerates the different possible ways the TX and RX data
 * can be displayed. One of these may be active at any one time.
 */
export enum DataViewConfiguration {
  RX_PANE, // No TX echo
  COMBINED_TX_RX_PANE, // TX echo
  SEPARATE_TX_RX_PANES,
}

// Maps the enums to human-readable names for display
export const dataViewConfigEnumToDisplayName: {
  [key: string]: string;
} = {
  [DataViewConfiguration.RX_PANE]: 'RX pane (no TX echo)',
  [DataViewConfiguration.COMBINED_TX_RX_PANE]: 'Combined TX/RX pane (TX echo)',
  [DataViewConfiguration.SEPARATE_TX_RX_PANES]: 'Separate TX/RX panes',
};

/** This class represents all the data which is stored in the data processing setting category.
 * One instance is created for the visible data, and another for the applied (and validated) data */
class Data {
  fields = {
    ansiEscapeCodeParsingEnabled: {
      value: true,
      hasError: false,
      errorMsg: '',
      rule: 'required',
    },
    wrappingWidthChars: {
      value: 80, // 80 is standard
      hasError: false,
      errorMsg: '',
      rule: 'required|integer|min:1',
    },
    scrollbackBufferSizeChars: {
      value: 100000,
      hasError: false,
      errorMsg: '',
      rule: 'required|integer|min:1',
    },
    dataViewConfiguration: {
      value: DataViewConfiguration.COMBINED_TX_RX_PANE,
      hasError: false,
      errorMsg: '',
      rule: 'required',
    },
  };

  constructor() {
    makeAutoObservable(this);
  }
}

export default class DataProcessingSettings {
  app: App;

  // The data which is visible to the user, may or may not be valid
  visibleData = new Data();

  // The valid data which is committed once "Apply" is clicked
  appliedData = new Data();

  // Set to true if the visible data has been changed from the applied
  // data by the user AND data is valid (this is used to enable the "Apply" button)
  isApplyable = false;

  constructor(app: App) {
    this.app = app;
    this.app.txRxTerminal.setCharWidth(this.appliedData.fields.wrappingWidthChars.value);
    this.app.rxTerminal.setCharWidth(this.appliedData.fields.wrappingWidthChars.value);
    this.app.txTerminal.setCharWidth(this.appliedData.fields.wrappingWidthChars.value);
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  onFieldChange = (field: any, value: any) => {
    // Hacky cast to any to prevent typescript warnings
    console.log('onFieldChange() called. field=', field, ', value=', value);
    (this.visibleData.fields as any)[field].value = value;

    // Massage data into the form the validator library expects...
    const validatorValues: { [key: string]: any } = {};
    const validatorRules: { [key: string]: string } = {};
    Object.entries(this.visibleData.fields).forEach(
      ([paramName, paramData]) => {
        validatorValues[paramName] = paramData.value;
        validatorRules[paramName] = paramData.rule;
      }
    );

    const validation = new Validator(validatorValues, validatorRules);
    // Calling passes() is needed to run the validation logic. This also assigns the result
    // to enable/disable the apply button
    this.isApplyable = validation.passes();

    // Iterate over key/value pairs in data
    Object.entries(this.visibleData.fields).forEach(
      ([paramName, paramData]) => {
        const hasError = validation.errors.has(paramName);
        // Convert to any type so we can assign to it
        const paramDataAny = paramData as any;
        paramDataAny.hasError = hasError;
        if (hasError) {
          paramDataAny.errorMsg = validation.errors.first('wrappingWidthChars'); // validation.errors.first('wrappingWidthChars');
        } else {
          paramDataAny.errorMsg = '';
        }
      }
    );
  };

  applyChanges = () => {
    // Deep-copy visible data to applied data
    this.appliedData = JSON.parse(JSON.stringify(this.visibleData));
    // Apply any actions because of these new applied settings
    this.app.ansiECParser.isEnabled =
      this.appliedData.fields.ansiEscapeCodeParsingEnabled.value;
    this.app.txRxTerminal.setCharWidth(this.appliedData.fields.wrappingWidthChars.value);
    this.app.rxTerminal.setCharWidth(this.appliedData.fields.wrappingWidthChars.value);
    this.app.txTerminal.setCharWidth(this.appliedData.fields.wrappingWidthChars.value);
    this.isApplyable = false;
  };
}
