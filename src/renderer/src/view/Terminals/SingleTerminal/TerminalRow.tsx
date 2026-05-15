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
   * Memoized span generation to avoid recreating spans on every render.
   *
   * `findRanges` highlights matched columns from the Find feature. Each entry
   * applies an extra class (`findMatch` for normal hits, `findMatchCurrent`
   * for the active hit).
   *
   * `highlightRanges` applies an inline background-color style on matched
   * chars from user-defined regex highlight rules. Inline style (rather
   * than CSS class) lets each rule carry an arbitrary user-picked color
   * without polluting the stylesheet. Find always wins on overlap — chars
   * inside a find range skip the highlight inline style so the find class
   * isn't visually masked.
   *
   * Passing both range arrays through this method (rather than wrapping
   * spans after generation) keeps the span-merging logic in one place and
   * lets it correctly split runs of identical ANSI styling at match
   * boundaries.
   */
  getSpans(
    terminalId: string,
    cursorPosition: [number, number],
    terminalRowCursorIsOn: TerminalRow | null,
    styles: any,
    findRanges: { colStart: number; colEnd: number; isCurrent: boolean }[] = [],
    highlightRanges: { colStart: number; colEnd: number; backgroundColor: string }[] = [],
  ): ReactElement[] {
    const currentHash = this.terminalCharsHash;
    const isCursorRow = this === terminalRowCursorIsOn;
    // Serialise both range arrays into the cache key so the cache
    // invalidates correctly. Per-row range counts are tiny so the string
    // build is cheap.
    const findKey = findRanges.length === 0
      ? ''
      : findRanges.map((r) => `${r.colStart}-${r.colEnd}-${r.isCurrent ? 'c' : 'n'}`).join(',');
    const highlightKey = highlightRanges.length === 0
      ? ''
      : highlightRanges.map((r) => `${r.colStart}-${r.colEnd}-${r.backgroundColor}`).join(',');
    const cacheKey = `${currentHash}:${isCursorRow}:${cursorPosition[1]}:${findKey}:${highlightKey}`;

    // Return cached spans if nothing changed
    if (this._spanCache && this._spanCache.terminalCharsHash === cacheKey) {
      return this._spanCache.spans;
    }

    const findClassForCol = (colIdx: number): string => {
      for (let i = 0; i < findRanges.length; i += 1) {
        const r = findRanges[i];
        if (colIdx >= r.colStart && colIdx < r.colEnd) {
          return r.isCurrent ? ' findMatchCurrent' : ' findMatch';
        }
      }
      return '';
    };

    // Later highlight ranges win on overlap (matches the iteration order of
    // rules in `RulesSettings.rules`, last-defined-wins).
    const highlightBgForCol = (colIdx: number): string => {
      let bg = '';
      for (let i = 0; i < highlightRanges.length; i += 1) {
        const r = highlightRanges[i];
        if (colIdx >= r.colStart && colIdx < r.colEnd) {
          bg = r.backgroundColor;
        }
      }
      return bg;
    };

    const isInFindRange = (colIdx: number): boolean => {
      for (let i = 0; i < findRanges.length; i += 1) {
        const r = findRanges[i];
        if (colIdx >= r.colStart && colIdx < r.colEnd) return true;
      }
      return false;
    };

    // Generate new spans. We also track an "effective inline background"
    // per char so we can split spans at background-color boundaries the
    // same way we already split at className boundaries.
    const spans: ReactElement[] = [];
    let text = '';
    let prevClassName = '';
    let prevBgColor = '';

    const flushSpan = () => {
      const style = prevBgColor === '' ? undefined : { backgroundColor: prevBgColor };
      spans.push(
        <span key={spans.length} className={prevClassName} style={style}>
          {text}
        </span>
      );
      text = '';
    };

    for (let colIdx = 0; colIdx < this.terminalChars.length; colIdx += 1) {
      const terminalChar = this.terminalChars[colIdx];
      let thisCharsClassName = terminalChar.className;

      // Check if this is the cursor position
      if (isCursorRow && colIdx === cursorPosition[1]) {
        thisCharsClassName += ' ' + styles.cursorFocused;
      }

      // Apply find-match highlight class (concatenated so it stacks with
      // ANSI color classes — see SingleTerminalView.css for the rules).
      thisCharsClassName += findClassForCol(colIdx);

      // Rule highlights paint an inline background unless this char is
      // also a find hit (in which case find wins and we suppress the bg).
      const thisCharsBgColor = isInFindRange(colIdx) ? '' : highlightBgForCol(colIdx);

      if (colIdx === 0) {
        prevClassName = thisCharsClassName;
        prevBgColor = thisCharsBgColor;
      }

      if (thisCharsClassName !== prevClassName || thisCharsBgColor !== prevBgColor) {
        flushSpan();
        prevClassName = thisCharsClassName;
        prevBgColor = thisCharsBgColor;
      }

      text += terminalChar.char;
    }

    // Add the last span
    flushSpan();

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
