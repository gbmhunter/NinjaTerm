import { makeAutoObservable } from 'mobx';

import TerminalChar from './SingleTerminalChar';

/**
 * Represents a single row of characters in the terminal
 */
export default class TerminalRow {
  // The chars in this row.
  terminalChars: TerminalChar[];

  /**
   * A unique identifier for this row. This is used both for filtering
   * and for preserving user selection across re-renders.
   */
  uniqueRowId: number;

  constructor(uniqueRowId: number) {
    this.terminalChars = [];
    this.uniqueRowId = uniqueRowId;
    makeAutoObservable(this);
  }

  /**
   * Returns the raw text of the row, by joining all the individual chars together
   * into a single string. Discards all other properties of a terminal char, such
   * as formatting.
   *
   * @returns The raw text of the row.
   */
  getText(): string {
    return this.terminalChars.map((terminalChar) => terminalChar.char).join('');
  }
}
