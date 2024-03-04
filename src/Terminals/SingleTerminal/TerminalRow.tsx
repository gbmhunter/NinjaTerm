import { makeAutoObservable } from 'mobx';

import TerminalChar from './SingleTerminalChar';

/**
 * Represents a single row of characters in the terminal
 */
export default class TerminalRow {
  /**
   * Holds the characters that make up the row. Each character has
   * a char, style and a class name associated with it.
   */
  terminalChars: TerminalChar[];

  /**
   * A unique identifier for this row. This is used both for filtering
   * and for preserving user selection across re-renders.
   */
  uniqueRowId: number;

  /**
   * True if this row was created due to the previous row running out of columns to place text.
   * This is used when the user copies selected terminal text (e.g. Ctrl-Shift-C) to determine if new lines should be inserted into the
   * clipboard.
   */
  wasCreatedDueToWrapping = false;

  constructor(uniqueRowId: number, wasCreatedDueToWrapping: boolean) {
    this.terminalChars = [];
    this.uniqueRowId = uniqueRowId;
    this.wasCreatedDueToWrapping = wasCreatedDueToWrapping;
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
