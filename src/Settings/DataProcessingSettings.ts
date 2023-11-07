// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable } from 'mobx';
import * as Validator from 'validatorjs';
import { ZodString, z } from 'zod';

// eslint-disable-next-line import/no-cycle
import { App } from '../App';
import { ApplyableNumberField } from 'src/Components/ApplyableTextField';

export enum NewLineCursorBehaviors {
  DO_NOTHING,
  NEW_LINE,
  CARRIAGE_RETURN_AND_NEW_LINE,
}

export enum CarriageReturnCursorBehaviors {
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

export default class DataProcessingSettings {
  app: App;

  ansiEscapeCodeParsingEnabled = true;

  // maxEscapeCodeLengthChars = {
  //   dispValue: '10',
  //   appliedValue: 10,
  //   hasError: false,
  //   errorMsg: '',
  //   rule: 'required|integer|min:2', // Min. is two, one for the escape byte and then a single char.
  // };

  maxEscapeCodeLengthChars = new ApplyableNumberField('10', z.coerce.number().min(2));

  // If true, local TX data will be echoed to RX
  localTxEcho = false;

  newLineCursorBehavior = NewLineCursorBehaviors.CARRIAGE_RETURN_AND_NEW_LINE;

  // If set to true, \n bytes will be swallowed and not displayed
  // on the terminal UI (which is generally what you want)
  swallowNewLine = true;

  // By default set the \n behavior to do new line and carriage return
  // and \r to do nothing. This works for both \n and \r\n line endings
  carriageReturnCursorBehavior = CarriageReturnCursorBehaviors.DO_NOTHING;

  // If set to true, \r bytes will be swallowed and not displayed
  // on the terminal UI (which is generally what you want)
  swallowCarriageReturn = true;

  // I assume most people by default might want to see unexpected invisible chars? If not
  // this might be better defaulting to SWALLOW?
  nonVisibleCharDisplayBehavior = NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS;

  // Set to true if the visible data has been changed from the applied
  // data by the user AND data is valid (this is used to enable the "Apply" button)
  isApplyable = false;

  constructor(app: App) {
    this.app = app;
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  setAnsiEscapeCodeParsingEnabled = (value: boolean) => {
    this.ansiEscapeCodeParsingEnabled = value;
  }

  setLocalTxEcho = (value: boolean) => {
    this.localTxEcho = value;
  }

  setNewLineCursorBehavior = (value: NewLineCursorBehaviors) => {
    this.newLineCursorBehavior = value;
  }

  setSwallowNewLine = (value: boolean) => {
    this.swallowNewLine = value;
  }

  setCarriageReturnBehavior = (value: CarriageReturnCursorBehaviors) => {
    this.carriageReturnCursorBehavior = value;
  }

  setSwallowCarriageReturn = (value: boolean) => {
    this.swallowCarriageReturn = value;
  }

  setNonVisibleCharDisplayBehavior = (value: NonVisibleCharDisplayBehaviors) => {
    this.nonVisibleCharDisplayBehavior = value;
  }
}
