// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable } from 'mobx';
import * as Validator from 'validatorjs';

// eslint-disable-next-line import/no-cycle
import { AppStore } from 'stores/App';

class Data {
  fields = {
    ansiEscapeCodeParsingEnabled: {
      value: true,
      hasError: false,
      errorMsg: '',
      rule: 'required',
    },
    dataWidth_chars: {
      value: 200,
      hasError: false,
      errorMsg: '',
      rule: 'required|integer|min:1',
    },
    scrollbackSize_chars: {
      value: 10000,
      hasError: false,
      errorMsg: '',
      rule: 'required|integer|min:1',
    },
  };

  constructor() {
    makeAutoObservable(this);
  }
}

export default class DataProcessingSettings {
  appStore: AppStore;

  // The data which is visible to the user, may or may not be valid
  visibleData = new Data();

  // The valid data which is committed once "Apply" is clicked
  appliedData = new Data();

  // Set to true if the visible data has been changed from the applied
  // data by the user AND data is valid (this is used to enable the "Apply" button)
  isApplyable = false;

  constructor(app: AppStore) {
    this.appStore = app;
    makeAutoObservable(this);
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
          paramDataAny.errorMsg = validation.errors.first('dataWidth_chars'); // validation.errors.first('dataWidth_chars');
        } else {
          paramDataAny.errorMsg = '';
        }
      }
    );
  };

  applyChanges = () => {
    // Deep-copy visible data to applied data
    this.appliedData = JSON.parse(JSON.stringify(this.visibleData));
    this.appStore.ansiECParser.isEnabled =
      this.appliedData.fields.ansiEscapeCodeParsingEnabled.value;
    this.isApplyable = false;
  };
}
