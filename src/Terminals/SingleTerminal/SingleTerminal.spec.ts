import { expect, test, describe, beforeEach } from 'vitest';

import { stringToUint8Array } from 'src/Util/Util';
import SingleTerminal from './SingleTerminal';
import DataProcessingSettings, {
  NewLineCursorBehaviors,
  NonVisibleCharDisplayBehaviors,
} from 'src/Settings/DataProcessingSettings';
import DisplaySettings from 'src/Settings/Display/DisplaySettings';
import exp from 'constants';

describe('single terminal tests', () => {
  let dataProcessingSettings: DataProcessingSettings;
  let displaySettings: DisplaySettings;
  let singleTerminal: SingleTerminal;
  beforeEach(async () => {
    dataProcessingSettings = new DataProcessingSettings();
    displaySettings = new DisplaySettings();
    singleTerminal = new SingleTerminal(
      true,
      dataProcessingSettings,
      displaySettings,
      null
    );
  });

  test('cursor down works', () => {
    singleTerminal.parseData(stringToUint8Array('123'));
    expect(singleTerminal.cursorPosition[0]).toBe(0);
    expect(singleTerminal.cursorPosition[1]).toBe(3);

    singleTerminal._cursorDown(1);
    expect(singleTerminal.cursorPosition[0]).toBe(1);
    expect(singleTerminal.cursorPosition[1]).toBe(3);
    // We should have four spaces in the second row, the last one holding the
    // cursor
    expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(4);

    singleTerminal._cursorUp(1);
    expect(singleTerminal.cursorPosition[0]).toBe(0);
    expect(singleTerminal.cursorPosition[1]).toBe(3);
  });

  test('cursor up can\'t go above first row', () => {
    singleTerminal._cursorUp(1);
    expect(singleTerminal.cursorPosition[0]).toBe(0);
    expect(singleTerminal.cursorPosition[0]).toBe(0);
  });

  test('new line printing occurs before cursor is moved', () => {
    // Disable swallowing of new line
    dataProcessingSettings.setSwallowNewLine(false);
    dataProcessingSettings.setNonVisibleCharDisplayBehavior(
      NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS
    );

    singleTerminal.parseData(stringToUint8Array('123\n'));

    // Check cursor is in correct place
    expect(singleTerminal.cursorPosition[0]).toBe(1);
    expect(singleTerminal.cursorPosition[1]).toBe(0);

    // Check num. rows
    expect(singleTerminal.terminalRows.length).toBe(2);

    // Check 1st row
    expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(4);
    expect(singleTerminal.terminalRows[0].terminalChars[0].char).toBe('1');
    expect(singleTerminal.terminalRows[0].terminalChars[1].char).toBe('2');
    expect(singleTerminal.terminalRows[0].terminalChars[2].char).toBe('3');
    expect(singleTerminal.terminalRows[0].terminalChars[3].char).toBe(
      String.fromCharCode('\n'.charCodeAt(0) + 0xe000)
    );

    // Check 2nd row
    expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(1);
    expect(singleTerminal.terminalRows[1].terminalChars[0].char).toBe(' ');
  });

  test('hex glyphs are rendered correctly', () => {
    // Disable swallowing of new line
    dataProcessingSettings.setSwallowNewLine(false);
    dataProcessingSettings.setNonVisibleCharDisplayBehavior(
      NonVisibleCharDisplayBehaviors.HEX_GLYPHS
    );

    singleTerminal.parseData(stringToUint8Array('123\n'));

    // Check cursor is in correct place
    expect(singleTerminal.cursorPosition[0]).toBe(1);
    expect(singleTerminal.cursorPosition[1]).toBe(0);

    // Check num. rows
    expect(singleTerminal.terminalRows.length).toBe(2);

    // Check 1st row
    expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(4);
    expect(singleTerminal.terminalRows[0].terminalChars[0].char).toBe('1');
    expect(singleTerminal.terminalRows[0].terminalChars[1].char).toBe('2');
    expect(singleTerminal.terminalRows[0].terminalChars[2].char).toBe('3');
    expect(singleTerminal.terminalRows[0].terminalChars[3].char).toBe(
      String.fromCharCode('\n'.charCodeAt(0) + 0xe100)
    );

    // Check 2nd row
    expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(1);
    expect(singleTerminal.terminalRows[1].terminalChars[0].char).toBe(' ');
  });

  test('disabling new line parsing works', () => {
    // Disable swallowing of new line
    dataProcessingSettings.setSwallowNewLine(false);
    dataProcessingSettings.setNewLineCursorBehavior(
      NewLineCursorBehaviors.DO_NOTHING
    );
    dataProcessingSettings.setNonVisibleCharDisplayBehavior(
      NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS
    );

    singleTerminal.parseData(stringToUint8Array('123\n'));

    // Cursor should have NOT moved down a line, since we have disabled
    // any cursor movement on new line
    expect(singleTerminal.cursorPosition[0]).toBe(0);
    expect(singleTerminal.cursorPosition[1]).toBe(4);

    // Check num. rows
    expect(singleTerminal.terminalRows.length).toBe(1);

    // Check 1st row
    expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(5);
    expect(singleTerminal.terminalRows[0].terminalChars[0].char).toBe('1');
    expect(singleTerminal.terminalRows[0].terminalChars[1].char).toBe('2');
    expect(singleTerminal.terminalRows[0].terminalChars[2].char).toBe('3');
    expect(singleTerminal.terminalRows[0].terminalChars[3].char).toBe(
      String.fromCharCode('\n'.charCodeAt(0) + 0xe000)
    );
    expect(singleTerminal.terminalRows[0].terminalChars[4].char).toBe(' ');
  });

  test('filtered terminal rows setup correctly', () => {
    // With no text yet received, we should just have the cursor on the first and only row. This should not be filtered.
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0]);
  });

  test('filtered terminal rows works with basic data', () => {
    singleTerminal.parseData(stringToUint8Array('123\n'));
    // We haven't provided any filter text, so both rows should have passed the filter
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0, 1]);
  });

  test('filter text "1" works', () => {
    singleTerminal.setFilterText('1');
    // No data yet, even though this empty row won't match "1", it should still be included
    // because the cursor is on it
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0]);
    singleTerminal.parseData(stringToUint8Array('1\n'));
    // First row contains "1", so should pass filter, second row contains cursor, so
    // should also pass filter
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0, 1]);

    singleTerminal.parseData(stringToUint8Array('2\n'));
    // 2nd row containing "2" should not pass filter
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0, 2]);

    singleTerminal.parseData(stringToUint8Array('3\n'));
    // 2nd row containing "2" should not pass filter
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0, 3]);
  });

  test('changing the filter text after data is present works', () => {
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0]);
    singleTerminal.parseData(stringToUint8Array('1\n2\n3\n'));

    // All rows should pass filter
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0, 1, 2, 3]);

    singleTerminal.setFilterText('1');
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0, 3]);

    singleTerminal.setFilterText('2');
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([1, 3]);

    singleTerminal.setFilterText('3');
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([2, 3]);

    // There is no "4" in the data, so just the cursor row should be shown
    singleTerminal.setFilterText('4');
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([3]);
  });

  test('clearing the filter should work', () => {
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0]);
    singleTerminal.parseData(stringToUint8Array('1\n2\n3\n'));

    // All rows should pass filter
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0, 1, 2, 3]);

    singleTerminal.setFilterText('1');
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0, 3]);

    // Clearing the filter should restore all rows
    singleTerminal.setFilterText('');
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0, 1, 2, 3]);
  });

  test('filter should work with cursor up escape code', () => {
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0]);

    singleTerminal.setFilterText('1');

    // 1A go up one, puts the cursor at the end of the first row
    singleTerminal.parseData(stringToUint8Array('row1\nrow2\x1B[1A'));

    // Second row should not pass the filter! The cursor is no longer on this
    // row and does not match the filter text
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0]);

    singleTerminal.setFilterText('');

    // All rows should now pass filter
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0, 1]);
  });

  test('filter should work with clear escape code', () => {
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0]);

    // singleTerminal.setFilterText('');

    // 2D go back 2, 1A go up 1, J clear to end of screen
    //
    singleTerminal.parseData(stringToUint8Array('row1\nrow2\x1B[2D\x1B[1A\x1B[J'));

    // Should be left with a single row in the terminal with the text "ro" and
    // the cursor 1 right of the "o"
    expect(singleTerminal.filteredTerminalRowIndexes).toEqual([0]);
  });
});
