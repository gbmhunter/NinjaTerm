import { expect, test, describe, beforeEach } from 'vitest';

import { stringToUint8Array } from 'src/model/Util/Util';
import { DataDirection, SingleTerminal } from './SingleTerminal';
import RxSettings from 'src/model/Settings/RxSettings/RxSettings';
import DisplaySettings from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { App } from 'src/model/App';
import SnackbarController from 'src/model/SnackbarController/SnackbarController';
import { FilterController } from 'src/model/Terminals/Filters/FilterController';

describe('find-in-scrollback', () => {
  let terminal: SingleTerminal;
  let filterController: FilterController;

  beforeEach(() => {
    window.localStorage.clear();
    const app = new App();
    const profileManager = new AppDataManager(app);
    const rxSettings = new RxSettings(profileManager);
    const displaySettings = new DisplaySettings(profileManager);
    const snackbar = new SnackbarController();
    filterController = new FilterController(profileManager);
    terminal = new SingleTerminal('test-find', true, rxSettings, displaySettings, snackbar, null, null, null, filterController);
    terminal.setTerminalViewHeightPx(100);
  });

  test('returns no matches when find is closed', () => {
    terminal.parseData(stringToUint8Array('hello world\n'), DataDirection.RX);
    terminal.setFindQuery('hello');
    expect(terminal.findMatches).toEqual([]);
  });

  test('returns no matches for empty query', () => {
    terminal.parseData(stringToUint8Array('hello world\n'), DataDirection.RX);
    terminal.openFind();
    expect(terminal.findMatches).toEqual([]);
  });

  test('finds a single match', () => {
    terminal.parseData(stringToUint8Array('hello world\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('world');
    expect(terminal.findMatches.length).toBe(1);
    expect(terminal.findMatches[0].rowIndex).toBe(0);
    expect(terminal.findMatches[0].colStart).toBe(6);
    expect(terminal.findMatches[0].colEnd).toBe(11);
  });

  test('finds multiple matches across rows', () => {
    terminal.parseData(stringToUint8Array('foo bar\nfoo baz\nbar baz\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('foo');
    const matches = terminal.findMatches;
    expect(matches.length).toBe(2);
    expect(matches[0].rowIndex).toBe(0);
    expect(matches[1].rowIndex).toBe(1);
  });

  test('finds multiple matches within the same row', () => {
    terminal.parseData(stringToUint8Array('abc abc abc\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('abc');
    expect(terminal.findMatches.length).toBe(3);
    expect(terminal.findMatches.map((m) => m.colStart)).toEqual([0, 4, 8]);
  });

  test('case-insensitive matching by default', () => {
    terminal.parseData(stringToUint8Array('Hello HELLO hello\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('hello');
    expect(terminal.findMatches.length).toBe(3);
  });

  test('case-sensitive matching when enabled', () => {
    terminal.parseData(stringToUint8Array('Hello HELLO hello\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindCaseSensitive(true);
    terminal.setFindQuery('hello');
    expect(terminal.findMatches.length).toBe(1);
    expect(terminal.findMatches[0].colStart).toBe(12);
  });

  test('nextMatch advances and wraps', () => {
    terminal.parseData(stringToUint8Array('one\ntwo\nthree\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('o'); // matches: row 0 col 0, row 1 col 2
    expect(terminal.findMatches.length).toBeGreaterThanOrEqual(2);
    expect(terminal.currentMatchIndex).toBe(0);
    terminal.nextMatch();
    expect(terminal.currentMatchIndex).toBe(1);
    // Wrap back to 0 after walking to the end.
    const total = terminal.findMatches.length;
    for (let i = 0; i < total - 1; i += 1) {
      terminal.nextMatch();
    }
    expect(terminal.currentMatchIndex).toBe(0);
  });

  test('prevMatch wraps from start to end', () => {
    terminal.parseData(stringToUint8Array('one two three\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('e');
    const total = terminal.findMatches.length;
    expect(total).toBeGreaterThan(1);
    expect(terminal.currentMatchIndex).toBe(0);
    terminal.prevMatch();
    expect(terminal.currentMatchIndex).toBe(total - 1);
  });

  test('nextMatch / prevMatch are no-ops with zero matches', () => {
    terminal.parseData(stringToUint8Array('hello\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('zzz');
    expect(terminal.findMatches.length).toBe(0);
    terminal.nextMatch();
    expect(terminal.currentMatchIndex).toBe(0);
    terminal.prevMatch();
    expect(terminal.currentMatchIndex).toBe(0);
  });

  test('currentMatch returns null when no matches', () => {
    terminal.parseData(stringToUint8Array('hello\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('zzz');
    expect(terminal.currentMatch).toBeNull();
  });

  test('currentMatch returns the indexed match', () => {
    terminal.parseData(stringToUint8Array('abc abc abc\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('abc');
    expect(terminal.currentMatch?.colStart).toBe(0);
    terminal.nextMatch();
    expect(terminal.currentMatch?.colStart).toBe(4);
    terminal.nextMatch();
    expect(terminal.currentMatch?.colStart).toBe(8);
  });

  test('changing query resets currentMatchIndex to 0', () => {
    terminal.parseData(stringToUint8Array('foo foo foo\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('foo');
    terminal.nextMatch();
    terminal.nextMatch();
    expect(terminal.currentMatchIndex).toBe(2);
    terminal.setFindQuery('foo'); // setting same query still resets — that's the contract
    expect(terminal.currentMatchIndex).toBe(0);
  });

  test('closeFind clears the query', () => {
    terminal.parseData(stringToUint8Array('hello\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('hello');
    expect(terminal.findMatches.length).toBe(1);
    terminal.closeFind();
    expect(terminal.isFindOpen).toBe(false);
    expect(terminal.findQuery).toBe('');
    expect(terminal.findMatches).toEqual([]);
  });

  test('findMatchesByRow groups matches by row index', () => {
    terminal.parseData(stringToUint8Array('foo\nbar foo\nbaz\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('foo');
    const byRow = terminal.findMatchesByRow;
    expect(byRow.get(0)?.length).toBe(1);
    expect(byRow.get(1)?.length).toBe(1);
    expect(byRow.has(2)).toBe(false);
  });

  test('find searches within filtered rows only', () => {
    terminal.parseData(stringToUint8Array('apple\nbanana\napricot\n'), DataDirection.RX);
    // Add a single filter 'ap' -> filters to apple, apricot (cursor row also included)
    filterController.addFilter();
    filterController.filters[0].setPattern('ap');
    terminal.openFind();
    terminal.setFindQuery('a');
    // All matches should fall within filteredTerminalRows; rowIndex must be a
    // valid index into filteredTerminalRows.
    for (const m of terminal.findMatches) {
      expect(m.rowIndex).toBeGreaterThanOrEqual(0);
      expect(m.rowIndex).toBeLessThan(terminal.filteredTerminalRows.length);
    }
    // The banana row is filtered out, so no match can point to it.
    const bananaRowIdx = terminal.filteredTerminalRows.findIndex((r) => r.text.startsWith('banana'));
    expect(bananaRowIdx).toBe(-1);
  });

  test('regex mode finds every match of a pattern', () => {
    terminal.parseData(stringToUint8Array('err1 err22\nok\nerr333\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindUseRegex(true);
    terminal.setFindQuery('err\\d+');
    expect(terminal.findMatches).toEqual([
      { rowIndex: 0, colStart: 0, colEnd: 4 },
      { rowIndex: 0, colStart: 5, colEnd: 10 },
      { rowIndex: 2, colStart: 0, colEnd: 6 },
    ]);
  });

  test('regex mode honours the case-sensitivity toggle', () => {
    terminal.parseData(stringToUint8Array('Error error ERROR\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindUseRegex(true);
    terminal.setFindQuery('error');
    expect(terminal.findMatches.length).toBe(3);
    terminal.setFindCaseSensitive(true);
    expect(terminal.findMatches).toEqual([{ rowIndex: 0, colStart: 6, colEnd: 11 }]);
  });

  test('an invalid regex yields no matches and an error message rather than throwing', () => {
    terminal.parseData(stringToUint8Array('hello\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindUseRegex(true);
    terminal.setFindQuery('[unclosed');
    expect(terminal.findMatches).toEqual([]);
    expect(terminal.findRegex.errorMsg).not.toBe('');
    // Back in substring mode the same text is a literal that simply doesn't occur.
    terminal.setFindUseRegex(false);
    expect(terminal.findRegex.errorMsg).toBe('');
    expect(terminal.findMatches).toEqual([]);
  });

  test('zero-width regex matches neither hang nor get reported', () => {
    terminal.parseData(stringToUint8Array('abc\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindUseRegex(true);
    terminal.setFindQuery('x*');
    expect(terminal.findMatches).toEqual([]);
    terminal.setFindQuery('b*');
    expect(terminal.findMatches).toEqual([{ rowIndex: 0, colStart: 1, colEnd: 2 }]);
  });

  test('toggling regex mode resets the current match to the first', () => {
    terminal.parseData(stringToUint8Array('aa aa aa\n'), DataDirection.RX);
    terminal.openFind();
    terminal.setFindQuery('aa');
    terminal.nextMatch();
    expect(terminal.currentMatchIndex).toBe(1);
    terminal.setFindUseRegex(true);
    expect(terminal.currentMatchIndex).toBe(0);
  });
});
