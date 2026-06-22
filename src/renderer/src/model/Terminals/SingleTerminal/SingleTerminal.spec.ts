import { expect, test, describe, beforeEach } from 'vitest';

import { stringToUint8Array } from 'src/model/Util/Util';
import { DataDirection, SingleTerminal, START_OF_HEX_GLYPHS } from './SingleTerminal';
import RxSettings, {
  BackspaceBehavior,
  FormFeedBehavior,
  NewLineCursorBehavior,
  NonVisibleCharDisplayBehaviors,
  TimestampFormat,
} from 'src/model/Settings/RxSettings/RxSettings';
import DisplaySettings, { TerminalHeightMode } from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { App } from 'src/model/App';
import SnackbarController from 'src/model/SnackbarController/SnackbarController';
import TerminalRow from 'src/view/Terminals/SingleTerminal/TerminalRow';
import { FilterController } from 'src/model/Terminals/Filters/FilterController';

describe('single terminal tests', () => {
  let app: App;
  let profileManager: AppDataManager;
  let dataProcessingSettings: RxSettings;
  let displaySettings: DisplaySettings;
  let snackbarController: SnackbarController;
  let filterController: FilterController;
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
    filterController = new FilterController(profileManager);
    singleTerminal = new SingleTerminal(
      'test-terminal',
      true,
      dataProcessingSettings,
      displaySettings,
      snackbarController,
      null,
      null,
      null,
      filterController
    );
    // Artificially set terminal view height to 100px since there is no UI to set it
    singleTerminal.setTerminalViewHeightPx(100);
  });

  //================================================================================
  // Basic tests
  //================================================================================
  describe('basic tests', () => {
    test('cursor down and up works', () => {
      singleTerminal.parseData(stringToUint8Array('123'), DataDirection.RX);
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

      singleTerminal.parseData(stringToUint8Array('row1\nrow2\nrow3'), DataDirection.RX);
      expect(singleTerminal.terminalRows.length).toBe(3);

      // Add another row, total length should still be 3
      singleTerminal.parseData(stringToUint8Array('row4\n'), DataDirection.RX);
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

      singleTerminal.parseData(stringToUint8Array('row1\nrow2\nrow3'), DataDirection.RX);
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

      singleTerminal.parseData(stringToUint8Array('123\n'), DataDirection.RX);

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

      singleTerminal.parseData(stringToUint8Array('123\n'), DataDirection.RX);

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

      singleTerminal.parseData(stringToUint8Array('123\n'), DataDirection.RX);

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
      singleTerminal.parseData(stringToUint8Array('0123401234'), DataDirection.RX);

      // Check num. rows
      expect(singleTerminal.terminalRows.length).toBe(3);

      // Check 1st row
      expect(singleTerminal.terminalRows[0].wasCreatedDueToWrapping).toBe(false);
      expect(singleTerminal.terminalRows[1].wasCreatedDueToWrapping).toBe(true);
    });

    test('tx and rx classes set correctly', () => {
      // Send a single TX byte then RX byte
      singleTerminal.parseData(stringToUint8Array('1'), DataDirection.TX);
      singleTerminal.parseData(stringToUint8Array('1'), DataDirection.RX);

      // First char should have a "tx" class, second char a "rx" class
      // These are needed so that the user can color TX and RX text differently
      expect(singleTerminal.terminalRows[0].terminalChars[0].className).toContain('tx');
      expect(singleTerminal.terminalRows[0].terminalChars[0].className).not.toContain('rx');
      expect(singleTerminal.terminalRows[0].terminalChars[1].className).toContain('rx');
      expect(singleTerminal.terminalRows[0].terminalChars[1].className).not.toContain('tx');
    });
  });

  //================================================================================
  // Escape code tests
  //================================================================================
  describe('escape code tests', () => {
    test('clear() clears colour styles', () => {
      singleTerminal.parseData(stringToUint8Array('\x1B[31mred'), DataDirection.RX);
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(4); // "red" + cursor
      for (let i = 0; i < 3; i++) {
        expect(singleTerminal.terminalRows[0].terminalChars[i].className).toContain('f31');
      }
      singleTerminal.clear();
      singleTerminal.parseData(stringToUint8Array('default'), DataDirection.RX);
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(8); // "default" + cursor
      // We expect the class name to be an empty string now, as we have called clear()
      for (let i = 0; i < 7; i++) {
        expect(singleTerminal.terminalRows[0].terminalChars[i].className).not.toContain('f31');
      }
    });
  });

  //================================================================================
  // Filtering tests
  //================================================================================
  describe('filtering tests', () => {
    // Replace the active filter list with a single substring filter. Passing
    // '' clears all filters (i.e. no filtering), matching the old single-field
    // "delete all text to disable" behavior.
    const setSingleFilter = (pattern: string) => {
      while (filterController.filters.length > 0) {
        filterController.deleteFilter(0);
      }
      if (pattern !== '') {
        filterController.addFilter();
        filterController.filters[0].setPattern(pattern);
      }
    };

    test('filtered terminal rows setup correctly', () => {
      // With no text yet received, we should just have the cursor on the first and only row. This should not be filtered.
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    });

    test('filtered terminal rows works with basic data', () => {
      singleTerminal.parseData(stringToUint8Array('123\n'), DataDirection.RX);
      // We haven't provided any filter text, so both rows should have passed the filter
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    });

    test('filter text "1" works', () => {
      setSingleFilter('1');
      // No data yet, even though this empty row won't match "1", it should still be included
      // because the cursor is on it
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
      singleTerminal.parseData(stringToUint8Array('1\n'), DataDirection.RX);
      // First row contains "1", so should pass filter, second row contains cursor, so
      // should also pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);

      singleTerminal.parseData(stringToUint8Array('2\n'), DataDirection.RX);
      // 2nd row containing "2" should not pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[0], singleTerminal.terminalRows[2] ]
      );

      singleTerminal.parseData(stringToUint8Array('3\n'), DataDirection.RX);
      // 2nd row containing "2" should not pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[0], singleTerminal.terminalRows[3] ]
      );
    });

    test('changing the filter text after data is present works', () => {
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
      singleTerminal.parseData(stringToUint8Array('1\n2\n3\n'), DataDirection.RX);

      // All rows should pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);

      setSingleFilter('1');
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[0], singleTerminal.terminalRows[3] ]
      );

      setSingleFilter('2');
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[1], singleTerminal.terminalRows[3] ]
      );

      setSingleFilter('3');
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[2], singleTerminal.terminalRows[3] ]
      );

      // There is no "4" in the data, so just the cursor row should be shown
      setSingleFilter('4');
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[3] ]
      );
    });

    test('clearing the filter should work', () => {
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
      singleTerminal.parseData(stringToUint8Array('1\n2\n3\n'), DataDirection.RX);

      // All rows should pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);

      setSingleFilter('1');
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[0], singleTerminal.terminalRows[3] ]
      );

      // Clearing the filter should restore all rows
      setSingleFilter('');
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    });

    test('multiple filters combine with match-any (OR) semantics', () => {
      singleTerminal.parseData(stringToUint8Array('1\n2\n3\n'), DataDirection.RX);

      // Two filters: a row is shown if it matches "1" OR "3". Row containing
      // "2" should be hidden; the cursor row (index 3) always shows.
      filterController.addFilter();
      filterController.filters[0].setPattern('1');
      filterController.addFilter();
      filterController.filters[1].setPattern('3');

      expect(singleTerminal.filteredTerminalRows).toEqual([
        singleTerminal.terminalRows[0],
        singleTerminal.terminalRows[2],
        singleTerminal.terminalRows[3],
      ]);
    });

    test('a disabled filter is ignored', () => {
      singleTerminal.parseData(stringToUint8Array('1\n2\n3\n'), DataDirection.RX);

      filterController.addFilter();
      filterController.filters[0].setPattern('1');
      filterController.addFilter();
      filterController.filters[1].setPattern('3');
      // Disable the "3" filter -> only rows matching "1" (plus the cursor row) show.
      filterController.filters[1].setEnabled(false);

      expect(singleTerminal.filteredTerminalRows).toEqual([
        singleTerminal.terminalRows[0],
        singleTerminal.terminalRows[3],
      ]);
    });

    test('a regex filter works', () => {
      singleTerminal.parseData(stringToUint8Array('ERR42\nok\nERR7\n'), DataDirection.RX);

      filterController.addFilter();
      filterController.filters[0].setPattern('err\\d+');
      filterController.filters[0].setUseRegex(true);

      // Both ERR rows match the regex (case-insensitive); "ok" is hidden; cursor
      // row (index 3) always shows.
      expect(singleTerminal.filteredTerminalRows).toEqual([
        singleTerminal.terminalRows[0],
        singleTerminal.terminalRows[2],
        singleTerminal.terminalRows[3],
      ]);
    });

    test('filter should work with cursor up escape code', () => {
      setSingleFilter('1');

      // 1A: go up one, puts the cursor at the end of the first row
      singleTerminal.parseData(stringToUint8Array('row1\nrow2\x1B[1A'), DataDirection.RX);

      // Second row should not pass the filter! The cursor is no longer on this
      // row and does not match the filter text
      expect(singleTerminal.filteredTerminalRows).toEqual(
        [ singleTerminal.terminalRows[0] ]
      );

      setSingleFilter('');

      // All rows should now pass filter
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    });

    test('filter should work with erase in display escape code', () => {
      // 2D go back 2, 1A go up 1, J clear to end of screen
      //
      singleTerminal.parseData(stringToUint8Array('row1\nrow2\x1B[2D\x1B[1A\x1B[J'), DataDirection.RX);

      // Should be left with a single row in the terminal with the text "ro" and
      // the cursor 1 right of the "o"
      expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    });

    // test('filter should work with scrollback buffer size of 1', () => {
    //   // Set a scrollback buffer of just 1 row
    //   singleTerminal.setTerminalViewHeightPx(10);
    //   displaySettings.scrollbackBufferSizeRows.setDispValue('1');
    //   displaySettings.scrollbackBufferSizeRows.apply();

    //   expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);

    //   singleTerminal.parseData(stringToUint8Array('row1\n'));

    //   // We should only have 1 row, which is empty and has the cursor in it
    //   expect(singleTerminal.terminalRows.length).toBe(1);
    //   expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);
    // });

    // test('filter should work with scrollback buffer size of 3', () => {
    //   // Set a scrollback buffer of just 1 row
    //   displaySettings.scrollbackBufferSizeRows.setDispValue('3');
    //   displaySettings.scrollbackBufferSizeRows.apply();

    //   singleTerminal.parseData(stringToUint8Array('row1\nrow2\n'));

    //   expect(singleTerminal.terminalRows.length).toBe(3);
    //   expect(singleTerminal.filteredTerminalRows).toEqual(singleTerminal.terminalRows);

    //   singleTerminal.setFilterText('row1');

    //   expect(singleTerminal.filteredTerminalRows).toEqual([
    //     singleTerminal.terminalRows[0], singleTerminal.terminalRows[2]
    //   ]);

    //   singleTerminal.parseData(stringToUint8Array('row3\n'));

    //   expect(singleTerminal.filteredTerminalRows).toEqual([
    //     singleTerminal.terminalRows[2]
    //   ]);
    // });
  });

  //================================================================================
  // Scrolling tests
  //================================================================================
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

  //================================================================================
  // Timestamp tests
  //================================================================================
  describe('timestamp tests', () => {
    test('timestamp is added to start of first line', () => {
      const NUM_CHARS_IN_TIMESTAMP = 24;
      // Enable timestamps setting
      dataProcessingSettings.setAddTimestamps(true);

      // Send some basic data
      singleTerminal.parseData(stringToUint8Array('123'), DataDirection.RX);

      // The timestamp should have been printed in the format "2025-06-03T16:35:07.123 "
      // This is 26 chars. So the total length of the row should be 26 (timestamp and space) + 3 (data) + 1 (cursor) = 30
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(NUM_CHARS_IN_TIMESTAMP + 4);

      // Extract the timestamp from the first row
      const timestampFromTerminalStr = singleTerminal.terminalRows[0].terminalChars.slice(0, NUM_CHARS_IN_TIMESTAMP).map(char => char.char).join('');
      // Parse the ISO-without-tz form back to a Date by appending the local
      // offset; assert it's within a second of "now".
      const timestampFromTerminal = new Date(timestampFromTerminalStr.trim()).getTime();
      expect(Math.abs(timestampFromTerminal - Date.now())).toBeLessThan(2000);

      // Now check the rest of the text, which should be "123 "
      const restOfText = singleTerminal.terminalRows[0].terminalChars.slice(NUM_CHARS_IN_TIMESTAMP).map(char => char.char).join('');
      expect(restOfText).toBe('123 ');
    });

    test('timestamps are added correctly to new lines', () => {
      const NUM_CHARS_IN_TIMESTAMP = 24;
      // Enable timestamps setting
      dataProcessingSettings.setAddTimestamps(true);

      // Send some basic data
      singleTerminal.parseData(stringToUint8Array('123\n'), DataDirection.RX);

      // The timestamp should have been printed in the format "2025-06-03T16:35:07.123 "
      // This is 26 chars. So the total length of the row should be 26 (timestamp and space) + 3 (data) = 29
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(NUM_CHARS_IN_TIMESTAMP + 3);

      // There should be no timestamp yet on the second row, since we haven't received a visible character on that row yet
      expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(1);

      // Send some more data
      singleTerminal.parseData(stringToUint8Array('456'), DataDirection.RX);

      // Should be 2 rows still
      expect(singleTerminal.terminalRows.length).toBe(2);

      // Now we should have a timestamp and the data on the second row. Also cursor so one extra char.
      expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(NUM_CHARS_IN_TIMESTAMP + 4);
    });

    test('UNIX_SECONDS timestamp format works', () => {
      const NUM_CHARS_IN_TIMESTAMP = 11;
      // Enable timestamps setting
      dataProcessingSettings.setAddTimestamps(true);

      // Set timestamp format to UNIX_SECONDS
      dataProcessingSettings.setTimestampFormat(TimestampFormat.UNIX_SECONDS);

      // Send some basic data
      singleTerminal.parseData(stringToUint8Array('123'), DataDirection.RX);

      printTerminalRows(singleTerminal.terminalRows);

      // The timestamp should have been printed in the format "1748991831"
      // Total length will be 10 (timestamp) + 1 (space) + 3 (data) + 1 (cursor) = 15
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(NUM_CHARS_IN_TIMESTAMP + 4);

      // Extract the timestamp from the first row
      let timestampFromTerminalStr = singleTerminal.terminalRows[0].terminalChars.slice(0, NUM_CHARS_IN_TIMESTAMP).map(char => char.char).join('');
      // Remove space from the end
      timestampFromTerminalStr = timestampFromTerminalStr.slice(0, -1);
      const timestampFromTerminalMs = parseInt(timestampFromTerminalStr, 10) * 1000;
      expect(Math.abs(timestampFromTerminalMs - Date.now())).toBeLessThan(2000);

      // Now check the rest of the text, which should be "123 "
      const restOfText = singleTerminal.terminalRows[0].terminalChars.slice(NUM_CHARS_IN_TIMESTAMP).map(char => char.char).join('');
      expect(restOfText).toBe('123 ');
    });

    test('UNIX_SECONDS_AND_MILLISECONDS timestamp format works', () => {
      const NUM_CHARS_IN_TIMESTAMP = 15;
      // Enable timestamps setting
      dataProcessingSettings.setAddTimestamps(true);

      // Set timestamp format to UNIX_SECONDS_AND_MILLISECONDS
      dataProcessingSettings.setTimestampFormat(TimestampFormat.UNIX_SECONDS_AND_MILLISECONDS);

      // Send some basic data
      singleTerminal.parseData(stringToUint8Array('123'), DataDirection.RX);

      printTerminalRows(singleTerminal.terminalRows);

      // The timestamp should have been printed in the format "1748991831.123"
      // Total length will be 15 (timestamp) + 1 (space) + 3 (data) + 1 (cursor) = 20
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(NUM_CHARS_IN_TIMESTAMP + 4);

      // Extract the timestamp from the first row, format is 'X.SSS '.
      const timestampFromTerminalStr = singleTerminal.terminalRows[0].terminalChars.slice(0, NUM_CHARS_IN_TIMESTAMP).map(char => char.char).join('');
      // Parse "<unix_seconds>.<ms>" back into a ms value.
      const [secStr, msStr] = timestampFromTerminalStr.trim().split('.');
      const timestampFromTerminalMs = parseInt(secStr, 10) * 1000 + parseInt(msStr, 10);
      expect(Math.abs(timestampFromTerminalMs - Date.now())).toBeLessThan(2000);

      // Now check the rest of the text, which should be "123 "
      const restOfText = singleTerminal.terminalRows[0].terminalChars.slice(NUM_CHARS_IN_TIMESTAMP).map(char => char.char).join('');
      expect(restOfText).toBe('123 ');
    });

    test('custom timestamp format works', () => {
      const NUM_CHARS_IN_TIMESTAMP = 5;
      // Enable timestamps setting
      dataProcessingSettings.setAddTimestamps(true);

      // Set timestamp format to custom
      dataProcessingSettings.setTimestampFormat(TimestampFormat.CUSTOM);

      // Set custom timestamp format which is just the year and a space
      dataProcessingSettings.customTimestampFormatString.setDispValue("YYYY ");
      dataProcessingSettings.customTimestampFormatString.apply();

      // Send some basic data
      singleTerminal.parseData(stringToUint8Array('123'), DataDirection.RX);

      printTerminalRows(singleTerminal.terminalRows);

      // The timestamp should have been printed in the format "2025 "
      // Total length will be 5 (year + space) + 3 (data) + 1 (cursor) = 9
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(NUM_CHARS_IN_TIMESTAMP + 4);

      // Extract the timestamp from the first row
      const timestampFromTerminalStr = singleTerminal.terminalRows[0].terminalChars.slice(0, NUM_CHARS_IN_TIMESTAMP).map(char => char.char).join('');

      // Make sure the year is within 1 year of the current year (we could be unlucky and run the test across midnight
      // and the year changes)
      const now = new Date();
      const currentYear = now.getFullYear();
      const timestampYear = parseInt(timestampFromTerminalStr);
      expect(timestampYear).toBeGreaterThanOrEqual(currentYear - 1);
      expect(timestampYear).toBeLessThanOrEqual(currentYear + 1);

      // Now check the rest of the text, which should be "123 "
      const restOfText = singleTerminal.terminalRows[0].terminalChars.slice(NUM_CHARS_IN_TIMESTAMP).map(char => char.char).join('');
      expect(restOfText).toBe('123 ');
    });

    test('timestamp is not added to empty lines', () => {
      // Enable timestamps setting
      dataProcessingSettings.setAddTimestamps(true);

      // Send some basic data
      singleTerminal.parseData(stringToUint8Array('\n'), DataDirection.RX);

      // There should be no timestamp on the first row, since it is empty. There should be a single
      // placeholder char.
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(1);
      expect(singleTerminal.terminalRows[0].terminalChars[0].char).toBe(' ');
    });

    test('timestamps are not added to new lines created due to wrapping', () => {
      const NUM_CHARS_IN_TIMESTAMP = 24;
      const TERMINAL_WIDTH_CHARS = NUM_CHARS_IN_TIMESTAMP + 2;
      // Enable timestamps setting
      dataProcessingSettings.setAddTimestamps(true);
      // Set the terminal char width to 30 to make it easy to wrap
      displaySettings.terminalWidthChars.setDispValue(TERMINAL_WIDTH_CHARS.toString());
      displaySettings.terminalWidthChars.apply();

      // Send 5 chars, which should make it wrap to the next line (1 char on second line) since
      // the default timestamp length is 26 chars
      const rxData = stringToUint8Array('12345');
      singleTerminal.parseData(rxData, DataDirection.RX);

      // There should be 2 rows, the first full of data, the second with the remainder of the data
      expect(singleTerminal.terminalRows.length).toBe(2);

      // Don't validate the timestamp in first line, just make sure it's full of data
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(TERMINAL_WIDTH_CHARS);
      // Expect the second line to contain the "345" and the cursor
      expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(4);
      expect(singleTerminal.terminalRows[1].terminalChars[0].char).toBe('3');
      expect(singleTerminal.terminalRows[1].terminalChars[1].char).toBe('4');
      expect(singleTerminal.terminalRows[1].terminalChars[2].char).toBe('5');
      expect(singleTerminal.terminalRows[1].terminalChars[3].char).toBe(' '); // cursor
    });

    test('line can wrap in the middle of a timestamp', () => {
      const NUM_CHARS_IN_TIMESTAMP = 24;
      // Set terminal width
      const TERMINAL_WIDTH_CHARS = 20;
      // Enable timestamps setting
      dataProcessingSettings.setAddTimestamps(true);

      displaySettings.terminalWidthChars.setDispValue(TERMINAL_WIDTH_CHARS.toString());
      displaySettings.terminalWidthChars.apply();

      // Send 5 chars. Timestamp itself is 26 chars, so line should wrap part way through the
      // timestamp.
      singleTerminal.parseData(stringToUint8Array('12345'), DataDirection.RX);

      // There should be 2 rows
      expect(singleTerminal.terminalRows.length).toBe(2);

      // Don't validate the timestamp in first line, just make sure it's full of data
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(TERMINAL_WIDTH_CHARS);
      // Length of second row should be remainder of timestamp length (26 - 20 = 6) + data (5) + cursor (1)
      expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(NUM_CHARS_IN_TIMESTAMP - TERMINAL_WIDTH_CHARS + 5 + 1);
    });
  });

  //================================================================================
  // Tab tests
  //================================================================================
  describe('tab tests', () => {
    test('tab moves cursor to next tab stop (default 8 spaces)', () => {
      singleTerminal.parseData(stringToUint8Array('123\t'), DataDirection.RX);
      expect(singleTerminal.cursorPosition[0]).toBe(0);
      expect(singleTerminal.cursorPosition[1]).toBe(8);
      // Check that spaces were added up to the cursor
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(9); // 8 spaces + cursor
      for (let i = 3; i < 8; i++) {
        expect(singleTerminal.terminalRows[0].terminalChars[i].char).toBe(' ');
      }
    });

    test('tab moves cursor to next tab stop (custom 4 spaces)', () => {
      displaySettings.tabStopWidth.setDispValue('4');
      displaySettings.tabStopWidth.apply();
      singleTerminal.parseData(stringToUint8Array('1\t'), DataDirection.RX);
      expect(singleTerminal.cursorPosition[0]).toBe(0);
      expect(singleTerminal.cursorPosition[1]).toBe(4);
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(5); // 4 spaces + cursor
      for (let i = 1; i < 4; i++) {
        expect(singleTerminal.terminalRows[0].terminalChars[i].char).toBe(' ');
      }
    });

    test('tab at end of line should not wrap but go to end of line', () => {
      displaySettings.terminalWidthChars.setDispValue('10');
      displaySettings.terminalWidthChars.apply();
      displaySettings.tabStopWidth.setDispValue('4');
      displaySettings.tabStopWidth.apply();
      // Fill up most of the line (9 chars), then tab. Cursor is at col 9.
      // Terminal width is 10. Tab should fill 1 space to col 10.
      singleTerminal.parseData(stringToUint8Array('123456789\t'), DataDirection.RX);
      expect(singleTerminal.cursorPosition[0]).toBe(0); // Should stay on the same line
      expect(singleTerminal.cursorPosition[1]).toBe(10); // Should be at the end of the line (terminal width)
      expect(singleTerminal.terminalRows.length).toBe(1); // Should be only one row
      // Original 9 chars + 1 space for tab + 1 char for cursor = 11
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(11);
      expect(singleTerminal.terminalRows[0].terminalChars[9].char).toBe(' '); // The space added by tab
      expect(singleTerminal.terminalRows[0].terminalChars[9].forCursor).toBe(false);
      expect(singleTerminal.terminalRows[0].terminalChars[10].char).toBe(' '); // The cursor char
      expect(singleTerminal.terminalRows[0].terminalChars[10].forCursor).toBe(true);
    });

    test('tab when already at a tab stop moves to next tab stop', () => {
      displaySettings.tabStopWidth.setDispValue('4');
      displaySettings.tabStopWidth.apply();
      singleTerminal.parseData(stringToUint8Array('1234\t'), DataDirection.RX); // Cursor at col 4
      expect(singleTerminal.cursorPosition[0]).toBe(0);
      expect(singleTerminal.cursorPosition[1]).toBe(8);
    });

    test('tab when remaining space is less than tab stop width', () => {
      displaySettings.terminalWidthChars.setDispValue('10');
      displaySettings.terminalWidthChars.apply();
      displaySettings.tabStopWidth.setDispValue('8');
      displaySettings.tabStopWidth.apply();
      singleTerminal.parseData(stringToUint8Array('1234567\t'), DataDirection.RX); // 7 chars, cursor at col 7
      // Next tab stop is at col 8. Only 1 space needed.
      expect(singleTerminal.cursorPosition[0]).toBe(0);
      expect(singleTerminal.cursorPosition[1]).toBe(8);
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(9);
      expect(singleTerminal.terminalRows[0].terminalChars[7].char).toBe(' ');
    });

    test('a line full of tab stops should not wrap', () => {
      displaySettings.terminalWidthChars.setDispValue('10');
      displaySettings.terminalWidthChars.apply();
      displaySettings.tabStopWidth.setDispValue('4');
      displaySettings.tabStopWidth.apply();

      // 3 tab at 4 spaces each would be 12 chars, but terminal width is 10, so the cursor should stop at the last (10th) position
      singleTerminal.parseData(stringToUint8Array('\t\t\t'), DataDirection.RX);
      expect(singleTerminal.cursorPosition[0]).toBe(0);
      expect(singleTerminal.cursorPosition[1]).toBe(10);
      expect(singleTerminal.terminalRows.length).toBe(1);
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(11);
      // Now sending two printable chars should place 1 at the last position
      // on the first line, and the second char at the start of the second line
      singleTerminal.parseData(stringToUint8Array('12'), DataDirection.RX);
      expect(singleTerminal.cursorPosition[0]).toBe(1);
      expect(singleTerminal.cursorPosition[1]).toBe(1);
      expect(singleTerminal.terminalRows.length).toBe(2);
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(11);
      expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(2);
    });
  });

  describe('hex glyph tests', () => {
    test('hex glyphs are rendered correctly', () => {
      dataProcessingSettings.setNonVisibleCharDisplayBehavior(
        NonVisibleCharDisplayBehaviors.HEX_GLYPHS
      );
      // Disable escape code parsing
      dataProcessingSettings.setAnsiEscapeCodeParsingEnabled(false);
      // First 5 bytes should be rendered as hex glyphs, the last 3 should be rendered as the text "LED"
      const data = new Uint8Array([0xFB, 0x1B, 0x00, 0x03, 0x00, 0x4C, 0x45, 0x44]);
      singleTerminal.parseData(data, DataDirection.RX);
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(data.length + 1); // +1 for cursor
      const row = singleTerminal.terminalRows[0];
      // Check code points of the chars added to the row
      for (let i = 0; i < 5; i++) {
        const char = row.terminalChars[i];
        const codePoint = char.char.codePointAt(0);
        expect(codePoint, `codePoint for char ${i} should be ${START_OF_HEX_GLYPHS + data[i]} but is ${codePoint}`).toBe(START_OF_HEX_GLYPHS + data[i]);
      }
      const ledOffset = 5;
      const string = "LED";
      for (let i = 0; i < string.length; i++) {
        const char = row.terminalChars[i + ledOffset];
        const codePoint = char.char.codePointAt(0);
        expect(codePoint, `codePoint for char ${i} should be ${string.charCodeAt(i)} but is ${codePoint}`).toBe(string.charCodeAt(i));
      }
    });
  });

  //================================================================================
  // Backspace handling
  //================================================================================
  describe('backspace handling', () => {
    test('destructive backspace (default) erases the previous char', () => {
      // DELETE_CHAR is the default behavior.
      singleTerminal.parseData(stringToUint8Array('abc\b'), DataDirection.RX);

      expect(singleTerminal.cursorPosition).toEqual([0, 2]);
      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars.length).toBe(3);
      expect(chars[0].char).toBe('a');
      expect(chars[1].char).toBe('b');
      // 'c' was erased; the cursor now sits on a holder space.
      expect(chars[2].char).toBe(' ');
      expect(chars[2].forCursor).toBe(true);
    });

    test('typing after a destructive backspace overwrites correctly', () => {
      singleTerminal.parseData(stringToUint8Array('ab\bX'), DataDirection.RX);

      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars[0].char).toBe('a');
      expect(chars[1].char).toBe('X');
      expect(singleTerminal.cursorPosition).toEqual([0, 2]);
    });

    test('the \\b \\b erase sequence leaves the line clean', () => {
      singleTerminal.parseData(stringToUint8Array('abc\b \b'), DataDirection.RX);

      expect(singleTerminal.cursorPosition).toEqual([0, 2]);
      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars[0].char).toBe('a');
      expect(chars[1].char).toBe('b');
      expect(chars[2].forCursor).toBe(true);
    });

    test('DEL (0x7F) is treated as a backspace', () => {
      const data = new Uint8Array([0x61, 0x62, 0x63, 0x7f]); // 'abc' + DEL
      singleTerminal.parseData(data, DataDirection.RX);

      expect(singleTerminal.cursorPosition).toEqual([0, 2]);
      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars.length).toBe(3);
      expect(chars[1].char).toBe('b');
      expect(chars[2].forCursor).toBe(true);
    });

    test('MOVE_CURSOR_LEFT moves the cursor without deleting', () => {
      dataProcessingSettings.setBackspaceBehavior(BackspaceBehavior.MOVE_CURSOR_LEFT);
      singleTerminal.parseData(stringToUint8Array('abc\b'), DataDirection.RX);

      // Cursor moved left but 'c' is still present.
      expect(singleTerminal.cursorPosition).toEqual([0, 2]);
      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars[2].char).toBe('c');
    });

    test('DO_NOTHING renders the backspace as a control glyph', () => {
      dataProcessingSettings.setBackspaceBehavior(BackspaceBehavior.DO_NOTHING);
      singleTerminal.parseData(stringToUint8Array('a\b'), DataDirection.RX);

      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars[0].char).toBe('a');
      // 0x08 shifted up into the control-glyph PUA range.
      expect(chars[1].char).toBe(String.fromCharCode(0x08 + 0xe000));
    });

    test('backspace at the start of the line does nothing', () => {
      singleTerminal.parseData(stringToUint8Array('\b'), DataDirection.RX);

      expect(singleTerminal.cursorPosition).toEqual([0, 0]);
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(1);
    });
  });

  //================================================================================
  // Form feed handling
  //================================================================================
  describe('form feed handling', () => {
    test('DO_NOTHING (default) renders the form feed as a control glyph', () => {
      // DO_NOTHING is the default behavior, so a received FF is shown as a glyph
      // like any other non-visible char rather than clearing the screen.
      singleTerminal.parseData(stringToUint8Array('a\f'), DataDirection.RX);

      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars[0].char).toBe('a');
      // 0x0C shifted up into the control-glyph PUA range.
      expect(chars[1].char).toBe(String.fromCharCode(0x0c + 0xe000));
    });

    test('CLEAR_SCREEN_AND_SCROLLBACK resets the terminal like clear()', () => {
      dataProcessingSettings.setFormFeedBehavior(FormFeedBehavior.CLEAR_SCREEN_AND_SCROLLBACK);
      singleTerminal.parseData(stringToUint8Array('row1\nrow2\fabc'), DataDirection.RX);

      // Scrollback ('row1') is gone; only the post-FF content remains, starting
      // at the top of a fresh terminal.
      expect(singleTerminal.terminalRows.length).toBe(1);
      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars[0].char).toBe('a');
      expect(chars[1].char).toBe('b');
      expect(chars[2].char).toBe('c');
      expect(singleTerminal.cursorPosition).toEqual([0, 3]);
    });

    test('CLEAR_SCREEN is equivalent to the ANSI ESC[2J sequence', () => {
      // FF with CLEAR_SCREEN should leave the terminal in the same state as
      // sending the same data followed by an ESC[2J erase-in-display sequence.
      dataProcessingSettings.setFormFeedBehavior(FormFeedBehavior.CLEAR_SCREEN);
      singleTerminal.parseData(stringToUint8Array('abc\f'), DataDirection.RX);
      const ffState = JSON.stringify(singleTerminal.terminalRows);
      const ffCursor = singleTerminal.cursorPosition;

      // Re-run with an explicit ESC[2J instead of the form feed.
      singleTerminal.clear();
      dataProcessingSettings.setFormFeedBehavior(FormFeedBehavior.DO_NOTHING);
      singleTerminal.parseData(stringToUint8Array('abc\x1b[2J'), DataDirection.RX);

      expect(JSON.stringify(singleTerminal.terminalRows)).toBe(ffState);
      expect(singleTerminal.cursorPosition).toEqual(ffCursor);
    });

    test('a form feed mid-escape-sequence is not treated as a clear', () => {
      // 0x0C appearing inside an (incomplete) escape sequence must not trigger
      // the clear behavior.
      dataProcessingSettings.setFormFeedBehavior(FormFeedBehavior.CLEAR_SCREEN_AND_SCROLLBACK);
      singleTerminal.parseData(stringToUint8Array('row1\nrow2'), DataDirection.RX);
      // ESC then FF — the FF is consumed as part of escape-code parsing, not a clear.
      singleTerminal.parseData(new Uint8Array([0x1b, 0x0c]), DataDirection.RX);

      // The two rows are still present (nothing was cleared).
      expect(singleTerminal.terminalRows.length).toBe(2);
    });
  });

  //================================================================================
  // CSI sequence termination
  //================================================================================
  describe('CSI sequence termination', () => {
    test('ESC[3~ (Delete key VT sequence) is consumed and does not swallow the next char', () => {
      // 'ab' then ESC[3~ (Delete) then 'c'. The `~` final byte must terminate
      // the CSI sequence so the following 'c' is printed normally. Before the
      // fix, `~` did not end the sequence and the next byte was eaten.
      const data = new Uint8Array([0x61, 0x62, 0x1b, 0x5b, 0x33, 0x7e, 0x63]);
      singleTerminal.parseData(data, DataDirection.RX);

      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars[0].char).toBe('a');
      expect(chars[1].char).toBe('b');
      expect(chars[2].char).toBe('c');
      expect(singleTerminal.cursorPosition).toEqual([0, 3]);
    });

    test('letter-terminated CSI sequences still work (ESC[1D moves the cursor left)', () => {
      // Regression guard: broadening the terminator to the full 0x40-0x7E
      // final-byte range must not break the common letter-terminated codes.
      const data = new Uint8Array([0x61, 0x62, 0x63, 0x1b, 0x5b, 0x31, 0x44]); // 'abc' + ESC[1D
      singleTerminal.parseData(data, DataDirection.RX);

      expect(singleTerminal.cursorPosition).toEqual([0, 2]);
    });
  });

  //================================================================================
  // DCH (Delete Character, ESC[P)
  //================================================================================
  describe('DCH delete character', () => {
    test('ESC[P deletes the character under the cursor and shifts the rest left', () => {
      // 'abcd', move cursor left 2 (onto 'c'), then ESC[P -> 'abd'.
      const data = new Uint8Array([
        0x61, 0x62, 0x63, 0x64, // 'abcd'
        0x1b, 0x5b, 0x32, 0x44, // ESC[2D (cursor left 2)
        0x1b, 0x5b, 0x50, // ESC[P (delete 1 char)
      ]);
      singleTerminal.parseData(data, DataDirection.RX);

      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars.length).toBe(3);
      expect(chars[0].char).toBe('a');
      expect(chars[1].char).toBe('b');
      expect(chars[2].char).toBe('d');
      // Cursor stays put.
      expect(singleTerminal.cursorPosition).toEqual([0, 2]);
    });

    test('ESC[nP deletes n characters', () => {
      // 'abcde', move cursor left 3 (onto 'c'), then ESC[2P -> 'abe'.
      const data = new Uint8Array([
        0x61, 0x62, 0x63, 0x64, 0x65, // 'abcde'
        0x1b, 0x5b, 0x33, 0x44, // ESC[3D
        0x1b, 0x5b, 0x32, 0x50, // ESC[2P
      ]);
      singleTerminal.parseData(data, DataDirection.RX);

      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars.length).toBe(3);
      expect(chars[0].char).toBe('a');
      expect(chars[1].char).toBe('b');
      expect(chars[2].char).toBe('e');
      expect(singleTerminal.cursorPosition).toEqual([0, 2]);
    });

    test('ESC[P at the end of the line is a no-op', () => {
      // Nothing to the right of the cursor to delete.
      const data = new Uint8Array([0x61, 0x62, 0x63, 0x1b, 0x5b, 0x50]); // 'abc' + ESC[P
      singleTerminal.parseData(data, DataDirection.RX);

      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars[0].char).toBe('a');
      expect(chars[1].char).toBe('b');
      expect(chars[2].char).toBe('c');
      // Trailing cursor-holder space remains untouched.
      expect(chars[3].forCursor).toBe(true);
      expect(singleTerminal.cursorPosition).toEqual([0, 3]);
    });

    test('ESC[nP is clamped to the characters remaining on the line', () => {
      // 'ab', move cursor to start, delete more chars than exist -> empty line.
      const data = new Uint8Array([
        0x61, 0x62, // 'ab'
        0x1b, 0x5b, 0x32, 0x44, // ESC[2D (cursor to col 0)
        0x1b, 0x5b, 0x39, 0x50, // ESC[9P
      ]);
      singleTerminal.parseData(data, DataDirection.RX);

      const chars = singleTerminal.terminalRows[0].terminalChars;
      expect(chars.length).toBe(1);
      expect(chars[0].forCursor).toBe(true);
      expect(singleTerminal.cursorPosition).toEqual([0, 0]);
    });
  });
});

function printTerminalRows(terminalRows: TerminalRow[]) {
  /**
   * Helper function to print the terminal rows to the console.
   */
  // Iterate over each row and print the terminalChars
  for (let i = 0; i < terminalRows.length; i += 1) {
    const row = terminalRows[i];
    let terminalRowText = '';
    for (let j = 0; j < row.terminalChars.length; j += 1) {
      const char = row.terminalChars[j];
      terminalRowText += char.char;
    }
    console.log(`row[${i}]="${terminalRowText}"`);
  }
}
