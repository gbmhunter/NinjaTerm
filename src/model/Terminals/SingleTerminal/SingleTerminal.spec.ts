import { expect, test, describe, beforeEach } from 'vitest';

import moment from 'moment';

import { stringToUint8Array } from 'src/model/Util/Util';
import { DataDirection, SingleTerminal } from './SingleTerminal';
import RxSettings, {
  NewLineCursorBehavior,
  NonVisibleCharDisplayBehaviors,
  TimestampFormat,
} from 'src/model/Settings/RxSettings/RxSettings';
import DisplaySettings, { TerminalHeightMode } from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { App } from 'src/model/App';
import SnackbarController from 'src/model/SnackbarController/SnackbarController';
import TerminalRow from 'src/view/Terminals/SingleTerminal/TerminalRow';

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
      singleTerminal.setFilterText('1');
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
      singleTerminal.parseData(stringToUint8Array('1\n2\n3\n'), DataDirection.RX);

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
      singleTerminal.parseData(stringToUint8Array('row1\nrow2\x1B[1A'), DataDirection.RX);

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
      const NUM_CHARS_IN_TIMESTAMP = 26;
      // Enable timestamps setting
      dataProcessingSettings.setAddTimestamps(true);

      // Send some basic data
      singleTerminal.parseData(stringToUint8Array('123'), DataDirection.RX);

      // The timestamp should have been printed in the format "2025-06-03T16:35:07+12:00 "
      // This is 26 chars. So the total length of the row should be 26 (timestamp and space) + 3 (data) + 1 (cursor) = 30
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(NUM_CHARS_IN_TIMESTAMP + 4);

      // Extract the timestamp from the first row
      const timestampFromTerminalStr = singleTerminal.terminalRows[0].terminalChars.slice(0, NUM_CHARS_IN_TIMESTAMP).map(char => char.char).join('');
      const timestampFromTerminal = moment(timestampFromTerminalStr, 'YYYY-MM-DDTHH:mm:ssZ')

      // Get local time in ISO format, in timezone of the machine running the test
      const now = new Date();
      const timestamp = moment(now);

      // Check that the timestamp is within 1 second of the current time
      expect(timestampFromTerminal.diff(timestamp, 'seconds')).toBeLessThan(1);

      // Now check the rest of the text, which should be "123 "
      const restOfText = singleTerminal.terminalRows[0].terminalChars.slice(NUM_CHARS_IN_TIMESTAMP).map(char => char.char).join('');
      expect(restOfText).toBe('123 ');
    });

    test('timestamps are added correctly to new lines', () => {
      // Enable timestamps setting
      dataProcessingSettings.setAddTimestamps(true);

      // Send some basic data
      singleTerminal.parseData(stringToUint8Array('123\n'), DataDirection.RX);

      // The timestamp should have been printed in the format "2025-06-03T16:35:07+12:00 "
      // This is 26 chars. So the total length of the row should be 26 (timestamp and space) + 3 (data) = 29
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(29);

      // There should be no timestamp yet on the second row, since we haven't received a visible character on that row yet
      expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(1);

      // Send some more data
      singleTerminal.parseData(stringToUint8Array('456'), DataDirection.RX);

      // Should be 2 rows still
      expect(singleTerminal.terminalRows.length).toBe(2);

      // Now we should have a timestamp and the data on the second row. Should be 30 chars (29 like first row + cursor)
      expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(30);
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
      const timestampFromTerminal = moment(timestampFromTerminalStr, 'X');

      // Get local time in ISO format, in timezone of the machine running the test
      const now = new Date();
      const timestamp = moment(now);

      // Check that the timestamp is within 1 second of the current time
      expect(timestampFromTerminal.diff(timestamp, 'seconds')).toBeLessThan(1);

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

      // Extract the timestamp from the first row
      const timestampFromTerminalStr = singleTerminal.terminalRows[0].terminalChars.slice(0, NUM_CHARS_IN_TIMESTAMP).map(char => char.char).join('');
      const timestampFromTerminal = moment(timestampFromTerminalStr, 'x');

      // Get local time in ISO format, in timezone of the machine running the test
      const now = new Date();
      const timestamp = moment(now);

      // Check that the timestamp is within 1 second of the current time
      expect(timestampFromTerminal.diff(timestamp, 'seconds')).toBeLessThan(1);

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
      const TERMINAL_WIDTH_CHARS = 30;
      // Enable timestamps setting
      dataProcessingSettings.setAddTimestamps(true);
      // Set the terminal char width to 30 to make it easy to wrap
      displaySettings.terminalWidthChars.setDispValue(TERMINAL_WIDTH_CHARS.toString());
      displaySettings.terminalWidthChars.apply();

      // Send 5 chars, which should make it wrap to the next line (1 char on second line) since
      // the default timestamp length is 26 chars
      singleTerminal.parseData(stringToUint8Array('12345'), DataDirection.RX);

      // There should be 2 rows, the first with 10 chars and the second with 4
      expect(singleTerminal.terminalRows.length).toBe(2);

      // Don't validate the timestamp in first line, just make sure it's full of data
      expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(TERMINAL_WIDTH_CHARS);
      // Expect the second line to contain the "5" and the cursor
      expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(2);
      expect(singleTerminal.terminalRows[1].terminalChars[0].char).toBe('5');
      expect(singleTerminal.terminalRows[1].terminalChars[1].char).toBe(' '); // cursor
    });

    test('line can wrap in the middle of a timestamp', () => {
      const NUM_CHARS_IN_TIMESTAMP = 26;
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