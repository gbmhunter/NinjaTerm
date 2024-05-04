import { makeObservable, observable, action } from 'mobx';
import { ZodType } from 'zod';

export class AppliedValue {
  value: string;
  constructor(appliedValue: string) {
    this.value = appliedValue;
    makeObservable(this, {
      value: observable,
    })
  }
}

/**
 * Re-usable class that backs a UI input text field. It has a display
 * value which is what the user sees, and an applied value which is
 * typically updated on Enter or loss of focus, and can be
 * validated using Zod.
 */
export default abstract class ApplyableFieldV2 {
  dispValue: string;
  schema: ZodType;

  isValid = false;
  errorMsg = '';

  onApplyChanged: () => void = () => {};

  constructor(dispValue: string, schema: ZodType) {
    this.schema = schema;
    this.dispValue = '';
    this.setDispValue(dispValue);
    // this.apply();
    makeObservable(this, {
      dispValue: observable,
      setDispValue: action,
      apply: action,
    })
  }

  setDispValue = (value: string) => {
    this.dispValue = value;
    const validation = this.schema.safeParse(this.dispValue);
    this.isValid = validation.success;
    if (validation.success) {
      this.errorMsg = '';
    } else {
      // We want to keep this simple, just show the first
      // error message
      this.errorMsg = validation.error.errors[0].message;
    }
  }

  /**
   * Sets a callback to be called when a new value is applied, that is also different
   * to the previous value. Called once appliedValue has been updated.
   */
  setOnApplyChanged(onApply: () => void) {
    this.onApplyChanged = onApply;
  }

  abstract apply(): void;
}

export class ApplyableTextFieldV2 extends ApplyableFieldV2 {

  appliedValueContainer!: any;
  appliedValueKey!: string;

  constructor(dispValue: string, appliedValueContainer: any, appliedValueKey: string, schema: ZodType) {
    console.log('ApplyableTextFieldV2 constructor. dispValue:', dispValue);
    super(dispValue, schema);
    this.appliedValueContainer = appliedValueContainer;
    this.appliedValueKey = appliedValueKey;
    console.log('ApplyableTextFieldV2 constructor. this.appliedValue:', this.appliedValueContainer[this.appliedValueKey]);
    // For some reason we have to call apply() here, we can't rely on the apply()
    // called in the base class.
    this.apply();
    // makeObservable(this, {
    //   appliedValue: observable,
    // })
  }

  apply() {
    if (!this.isValid) {
      return
    }
    const oldAppliedValue = this.appliedValueContainer[this.appliedValueKey];
    // For a text field, we just need to copy the value
    // no conversion to a different type needed
    this.appliedValueContainer[this.appliedValueKey] = this.dispValue;
    if (this.appliedValueContainer[this.appliedValueKey] !== oldAppliedValue) {
      console.log('Val changed. Set to:', this.appliedValueContainer[this.appliedValueKey]);
      this.onApplyChanged();
    }
  }
}

export class ApplyableNumberFieldV2 extends ApplyableFieldV2 {

  appliedValueContainer!: any;
  appliedValueKey!: string;

  constructor(dispValue: string, appliedValueContainer: any, appliedValueKey: string, schema: ZodType) {
    super(dispValue, schema);
    this.appliedValueContainer = appliedValueContainer;
    this.appliedValueKey = appliedValueKey;
    // For some reason we have to call apply() here, we can't rely on the apply()
    // called in the base class.
    this.apply();
  }

  apply() {
    if (!this.isValid) {
      return
    }

    const oldAppliedValue = this.appliedValueContainer[this.appliedValueKey];
    // Convert displayed string into a number
    this.appliedValueContainer[this.appliedValueKey] = Number(this.dispValue);
    if (this.appliedValueContainer[this.appliedValueKey] !== oldAppliedValue) {
      this.onApplyChanged();
    }
  }
}
