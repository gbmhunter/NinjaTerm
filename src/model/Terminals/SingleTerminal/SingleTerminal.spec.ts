import { expect, test, describe, beforeEach } from 'vitest';

import { stringToUint8Array } from 'src/model/Util/Util';
import SingleTerminal from './SingleTerminal';
import RxSettings, {
  NewLineCursorBehavior,
  NonVisibleCharDisplayBehaviors,
} from 'src/model/Settings/RxSettings/RxSettings';
import DisplaySettings, { TerminalHeightMode } from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { App } from 'src/model/App';
import SnackbarController from 'src/model/SnackbarController/SnackbarController';

describe('single terminal tests', () => {
  let app: App;
  let profileManager: AppDataManager;
  let dataProcessingSettings: RxSettings;
  let displaySettings: DisplaySettings;
  let snackbarController: SnackbarController;
  let singleTerminal: SingleTerminal;
  beforeEach(async () => {
    // Tests leave app data in local storage, but each test expects to start with
    // a clean slate (so settings will go to their defaults). Clear local storage before each test.
    window.localStorage.clear();
    app = new App();
    profileManager = new AppDataManager(app);
    dataProcessingSettings = new RxSettings(profileManager);
    displaySettings = new DisplaySettings(profileManager);
    snackbarController = new SnackbarController();
    singleTerminal = new SingleTerminal(
      'test-terminal',
      true,
      dataProcessingSettings,
      displaySettings,
      snackbarController,
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

  test('length of terminal rows limited to terminal height + scrollback', () => {
    // Change height mode to fixed at set height to 2 rows/chars
    displaySettings.setTerminalHeightMode(TerminalHeightMode.FIXED_HEIGHT);
    displaySettings.terminalHeightChars.setDispValue('2');
    displaySettings.terminalHeightChars.apply();
    // Set scrollback buffer size to 1 row
    displaySettings.scrollbackBufferSizeRows.setDispValue('1');
    displaySettings.scrollbackBufferSizeRows.apply();

    singleTerminal.parseData(stringToUint8Array('row1\nrow2\nrow3'));
    expect(singleTerminal.terminalRows.length).toBe(3);

    // Add another row, total length should still be 3
    singleTerminal.parseData(stringToUint8Array('row4\n'));
    expect(singleTerminal.terminalRows.length).toBe(3);
  });

  test('cursor up can\'t go into scrollback', () => {
    // Change height mode to fixed at set height to 2 rows/chars
    displaySettings.setTerminalHeightMode(TerminalHeightMode.FIXED_HEIGHT);
    displaySettings.terminalHeightChars.setDispValue('2');
    displaySettings.terminalHeightChars.apply();
    // Set scrollback buffer size to 1 row
    displaySettings.scrollbackBufferSizeRows.setDispValue('1');
    displaySettings.scrollbackBufferSizeRows.apply();

    singleTerminal.parseData(stringToUint8Array('row1\nrow2\nrow3'));
    expect(singleTerminal.cursorPosition[0]).toBe(2);

    // Move cursor up 1 row
    singleTerminal._cursorUp(1);
    expect(singleTerminal.cursorPosition[0]).toBe(1);

    // Move cursor up 1 row again, should not move the cursor
    // as the first row is scrollback
    singleTerminal._cursorUp(1);
    expect(singleTerminal.cursorPosition[0]).toBe(1);
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
      NewLineCursorBehavior.DO_NOTHING
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

  test('wrapping flag set correctly', () => {
    displaySettings.terminalWidthChars.setDispValue('5');
    displaySettings.terminalWidthChars.apply();
    singleTerminal.parseData(stringToUint8Array('0123401234'));

    // Check num. rows
    expect(singleTerminal.terminalRows.length).toBe(3);

    // Check 1st row
    expect(singleTerminal.terminalRows[0].wasCreatedDueToWrapping).toBe(false);
    expect(singleTerminal.terminalRows[1].wasCreatedDueToWrapping).toBe(true);
  });


  describe('escape code tests', () => {
    test('clear() clears colour styles', () => {
      singleTerminal.parseData(stringToUint8Array('\x1B[31mred'));
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(4); // "red" + cursor
      for (let i = 0; i < 3; i++) {
        expect(singleTerminal.terminalRows[0].terminalChars[i].className).toBe('f31');
      }
      singleTerminal.clear();
      singleTerminal.parseData(stringToUint8Array('default'));
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(8); // "default" + cursor
      // We expect the class name to be an empty string now, as we have called clear()
      for (let i = 0; i < 7; i++) {
        expect(singleTerminal.terminalRows[0].terminalChars[i].className).toBe('');
      }
    });
  });

  describe('filtering tests', () => {
    test('filtered terminal rows setup correctly', () => {
      // With no text yet received, we should just have the cursor on the first and only row. This should not be filtered.
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    });

    test('filtered terminal rows works with basic data', () => {
      singleTerminal.parseData(stringToUint8Array('123\n'));
      // We haven't provided any filter text, so both rows should have passed the filter
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    });

    test('filter text "1" works', () => {
      singleTerminal.setFilterText('1');
      // No data yet, even though this empty row won't match "1", it should still be included
      // because the cursor is on it
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
      singleTerminal.parseData(stringToUint8Array('1\n'));
      // First row contains "1", so should pass filter, second row contains cursor, so
      // should also pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);

      singleTerminal.parseData(stringToUint8Array('2\n'));
      // 2nd row containing "2" should not pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[0], singleTerminal.terminalRows[2] ]
      );

      singleTerminal.parseData(stringToUint8Array('3\n'));
      // 2nd row containing "2" should not pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[0], singleTerminal.terminalRows[3] ]
      );
    });

    test('changing the filter text after data is present works', () => {
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
      singleTerminal.parseData(stringToUint8Array('1\n2\n3\n'));

      // All rows should pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);

      singleTerminal.setFilterText('1');
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[0], singleTerminal.terminalRows[3] ]
      );

      singleTerminal.setFilterText('2');
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[1], singleTerminal.terminalRows[3] ]
      );

      singleTerminal.setFilterText('3');
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[2], singleTerminal.terminalRows[3] ]
      );

      // There is no "4" in the data, so just the cursor row should be shown
      singleTerminal.setFilterText('4');
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[3] ]
      );
    });

    test('clearing the filter should work', () => {
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
      singleTerminal.parseData(stringToUint8Array('1\n2\n3\n'));

      // All rows should pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);

      singleTerminal.setFilterText('1');
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[0], singleTerminal.terminalRows[3] ]
      );

      // Clearing the filter should restore all rows
      singleTerminal.setFilterText('');
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    });

    test('filter should work with cursor up escape code', () => {
      singleTerminal.setFilterText('1');

      // 1A: go up one, puts the cursor at the end of the first row
      singleTerminal.parseData(stringToUint8Array('row1\nrow2\x1B[1A'));

      // Second row should not pass the filter! The cursor is no longer on this
      // row and does not match the filter text
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[0] ]
      );

      singleTerminal.setFilterText('');

      // All rows should now pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    });

    test('filter should work with erase in display escape code', () => {
      // 2D go back 2, 1A go up 1, J clear to end of screen
      //
      singleTerminal.parseData(stringToUint8Array('row1\nrow2\x1B[2D\x1B[1A\x1B[J'));

      // Should be left with a single row in the terminal with the text "ro" and
      // the cursor 1 right of the "o"
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    });

    test('filter should work with scrollback buffer size of 1', () => {
      // Set a scrollback buffer of just 1 row
      displaySettings.scrollbackBufferSizeRows.setDispValue('1');
      displaySettings.scrollbackBufferSizeRows.apply();

      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);

      singleTerminal.parseData(stringToUint8Array('row1\n'));

      // We should only have 1 row, which is empty and has the cursor in it
      expect(singleTerminal.terminalRows.length).toBe(1);
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    });

    test('filter should work with scrollback buffer size of 3', () => {
      // Set a scrollback buffer of just 1 row
      displaySettings.scrollbackBufferSizeRows.setDispValue('3');
      displaySettings.scrollbackBufferSizeRows.apply();

      singleTerminal.parseData(stringToUint8Array('row1\nrow2\n'));

      expect(singleTerminal.terminalRows.length).toBe(3);
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);

      singleTerminal.setFilterText('row1');

      expect(singleTerminal.filteredTerminalRows).toEqual([
        singleTerminal.terminalRows[0], singleTerminal.terminalRows[2]
      ]);

      singleTerminal.parseData(stringToUint8Array('row3\n'));

      expect(singleTerminal.filteredTerminalRows).toEqual([
        singleTerminal.terminalRows[2]
      ]);
    });
  });

  describe('scrolling', () => {
    test('scrolllock reenabled on clear', () => {
      // Scrolllock should default to enabled
      expect(singleTerminal.scrollLock).toBe(true);

      singleTerminal.setScrollLock(false);
      expect(singleTerminal.scrollLock).toBe(false);

      singleTerminal.clear();
      expect(singleTerminal.scrollLock).toBe(true);
    });
  });
});
