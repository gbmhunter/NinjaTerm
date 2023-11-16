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

    singleTerminal.cursorDown(1);
    expect(singleTerminal.cursorPosition[0]).toBe(1);
    expect(singleTerminal.cursorPosition[1]).toBe(3);
    // We should have four spaces in the second row, the last one holding the
    // cursor
    expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(4);

    singleTerminal.cursorUp(1);
    expect(singleTerminal.cursorPosition[0]).toBe(0);
    expect(singleTerminal.cursorPosition[1]).toBe(3);
  });

  test('cursor up can\'t go above first row', () => {
    singleTerminal.cursorUp(1);
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
    expect(singleTerminal.filteredTerminalRows).toEqual([0]);
  });

  test('filtered terminal rows works with basic data', () => {
    singleTerminal.parseData(stringToUint8Array('123\n'));
    // We haven't provided any filter text, so both rows should have passed the filter
    expect(singleTerminal.filteredTerminalRows).toEqual([0, 1]);
  });
});
