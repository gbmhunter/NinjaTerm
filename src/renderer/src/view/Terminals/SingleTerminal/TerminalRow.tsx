import { ReactElement } from 'react';


/**
 * One run of identically-styled columns within a row.
 *
 * A run covers columns `[start, nextRun.start)` — or `[start, chars.length)`
 * for the last run. Runs are kept sorted ascending by `start`, with no two
 * adjacent runs sharing a `className` (see `_normalizeRuns`), so the run list
 * is typically 1-3 entries even for a heavily coloured row.
 */
export interface StyleRun {
  start: number;
  className: string;
}

/**
 * Represents a single row of characters in the terminal.
 *
 * Storage is "flat": a plain array of single-character strings plus a
 * run-length list of style spans, rather than one object per column. The
 * previous model allocated a `TerminalChar` (plus a `style` object, a class
 * list array and a joined class string) for every byte received, which put
 * ~5 allocations on the per-byte hot path and made `text` an O(row length)
 * `map().join()` on every read. See `performance-profiles/THROUGHPUT_BASELINES.md`.
 *
 * This class holds NO MobX state at all — it is plain data.
 *
 * That is deliberate and measured. The old model made the char array
 * `observable.shallow`, which meant one MobX change notification per received
 * byte; simply moving that notification to a `revision` counter kept the same
 * cost. Benchmarking showed the per-byte notification, not the allocations,
 * was the parse-path bottleneck — making `revision` a plain counter was worth
 * ~1.6x on parse throughput and ~3.4x on `row.text` scans.
 *
 * Change notification therefore lives one level up, on
 * `SingleTerminal.renderVersion`, which is bumped once per received chunk
 * rather than once per byte. A repaint can't happen more than once a frame
 * anyway, so per-byte granularity bought nothing. The `revision` counter here
 * remains as the (non-reactive) cache key for `text` and `getSpans`.
 *
 * The consequence to remember: mutating a row does NOT by itself schedule a
 * re-render. Anything that mutates rows must be reached from a path that
 * bumps `SingleTerminal.renderVersion` — in practice `parseData` or `clear`.
 */
export default class TerminalRow {
  /**
   * One entry per column, each a single-character string. V8 interns
   * single-character ASCII strings, so these cost no allocation.
   */
  chars: string[];

  /** Run-length style spans covering `chars`. See `StyleRun`. */
  styleRuns: StyleRun[];

  /**
   * Column index of the space that exists only to hold the cursor, or -1 if
   * this row has no such space. Replaces the old per-char `forCursor` flag —
   * at most one column per row is ever the cursor holder, and it is always
   * created by appending to the end of the row.
   */
  forCursorIdx: number;

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

  /**
   * Bumped by every mutator. Plain counter, NOT observable — see the class
   * comment. Used as the cache key for `text` and `getSpans`.
   *
   * It replaces the old `terminalCharsHash`, which built a
   * `char:className|...` string over the whole row every time the renderer
   * wanted to check whether its span cache was still valid — an O(row length)
   * string build per visible row per render, just to answer a yes/no question.
   */
  revision: number;

  // Cache for memoized spans to avoid recreation on every render (internal use only)
  _spanCache: { spans: ReactElement[]; cacheKey: string } | null = null;

  /** Cache backing the `text` getter, keyed on `revision`. */
  private _textCache: string = '';
  private _textCacheRevision: number = -1;

  constructor(uniqueRowId: number, wasCreatedDueToWrapping: boolean) {
    this.chars = [];
    this.styleRuns = [];
    this.forCursorIdx = -1;
    this.revision = 0;
    this.uniqueRowId = uniqueRowId;
    this.wasCreatedDueToWrapping = wasCreatedDueToWrapping;

    // Deliberately NOT `makeAutoObservable`. See the class comment: rows are
    // plain data, and `SingleTerminal.renderVersion` is the reactive signal
    // for their contents. Dropping MobX from this class also removes the
    // per-row `makeAutoObservable` setup cost, which was paid once per
    // received line.
  }

  /** Number of columns currently in this row. */
  get length(): number {
    return this.chars.length;
  }

  //======================================================================
  // READS
  //======================================================================

  /**
   * Returns the raw text of the row, by joining all the individual chars together
   * into a single string. Discards all other properties of a terminal char, such
   * as formatting.
   *
   * Cached against `revision` — the highlight-rule and find scans read this
   * for every row in the scrollback, so an uncached join would dominate the
   * render path.
   *
   * @returns The raw text of the row.
   */
  get text(): string {
    if (this._textCacheRevision !== this.revision) {
      this._textCache = this.chars.join('');
      this._textCacheRevision = this.revision;
    }
    return this._textCache;
  }

  /** The character at `col`, or `undefined` past the end of the row. */
  charAt(col: number): string | undefined {
    return this.chars[col];
  }

  /**
   * The CSS class string applying to `col`. Returns `''` for columns past the
   * end of the row.
   */
  classNameAt(col: number): string {
    const runIdx = this._runIndexFor(col);
    return runIdx === -1 ? '' : this.styleRuns[runIdx].className;
  }

  /**
   * True if `col` holds the space that exists only to carry the cursor.
   *
   * The `col >= 0` guard matters: `forCursorIdx` is -1 when the row has no
   * cursor holder, so a caller passing -1 (e.g. the last index of an empty
   * row) would otherwise get `true` back.
   */
  isForCursor(col: number): boolean {
    return col >= 0 && col === this.forCursorIdx;
  }

  //======================================================================
  // MUTATORS
  //
  // Every one of these bumps `revision`, which invalidates the caches above.
  // Note it does NOT notify any observer — see the class comment; that is
  // `SingleTerminal.renderVersion`'s job, once per chunk.
  //======================================================================

  /**
   * Appends a character to the end of the row.
   *
   * This is the hot path — one `push` plus one string comparison when the
   * style is unchanged from the previous column, which is the common case.
   *
   * @param char Single-character string to append.
   * @param className CSS classes applying to this column.
   * @param forCursor True if this char exists only to hold the cursor.
   */
  appendChar(char: string, className: string, forCursor: boolean = false) {
    const col = this.chars.length;
    this.chars.push(char);
    const runs = this.styleRuns;
    const lastRun = runs.length === 0 ? null : runs[runs.length - 1];
    if (lastRun === null || lastRun.className !== className) {
      runs.push({ start: col, className });
    }
    if (forCursor) {
      this.forCursorIdx = col;
    }
    this.revision += 1;
  }

  /**
   * Writes a character at `col`, replacing whatever was there. Appends if
   * `col` is exactly the end of the row.
   *
   * Overwriting the cursor-holder column clears its "for cursor" status — the
   * column now holds real received data. This matches the old behaviour, where
   * the write replaced the whole `TerminalChar` with a fresh one whose
   * `forCursor` defaulted to false.
   */
  setChar(col: number, char: string, className: string) {
    if (col === this.chars.length) {
      this.appendChar(char, className, false);
      return;
    }
    this.chars[col] = char;
    if (this.forCursorIdx === col) {
      this.forCursorIdx = -1;
    }
    this._setStyleAt(col, className);
    this.revision += 1;
  }

  /**
   * Turns the character at `col` into a space without touching its styling,
   * used by the "erase in display / erase in line" escape sequences. Keeping
   * the style is deliberate and matches the previous behaviour: an erase
   * leaves the cell's background colour in place.
   */
  eraseToSpace(col: number) {
    if (col < 0 || col >= this.chars.length) {
      return;
    }
    this.chars[col] = ' ';
    if (this.forCursorIdx === col) {
      this.forCursorIdx = -1;
    }
    this.revision += 1;
  }

  /** Removes every character from the row. */
  clearChars() {
    this.chars.length = 0;
    this.styleRuns.length = 0;
    this.forCursorIdx = -1;
    this.revision += 1;
  }

  /**
   * Removes `count` characters starting at `col`, shifting the style runs and
   * the cursor-holder index to match.
   */
  spliceChars(col: number, count: number) {
    if (count <= 0) {
      return;
    }
    this.chars.splice(col, count);

    const removedEnd = col + count;
    const runs = this.styleRuns;
    for (let i = 0; i < runs.length; i += 1) {
      if (runs[i].start >= removedEnd) {
        runs[i].start -= count;
      } else if (runs[i].start > col) {
        // Run started inside the removed range — collapse it onto the splice point.
        runs[i].start = col;
      }
    }

    if (this.forCursorIdx >= removedEnd) {
      this.forCursorIdx -= count;
    } else if (this.forCursorIdx >= col) {
      this.forCursorIdx = -1;
    }

    this._normalizeRuns();
    this.revision += 1;
  }

  /**
   * Clears the "exists only for the cursor" status of `col`, if it had it.
   * Called when the cursor moves off a column, at which point the space it
   * was sitting on becomes a real space.
   */
  clearForCursorAt(col: number) {
    if (this.forCursorIdx === col) {
      this.forCursorIdx = -1;
      this.revision += 1;
    }
  }

  //======================================================================
  // STYLE RUN INTERNALS
  //======================================================================

  /**
   * Index of the run covering `col`, or -1 if `col` is outside the row.
   *
   * Searches backwards because the overwhelmingly common query is for a
   * column at or near the end of the row, and rows carry very few runs.
   */
  private _runIndexFor(col: number): number {
    if (col < 0 || col >= this.chars.length || this.styleRuns.length === 0) {
      return -1;
    }
    const runs = this.styleRuns;
    for (let i = runs.length - 1; i >= 0; i -= 1) {
      if (runs[i].start <= col) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Applies `className` to exactly column `col`, splitting the run that
   * currently covers it if necessary.
   *
   * Only reached from `setChar` writing into the middle of an existing row,
   * which happens when an escape sequence has moved the cursor backwards or
   * to an absolute position — rare compared to appending.
   */
  private _setStyleAt(col: number, className: string) {
    const runs = this.styleRuns;
    const i = this._runIndexFor(col);
    if (i === -1) {
      // No run covers this column yet (e.g. the row was padded out without
      // styling). Start one here.
      runs.push({ start: col, className });
      this._normalizeRuns();
      return;
    }
    const run = runs[i];
    if (run.className === className) {
      return;
    }
    const runEnd = i + 1 < runs.length ? runs[i + 1].start : this.chars.length;

    if (run.start === col && runEnd === col + 1) {
      // The run covers exactly this column — retag it in place.
      run.className = className;
    } else if (run.start === col) {
      // Column is at the head of the run: shrink the run forward and insert before it.
      run.start = col + 1;
      runs.splice(i, 0, { start: col, className });
    } else if (runEnd === col + 1) {
      // Column is the last of the run: insert a new run after it.
      runs.splice(i + 1, 0, { start: col, className });
    } else {
      // Column is in the middle: split into three.
      runs.splice(
        i + 1,
        0,
        { start: col, className },
        { start: col + 1, className: run.className },
      );
    }
    this._normalizeRuns();
  }

  /**
   * Restores the invariants documented on `StyleRun`: sorted, every column
   * covered, no zero-width runs, and no two adjacent runs sharing a
   * `className`.
   *
   * Done in two explicit phases because `spliceChars` can collapse several
   * runs onto the same `start`, and collapsing those changes which classNames
   * end up adjacent — so the duplicate-start pass has to complete before the
   * merge pass can be correct. Run counts are tiny (typically 1-3), so two
   * passes cost nothing.
   */
  private _normalizeRuns() {
    const runs = this.styleRuns;
    if (this.chars.length === 0) {
      // Nothing to style. Leaving stale runs here would make `classNameAt`
      // and `getSpans` disagree about an empty row.
      runs.length = 0;
      return;
    }
    if (runs.length === 0) {
      return;
    }

    // Phase 1: drop runs that start past the end of the row, and collapse
    // runs sharing a start column down to the last one (which wins, since
    // it was applied most recently).
    const deduped: StyleRun[] = [];
    for (let i = 0; i < runs.length; i += 1) {
      const run = runs[i];
      if (run.start >= this.chars.length) {
        continue;
      }
      const prev = deduped.length === 0 ? null : deduped[deduped.length - 1];
      if (prev !== null && prev.start === run.start) {
        deduped[deduped.length - 1] = run;
      } else {
        deduped.push(run);
      }
    }

    // Phase 2: merge adjacent runs that now share a className.
    const merged: StyleRun[] = [];
    for (let i = 0; i < deduped.length; i += 1) {
      const run = deduped[i];
      const prev = merged.length === 0 ? null : merged[merged.length - 1];
      if (prev !== null && prev.className === run.className) {
        continue;
      }
      merged.push(run);
    }

    // The first run must start at column 0 so every column is covered.
    if (merged.length > 0 && merged[0].start > 0) {
      merged[0].start = 0;
    }
    this.styleRuns = merged;
  }

  //======================================================================
  // RENDERING
  //======================================================================

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
    styles: { cursorFocused: string },
    findRanges: { colStart: number; colEnd: number; isCurrent: boolean }[] = [],
    highlightRanges: { colStart: number; colEnd: number; backgroundColor: string }[] = [],
  ): ReactElement[] {
    const isCursorRow = this === terminalRowCursorIsOn;
    // Serialise both range arrays into the cache key so the cache
    // invalidates correctly. Per-row range counts are tiny so the string
    // build is cheap. `revision` stands in for the row's contents — the old
    // key hashed every char and class in the row on every call.
    const findKey = findRanges.length === 0
      ? ''
      : findRanges.map((r) => `${r.colStart}-${r.colEnd}-${r.isCurrent ? 'c' : 'n'}`).join(',');
    const highlightKey = highlightRanges.length === 0
      ? ''
      : highlightRanges.map((r) => `${r.colStart}-${r.colEnd}-${r.backgroundColor}`).join(',');
    const cacheKey = `${this.revision}:${isCursorRow}:${cursorPosition[1]}:${findKey}:${highlightKey}`;

    // Return cached spans if nothing changed
    if (this._spanCache && this._spanCache.cacheKey === cacheKey) {
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

    // Walk the style runs alongside the columns, so the per-column class
    // lookup is a bounds check rather than an object dereference.
    let runIdx = 0;
    for (let colIdx = 0; colIdx < this.chars.length; colIdx += 1) {
      while (runIdx + 1 < this.styleRuns.length && this.styleRuns[runIdx + 1].start <= colIdx) {
        runIdx += 1;
      }
      let thisCharsClassName = this.styleRuns.length === 0 ? '' : this.styleRuns[runIdx].className;

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

      text += this.chars[colIdx];
    }

    // Add the last span
    flushSpan();

    // Cache the result
    this._spanCache = {
      spans,
      cacheKey,
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
