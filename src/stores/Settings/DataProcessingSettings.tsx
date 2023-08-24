import { makeAutoObservable } from 'mobx';

export default class DataProcessingSettings {
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

  onFieldChange = (field: any, value: any) => {
    this.form.fields[field].value = value;
    // let {email, password} = this.form.fields
    // var validation = new Validator(
    //   {email: email.value, password: password.value},
    //   {email: email.rule, password: password.rule},
    // )
    // this.form.meta.isValid = validation.passes();
    // this.form.fields[field].error = validation.errors.first(field);
  };

}
