// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable } from 'mobx';
// eslint-disable-next-line import/no-cycle
import { AppStore } from 'stores/App';

class Data {
  form = {
    fields: {
      ansiEscapeCodeParsingEnabled: {
        value: true,
        error: null,
        rule: 'required|email',
      },
      password: {
        value: '',
        error: null,
        rule: 'required',
      },
    },
    meta: {
      isValid: true,
      error: null,
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
    (this.visibleData.form.fields as any)[field].value = value;
    // let {email, password} = this.form.fields
    // var validation = new Validator(
    //   {email: email.value, password: password.value},
    //   {email: email.rule, password: password.rule},
    // )
    // this.form.meta.isValid = validation.passes();
    // this.form.fields[field].error = validation.errors.first(field);

    this.isApplyable = true;
  };

  applyChanges = () => {
    // Deep-copy visible data to applied data
    this.appliedData = JSON.parse(JSON.stringify(this.visibleData));
    this.appStore.ansiECParser.isEnabled =
      this.appliedData.form.fields.ansiEscapeCodeParsingEnabled.value;
    this.isApplyable = false;
  };
}
