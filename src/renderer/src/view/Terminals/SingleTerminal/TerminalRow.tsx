import { makeAutoObservable, observable, computed } from 'mobx';
import { ReactElement } from 'react';

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

  // Cache for memoized spans to avoid recreation on every render (internal use only)
  _spanCache: { spans: ReactElement[]; terminalCharsHash: string } | null = null;

  constructor(uniqueRowId: number, wasCreatedDueToWrapping: boolean) {
    this.terminalChars = [];
    this.uniqueRowId = uniqueRowId;
    this.wasCreatedDueToWrapping = wasCreatedDueToWrapping;
    
    makeAutoObservable(this, {
      terminalChars: observable.shallow, // Only observe array changes, not individual character changes
      text: computed,
      terminalCharsHash: computed,
      _spanCache: false, // Don't observe the cache - it's just an optimization
    });
  }

  /**
   * Returns the raw text of the row, by joining all the individual chars together
   * into a single string. Discards all other properties of a terminal char, such
   * as formatting.
   *
   * @returns The raw text of the row.
   */
  get text(): string {
    return this.terminalChars.map((terminalChar) => terminalChar.char).join('');
  }

  /**
   * Computed hash of terminal characters for memoization
   */
  get terminalCharsHash(): string {
    return this.terminalChars.map(char => `${char.char}:${char.className}`).join('|');
  }

  /**
   * Memoized span generation to avoid recreating spans on every render
   */
  getSpans(terminalId: string, cursorPosition: [number, number], terminalRowCursorIsOn: TerminalRow | null, styles: any): ReactElement[] {
    const currentHash = this.terminalCharsHash;
    const isCursorRow = this === terminalRowCursorIsOn;
    const cacheKey = `${currentHash}:${isCursorRow}:${cursorPosition[1]}`;
    
    // Return cached spans if nothing changed
    if (this._spanCache && this._spanCache.terminalCharsHash === cacheKey) {
      return this._spanCache.spans;
    }

    // Generate new spans
    const spans: ReactElement[] = [];
    let text = '';
    let prevClassName = '';

    for (let colIdx = 0; colIdx < this.terminalChars.length; colIdx += 1) {
      const terminalChar = this.terminalChars[colIdx];
      let thisCharsClassName = terminalChar.className;
      
      // Check if this is the cursor position
      if (isCursorRow && colIdx === cursorPosition[1]) {
        thisCharsClassName += ' ' + styles.cursorFocused;
      }

      if (colIdx === 0) {
        prevClassName = thisCharsClassName;
      }

      if (thisCharsClassName !== prevClassName) {
        // Class name has changed. Dump all existing text into a span
        spans.push(
          <span key={spans.length} className={prevClassName}>
            {text}
          </span>
        );
        text = '';
        prevClassName = thisCharsClassName;
      }

      text += terminalChar.char;
    }

    // Add the last span
    spans.push(
      <span key={spans.length} className={prevClassName}>
        {text}
      </span>
    );

    // Cache the result
    this._spanCache = {
      spans,
      terminalCharsHash: cacheKey
    };

    return spans;
  }

  /**
   * Legacy method for backward compatibility
   */
  getText(): string {
    return this.text;
  }
}
