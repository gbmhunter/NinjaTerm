import { makeObservable, observable, computed, action, flow } from "mobx"
import { ZodType } from 'zod';

/**
 * Re-usable class that backs a UI input text field. It has a display
 * value which is what the user sees, and an applied value which is
 * typically updated on Enter or loss of focus, and can be
 * validated using Zod.
 */
export default abstract class ApplyableField {
  dispValue: string;
  schema: ZodType;

  isValid = false;
  errorMsg = '';

  onApplyChanged: () => void = () => {};

  constructor(dispValue: string, schema: ZodType) {
    this.schema = schema;
    this.dispValue = '';
    // this.appliedValue = '';
    this.setDispValue(dispValue);
    this.apply();
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

export class ApplyableTextField extends ApplyableField {

  appliedValue!: string;

  constructor(dispValue: string, schema: ZodType) {
    super(dispValue, schema);
    // For some reason we have to call apply() here, we can't rely on the apply()
    // called in the base class.
    this.apply();
    makeObservable(this, {
      appliedValue: observable,
    })
  }

  apply() {
    if (this.isValid && this.dispValue !== this.appliedValue) {
      this.appliedValue = this.dispValue;
      this.onApplyChanged();
    }
  }
}

export class ApplyableNumberField extends ApplyableField {

  appliedValue!: number;

  constructor(dispValue: string, schema: ZodType) {
    super(dispValue, schema);
    // For some reason we have to call apply() here, we can't rely on the apply()
    // called in the base class.
    this.apply();
    makeObservable(this, {
      appliedValue: observable,
    })
  }

  apply() {
    if (this.isValid) {
      this.appliedValue = Number(this.dispValue);
    }
    this.onApplyChanged();
  }
}
