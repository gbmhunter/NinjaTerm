import { makeAutoObservable } from 'mobx';

import TerminalChar from './SingleTerminalChar';

/**
 * Represents a single row of characters in the terminal
 */
export default class TerminalRow {
  // The chars in this row.
  terminalChars: TerminalChar[];

  constructor() {
    this.terminalChars = [];
    makeAutoObservable(this);
  }
}
