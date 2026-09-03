import { expect, test, describe, beforeEach } from 'vitest';

import TerminalRow from './TerminalRow';

/**
 * Direct tests for the flat row storage model (`chars` + run-length
 * `styleRuns`) that replaced the old per-column object array.
 *
 * `SingleTerminal.spec.ts` covers this indirectly through the parser, but the
 * run-splitting and run-shifting logic has branches (write at the head / tail /
 * middle of a run, splice collapsing several runs onto one column) that are
 * hard to reach deliberately from byte input. They are tested here instead.
 *
 * The invariants asserted by `expectRunsAreNormalized` are the ones the rest
 * of the class relies on, so every mutating test re-checks them.
 */
describe('TerminalRow', () => {
  let row: TerminalRow;

  beforeEach(() => {
    row = new TerminalRow(0, false);
  });

  /** Asserts the documented `StyleRun` invariants hold. */
  function expectRunsAreNormalized(r: TerminalRow) {
    const runs = r.styleRuns;
    if (r.length === 0) {
      expect(runs).toHaveLength(0);
      return;
    }
    expect(runs.length).toBeGreaterThan(0);
    // Every column is covered: the first run starts at 0.
    expect(runs[0].start).toBe(0);
    for (let i = 1; i < runs.length; i += 1) {
      // Strictly ascending (no zero-width runs).
      expect(runs[i].start).toBeGreaterThan(runs[i - 1].start);
      // No adjacent duplicates.
      expect(runs[i].className).not.toBe(runs[i - 1].className);
      // Never past the end of the row.
      expect(runs[i].start).toBeLessThan(r.length);
    }
  }

  /** The className of every column, for comparing against expectations. */
  function classNames(r: TerminalRow): string[] {
    const out: string[] = [];
    for (let i = 0; i < r.length; i += 1) out.push(r.classNameAt(i));
    return out;
  }

  describe('appending', () => {
    test('appends characters and exposes them as text', () => {
      row.appendChar('a', 'rx');
      row.appendChar('b', 'rx');
      row.appendChar('c', 'rx');

      expect(row.length).toBe(3);
      expect(row.text).toBe('abc');
      expect(classNames(row)).toEqual(['rx', 'rx', 'rx']);
      expectRunsAreNormalized(row);
    });

    test('a run of identical styling collapses to a single run', () => {
      for (const ch of 'hello world') row.appendChar(ch, 'rx');

      expect(row.styleRuns).toHaveLength(1);
      expect(row.styleRuns[0]).toEqual({ start: 0, className: 'rx' });
    });

    test('a style change starts a new run at that column', () => {
      row.appendChar('a', 'rx');
      row.appendChar('b', 'rx f31');
      row.appendChar('c', 'rx f31');
      row.appendChar('d', 'rx');

      expect(row.styleRuns).toEqual([
        { start: 0, className: 'rx' },
        { start: 1, className: 'rx f31' },
        { start: 3, className: 'rx' },
      ]);
      expect(classNames(row)).toEqual(['rx', 'rx f31', 'rx f31', 'rx']);
      expectRunsAreNormalized(row);
    });

    test('records the cursor-holder column', () => {
      row.appendChar('a', 'rx');
      row.appendChar(' ', '', true);

      expect(row.isForCursor(0)).toBe(false);
      expect(row.isForCursor(1)).toBe(true);
    });

    test('isForCursor(-1) is false on a row with no cursor holder', () => {
      // Guards a real trap: `forCursorIdx` is -1 when unset, so an unguarded
      // `col === forCursorIdx` would answer true here.
      row.appendChar('a', 'rx');
      expect(row.isForCursor(-1)).toBe(false);
    });
  });

  describe('setChar', () => {
    beforeEach(() => {
      for (const ch of 'abcde') row.appendChar(ch, 'rx');
    });

    test('writing past the end appends', () => {
      row.setChar(5, 'f', 'rx');
      expect(row.text).toBe('abcdef');
      expectRunsAreNormalized(row);
    });

    test('overwriting a column with the same style leaves runs untouched', () => {
      row.setChar(2, 'X', 'rx');

      expect(row.text).toBe('abXde');
      expect(row.styleRuns).toHaveLength(1);
      expectRunsAreNormalized(row);
    });

    test('restyling the middle of a run splits it into three', () => {
      row.setChar(2, 'X', 'rx f31');

      expect(row.text).toBe('abXde');
      expect(classNames(row)).toEqual(['rx', 'rx', 'rx f31', 'rx', 'rx']);
      expect(row.styleRuns).toHaveLength(3);
      expectRunsAreNormalized(row);
    });

    test('restyling the head of a run inserts before it', () => {
      row.setChar(0, 'X', 'rx f31');

      expect(classNames(row)).toEqual(['rx f31', 'rx', 'rx', 'rx', 'rx']);
      expectRunsAreNormalized(row);
    });

    test('restyling the tail of a run inserts after it', () => {
      row.setChar(4, 'X', 'rx f31');

      expect(classNames(row)).toEqual(['rx', 'rx', 'rx', 'rx', 'rx f31']);
      expectRunsAreNormalized(row);
    });

    test('restyling a single-column run retags it in place and re-merges', () => {
      // Make column 2 its own run, then restyle it back to match its neighbours.
      row.setChar(2, 'X', 'rx f31');
      expect(row.styleRuns).toHaveLength(3);

      row.setChar(2, 'Y', 'rx');

      expect(classNames(row)).toEqual(['rx', 'rx', 'rx', 'rx', 'rx']);
      // The three runs must collapse back to one.
      expect(row.styleRuns).toHaveLength(1);
      expectRunsAreNormalized(row);
    });

    test('overwriting the cursor-holder column clears its cursor status', () => {
      row.appendChar(' ', 'rx', true);
      expect(row.isForCursor(5)).toBe(true);

      row.setChar(5, 'f', 'rx');

      expect(row.isForCursor(5)).toBe(false);
    });
  });

  describe('eraseToSpace', () => {
    test('blanks the character but keeps its styling', () => {
      // Deliberate: an erase leaves the cell's background colour in place,
      // matching the behaviour before the storage model changed.
      row.appendChar('a', 'rx b41');
      row.appendChar('b', 'rx b41');

      row.eraseToSpace(0);

      expect(row.text).toBe(' b');
      expect(row.classNameAt(0)).toBe('rx b41');
      expectRunsAreNormalized(row);
    });

    test('is a no-op outside the row', () => {
      row.appendChar('a', 'rx');
      row.eraseToSpace(-1);
      row.eraseToSpace(5);
      expect(row.text).toBe('a');
    });
  });

  describe('spliceChars', () => {
    test('removes characters and shifts later runs left', () => {
      for (const ch of 'abc') row.appendChar(ch, 'rx');
      for (const ch of 'def') row.appendChar(ch, 'rx f31');

      row.spliceChars(1, 2); // remove 'bc'

      expect(row.text).toBe('adef');
      expect(classNames(row)).toEqual(['rx', 'rx f31', 'rx f31', 'rx f31']);
      expectRunsAreNormalized(row);
    });

    test('collapsing several runs onto one column normalizes correctly', () => {
      // a=rx, b=f31, c=f32, d=f33, e=rx -> five runs.
      row.appendChar('a', 'rx');
      row.appendChar('b', 'f31');
      row.appendChar('c', 'f32');
      row.appendChar('d', 'f33');
      row.appendChar('e', 'rx');
      expect(row.styleRuns).toHaveLength(5);

      // Remove b, c and d. Their runs all collapse onto column 1, where the
      // last one written must win.
      row.spliceChars(1, 3);

      expect(row.text).toBe('ae');
      expect(classNames(row)).toEqual(['rx', 'rx']);
      // ...and then merge, because both columns ended up 'rx'.
      expect(row.styleRuns).toHaveLength(1);
      expectRunsAreNormalized(row);
    });

    test('shifts the cursor-holder index when it is after the cut', () => {
      for (const ch of 'abc') row.appendChar(ch, 'rx');
      row.appendChar(' ', 'rx', true);
      expect(row.isForCursor(3)).toBe(true);

      row.spliceChars(0, 2);

      expect(row.isForCursor(1)).toBe(true);
    });

    test('drops the cursor-holder index when it is inside the cut', () => {
      for (const ch of 'abc') row.appendChar(ch, 'rx');
      row.appendChar(' ', 'rx', true);

      row.spliceChars(2, 2);

      expect(row.text).toBe('ab');
      for (let i = 0; i < row.length; i += 1) expect(row.isForCursor(i)).toBe(false);
    });

    test('splicing the row empty clears the runs', () => {
      for (const ch of 'abc') row.appendChar(ch, 'rx');

      row.spliceChars(0, 3);

      expect(row.length).toBe(0);
      expect(row.text).toBe('');
      expectRunsAreNormalized(row);
    });

    test('a non-positive count is a no-op', () => {
      for (const ch of 'abc') row.appendChar(ch, 'rx');
      row.spliceChars(1, 0);
      expect(row.text).toBe('abc');
    });
  });

  describe('clearChars', () => {
    test('empties the row, its runs and its cursor holder', () => {
      row.appendChar('a', 'rx');
      row.appendChar(' ', 'rx', true);

      row.clearChars();

      expect(row.length).toBe(0);
      expect(row.text).toBe('');
      expect(row.styleRuns).toHaveLength(0);
      expect(row.isForCursor(0)).toBe(false);
      expect(row.chars).toHaveLength(0);
    });
  });

  describe('revision and caching', () => {
    test('every mutation bumps the revision', () => {
      const start = row.revision;
      row.appendChar('a', 'rx');
      expect(row.revision).toBeGreaterThan(start);

      const afterAppend = row.revision;
      row.setChar(0, 'b', 'rx');
      expect(row.revision).toBeGreaterThan(afterAppend);

      const afterSet = row.revision;
      row.eraseToSpace(0);
      expect(row.revision).toBeGreaterThan(afterSet);

      const afterErase = row.revision;
      row.spliceChars(0, 1);
      expect(row.revision).toBeGreaterThan(afterErase);
    });

    test('clearForCursorAt only bumps the revision when it changes something', () => {
      row.appendChar('a', 'rx');
      row.appendChar(' ', 'rx', true);

      const before = row.revision;
      row.clearForCursorAt(0); // column 0 is not the cursor holder
      expect(row.revision).toBe(before);

      row.clearForCursorAt(1);
      expect(row.revision).toBeGreaterThan(before);
      expect(row.isForCursor(1)).toBe(false);
    });

    test('text is recomputed after a mutation, not served stale from cache', () => {
      row.appendChar('a', 'rx');
      expect(row.text).toBe('a'); // populates the cache
      row.appendChar('b', 'rx');
      expect(row.text).toBe('ab');
    });

    test('charAt reflects a mutation immediately', () => {
      row.appendChar('a', 'rx');
      expect(row.charAt(0)).toBe('a');
      row.appendChar('b', 'rx f31');
      expect(row.charAt(1)).toBe('b');
      expect(row.classNameAt(1)).toBe('rx f31');
    });
  });

  describe('per-column accessors', () => {
    test('report char, className and cursor status for every column', () => {
      row.appendChar('a', 'rx');
      row.appendChar('b', 'rx f31');
      row.appendChar(' ', 'rx f31', true);

      expect(row.length).toBe(3);
      expect(row.charAt(0)).toBe('a');
      expect(row.classNameAt(0)).toBe('rx');
      expect(row.isForCursor(0)).toBe(false);
      expect(row.charAt(1)).toBe('b');
      expect(row.classNameAt(1)).toBe('rx f31');
      expect(row.isForCursor(2)).toBe(true);
    });

    test('charAt agrees with the backing chars array and with text', () => {
      row.appendChar('a', 'rx');
      row.appendChar('b', 'f31');
      row.appendChar('c', 'f31');
      row.appendChar('d', 'f32');
      row.appendChar('e', 'rx');

      for (let i = 0; i < row.length; i += 1) {
        expect(row.charAt(i)).toBe(row.chars[i]);
        expect(row.charAt(i)).toBe(row.text[i]);
      }
      expect(row.text).toBe('abcde');
    });

    test('charAt returns undefined past the end of the row', () => {
      row.appendChar('a', 'rx');
      expect(row.charAt(1)).toBeUndefined();
      expect(row.classNameAt(1)).toBe('');
    });
  });

  describe('getSpans', () => {
    const STYLES = { cursorFocused: 'cursorFocused' };

    test('emits one span per style run', () => {
      row.appendChar('a', 'rx');
      row.appendChar('b', 'rx');
      row.appendChar('c', 'f31');

      const spans = row.getSpans('t', [0, 0], null, STYLES);

      expect(spans).toHaveLength(2);
      expect(spans[0].props.className).toBe('rx');
      expect(spans[0].props.children).toBe('ab');
      expect(spans[1].props.className).toBe('f31');
      expect(spans[1].props.children).toBe('c');
    });

    test('returns the identical cached array when nothing changed', () => {
      row.appendChar('a', 'rx');

      const first = row.getSpans('t', [0, 0], null, STYLES);
      const second = row.getSpans('t', [0, 0], null, STYLES);

      expect(second).toBe(first);
    });

    test('invalidates the cache when the row changes', () => {
      row.appendChar('a', 'rx');
      const first = row.getSpans('t', [0, 0], null, STYLES);

      row.appendChar('b', 'rx');
      const second = row.getSpans('t', [0, 0], null, STYLES);

      expect(second).not.toBe(first);
      expect(second[0].props.children).toBe('ab');
    });

    test('splits a span at the cursor column on the cursor row', () => {
      for (const ch of 'abc') row.appendChar(ch, 'rx');

      const spans = row.getSpans('t', [0, 1], row, STYLES);

      // 'a' | 'b' (cursor) | 'c'
      expect(spans).toHaveLength(3);
      expect(spans[1].props.className).toBe('rx cursorFocused');
      expect(spans[1].props.children).toBe('b');
    });

    test('applies find-match classes and highlight backgrounds', () => {
      for (const ch of 'abcd') row.appendChar(ch, 'rx');

      const spans = row.getSpans(
        't',
        [0, 0],
        null,
        STYLES,
        [{ colStart: 0, colEnd: 1, isCurrent: true }],
        [{ colStart: 2, colEnd: 4, backgroundColor: '#ff0000' }],
      );

      expect(spans[0].props.className).toBe('rx findMatchCurrent');
      const highlighted = spans[spans.length - 1];
      expect(highlighted.props.style).toEqual({ backgroundColor: '#ff0000' });
      expect(highlighted.props.children).toBe('cd');
    });

    test('find wins over a highlight background on overlapping columns', () => {
      for (const ch of 'ab') row.appendChar(ch, 'rx');

      const spans = row.getSpans(
        't',
        [0, 0],
        null,
        STYLES,
        [{ colStart: 0, colEnd: 1, isCurrent: false }],
        [{ colStart: 0, colEnd: 2, backgroundColor: '#ff0000' }],
      );

      // Column 0 is in both ranges — it must take the find class and NOT the
      // inline highlight background, otherwise the find hit is visually masked.
      expect(spans[0].props.className).toBe('rx findMatch');
      expect(spans[0].props.style).toBeUndefined();
    });
  });
});
