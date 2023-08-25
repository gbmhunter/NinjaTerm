// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable } from 'mobx';

class DataProcessingSettingsData {
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
}

export default class DataProcessingSettings {
  // The data which is visible to the user, may or may not be valid
  visibleData = new DataProcessingSettingsData();

  // The valid data which is committed once "Apply" is clicked
  appliedData = new DataProcessingSettingsData();

  constructor() {
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
  };
}
