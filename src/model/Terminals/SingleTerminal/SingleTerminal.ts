/* eslint-disable no-continue */
import { autorun, makeAutoObservable, reaction } from 'mobx';
import { ListOnScrollProps } from 'react-window';
import moment from 'moment';

import TerminalRow from 'src/view/Terminals/SingleTerminal/TerminalRow';
import TerminalChar from 'src/view/Terminals/SingleTerminal/SingleTerminalChar';
import RxSettings, {
  CarriageReturnCursorBehavior,
  DataType,
  Endianness,
  FloatStringConversionMethod,
  HexCase,
  NewLineCursorBehavior,
  NewLinePlacementOnHexValue,
  NonVisibleCharDisplayBehaviors,
  NumberType,
  PaddingCharacter,
  TimestampFormat,
} from 'src/model/Settings/RxSettings/RxSettings';
import DisplaySettings, { TerminalHeightMode } from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { SelectionController } from 'src/model/SelectionController/SelectionController';
import SnackbarController from 'src/model/SnackbarController/SnackbarController';

const START_OF_CONTROL_GLYPHS = 0xe000;
const START_OF_HEX_GLYPHS = 0xe100;

export enum DataDirection {
  TX = 'TX',
  RX = 'RX',
}

/**
 * Represents a single terminal-style user interface.
 */
export class SingleTerminal {

  id: string;

  rxSettings: RxSettings;

  displaySettings: DisplaySettings;

  snackbarController: SnackbarController;

  /**
   * Callback that is passed in via constructor. This wall be called whenever a key is pressed
   * while the terminal is focused.
   */
  onTerminalKeyDown: ((event: React.KeyboardEvent) => Promise<void>) | null;

  //======================================================================
  // POSITION/SIZE VARIABLES
  //======================================================================

  /**
   * Holds the current cursor position in the terminalRows array. In the form:
   * [ row_idx, col_idx ]
   */
  cursorPosition: [number, number];

  // If true, the data pane scroll will be locked at the bottom

  /**
   * If true, the data view scroll will be locked at the bottom. If false, the user can scroll
   * around, and the scroll will be updated on new rows so that the existing data stays in view.
   */
  scrollLock: boolean;

  rowToScrollLockTo: number;

  /**
   * The scroll position of the fixed size list. This is the number of pixels
   * from the top of the terminal view.
   *
   * scrollPos + terminalViewHeightPx = totalTerminalRowsHeightPx
   * where totalTerminalRowsHeightPx = numTerminalRows * (charSizePx + verticalRowPaddingPx)
   */
  scrollPos: number;

  /*
   * The height of the terminal view in pixels. This does not include any padding,
   * i.e. it's the height that terminal rows will be packed into. Set by the UI.
   *
   * The fixed size list uses this state to set it's height.
   */
  terminalViewHeightPx: number = 0;

  /**
   * The arrays of terminal rows, where each element represents a row
   * of data.
   */
  terminalRows: TerminalRow[];

  /**
   * The filter text to apply to the terminal. If an empty string, no filtering is
   * applied.
   */
  filterText: string = '';

  /**
   * The array of terminal rows which should be included in the filtered view
   * due to the filter text. This is a subset of the terminalRows array.
   */
  filteredTerminalRows: TerminalRow[] = [];

  // True if this RX data parser is just processing text as plain text, i.e.
  // no partial escape code has been detected.
  inIdleState: boolean;

  // True if we have received the escape code start char and are currently waiting
  // for more data to complete the sequence
  inAnsiEscapeCode: boolean;

  // True is we have received part of a CSI sequence ("ESC[")
  inCSISequence: boolean;

  // True if we have received SGR code of "1" (bold or increased intensity)
  // Reset back to false when receive SGR code of "0" (reset or normal)
  boldOrIncreasedIntensity: boolean;

  partialEscapeCode: string;

  defaultBackgroundColor: string;
  defaultTxColor: string;
  defaultRxColor: string;

  currForegroundColorNum: number | null;

  currBackgroundColorNum: number | null;

  /**
   * Set to true when the user clicks within the Terminals bounding box.
   * Used to:
   * - Know when to capture key strokes for the Terminal.
   * - Send data to the serial port when the Paste shortcut is pressed
   */
  isFocused: boolean;

  // If this is set to false, the Terminal is not focusable. It will not have a background
  // glow on hover or click, and the cursor will always outlined, never filled in.
  isFocusable: boolean;

  /**
   * This is used to keep track of the order in which rows are received so that
   * we can work out where to add terminal rows into the filtered rows array when
   * they are not at the start or the end. This is incremented by one for each
   * received row and assigned to the terminal row object.
   */
  uniqueRowIndexCount: number = 0;

  /**
   * Used to store partially received numbers when the data type is a number format.
   * Only relevant for numbers larger than 1 byte, e.g. uint16, int16, float32.
   *
   * Each byte is stored as a separate number in the array. When the array is full,
   * the numbers are combined into a single number and added to the terminal.
   *
   * This buffer must be cleared when:
   * - The terminal is cleared
   * - The number data type is changed
   * - The serial port is closed
   */
  partialNumberBuffer: number[] = [];

  /**
   * Create a new terminal instance.
   *
   * @param id A string identifier for this terminal instance.
   * @param isFocusable If true, the terminal will be allowed to be focused by the user.
   * @param rxSettings RX settings that the terminal will use.
   * @param displaySettings Display settings that the terminal will use.
   * @param onTerminalKeyDown Callback which will be called whenever a key is pressed while the terminal is focused.
   */
  constructor(
    id: string,
    isFocusable: boolean,
    rxSettings: RxSettings,
    displaySettings: DisplaySettings,
    snackbarController: SnackbarController,
    onTerminalKeyDown: ((event: React.KeyboardEvent) => Promise<void>) | null
  ) {
    // Save passed in variables and dependencies
    this.id = id;
    this.isFocusable = isFocusable;
    this.rxSettings = rxSettings;
    this.displaySettings = displaySettings;
    this.snackbarController = snackbarController;
    this.onTerminalKeyDown = onTerminalKeyDown;

    autorun(() => {
      if (!this.rxSettings.ansiEscapeCodeParsingEnabled) {
        // ANSI escape code parsing has been disabled
        // Flush any partial ANSI escape code
        for (let idx = 0; idx < this.partialEscapeCode.length; idx += 1) {
          this._maybeAddVisibleByteAndTimestamp(this.partialEscapeCode[idx].charCodeAt(0), DataDirection.RX);
        }
        this.partialEscapeCode = '';
        this.inAnsiEscapeCode = false;
        this.inCSISequence = false;
        this.inIdleState = true;
      }
    });

    // Register listener for whenever the RX text color is changed
    this.defaultBackgroundColor = '';
    this.defaultTxColor = '';
    this.defaultRxColor = '';
    autorun(() => {
      this.defaultBackgroundColor = this.displaySettings.defaultBackgroundColor.appliedValue;
      this.defaultTxColor = this.displaySettings.defaultTxTextColor.appliedValue;
      this.defaultRxColor = this.displaySettings.defaultRxTextColor.appliedValue;
    });

    this.cursorPosition = [0, 0];

    this.scrollLock = true;
    this.rowToScrollLockTo = 0;
    this.scrollPos = 0;

    this.terminalRows = [];
    this.clear();

    this.inIdleState = true;
    this.inAnsiEscapeCode = false;
    this.partialEscapeCode = '';
    this.inCSISequence = false;
    this.boldOrIncreasedIntensity = false;

    this.currForegroundColorNum = null;
    this.currBackgroundColorNum = null;

    this.isFocused = false;

    // Register listener for whenever the number type is changed, and clear the partial number buffer.
    reaction(() => this.rxSettings.numberType, this.clearPartialNumberBuffer);

    makeAutoObservable(this);
  }

  //======================================================================
  // PUBLIC METHODS
  //======================================================================

  copyAllTextToClipboard() {
    const textToCopy = this.terminalRows
      .map((row) => row.terminalChars.map((char) => char.char).join(''))
      .join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.snackbarController.sendToSnackbar('Copied to clipboard', 'success');
    }).catch(err => {
      this.snackbarController.sendToSnackbar('Failed to copy to clipboard', 'error');
      console.error('Failed to copy text to clipboard:', err);
    });
  }

  get charSizePx() {
    return this.displaySettings.charSizePx.appliedValue;
  }

  get verticalRowPaddingPx() {
    return this.displaySettings.verticalRowPaddingPx.appliedValue;
  }

  /**
   * Computes the height of the terminal in terms of number of characters. This does not include the scrollback buffer.
   */
  get terminalHeightChars() {
    let terminalHeight_chars;
    if (this.displaySettings.terminalHeightMode === TerminalHeightMode.AUTO_HEIGHT) {
      const rowHeight_px = this.displaySettings.charSizePx.appliedValue + this.displaySettings.verticalRowPaddingPx.appliedValue;
      terminalHeight_chars = Math.floor(this.terminalViewHeightPx / rowHeight_px);
      // console.log('terminalHeight_chars=', terminalHeight_chars);
    } else if (this.displaySettings.terminalHeightMode === TerminalHeightMode.FIXED_HEIGHT) {
      terminalHeight_chars = this.displaySettings.terminalHeightChars.appliedValue;
    } else {
      throw Error(`Invalid terminal height mode. terminalHeightMode=${this.displaySettings.terminalHeightMode}`);
    }

    // Make sure it is at least 1
    if (terminalHeight_chars < 1) {
      terminalHeight_chars = 1;
    }
    return terminalHeight_chars;
  }

  /**
   * Called by the React UI when the fixed sized list fires an onScroll event.
   * Locks scroll if the user scrolls forward to the last row. Does not break scroll lock
   * if it is a backwards scroll, as I discovered that this function gets called with the scroll direction
   * = backwards on some computers without the user ever scrolling, causing a big bug. Instead, now we
   * use a onWheel event on a outer list wrapper in the view.
   *
   * @param scrollProps The scroll props passed from the fixed sized list scroll event.
   */
  fixedSizedListOnScroll(scrollProps: ListOnScrollProps) {
    // console.log('fixedSizedListOnScroll() called. scrollProps=', scrollProps);
    // Calculate the total height of all terminal rows
    const totalTerminalRowsHeightPx = this.terminalRows.length * (this.displaySettings.charSizePx.appliedValue + this.displaySettings.verticalRowPaddingPx.appliedValue);

    // If we are at the bottom of the terminal, lock the scroll position
    // to the bottom
    // scrollUpdateWasRequested seems to be true if the list scrolls because of a programmatic call to
    // .scrollToItem(), false if it was because the user moves the mouse wheel
    if (!scrollProps.scrollUpdateWasRequested && scrollProps.scrollDirection == 'forward' && scrollProps.scrollOffset >= totalTerminalRowsHeightPx - this.terminalViewHeightPx) {
      // User has scrolled to the end of the terminal, so lock the scroll position
      this.scrollLock = true;
      // this.rowToScrollLockTo = this.terminalRows.length - 1;
      this.scrollPos = totalTerminalRowsHeightPx - this.terminalViewHeightPx;
      // console.log('User reached end, locking scroll to this.scrollPos: ', this.scrollPos, 'scrollOffset: ', scrollProps.scrollOffset);
      return;
    }

    // User hasn't scrolled to bottom of terminal, so update scroll position
    this.scrollPos = scrollProps.scrollOffset;
    // console.log('scrollPos set to:', this.scrollPos);
  }

  /**
   * Designed to be called from the view whenever the terminal view height changes.
   *
   * @param terminalViewHeightPx The height of the terminal view in pixels.
   */
  setTerminalViewHeightPx(terminalViewHeightPx: number) {
    // console.log('setTerminalViewHeightPx() called. terminalViewHeightPx=', terminalViewHeightPx);
    this.terminalViewHeightPx = terminalViewHeightPx;
  }

  /**
   * Calculates the start and end row indexes that are visible in the viewport.
   *
   * Includes any partial rows, e.g. if rows are only half visible they will be included in
   * this range.
   *
   * @returns An array of [firstRowInViewport, lastRowInViewport].
   */
  _calcRowsInViewport() {
    const rowHeight_px = this.displaySettings.charSizePx.appliedValue + this.displaySettings.verticalRowPaddingPx.appliedValue;

    const firstRowInViewport = Math.floor(this.scrollPos / rowHeight_px);
    const lastRowInViewport = Math.floor((this.scrollPos + this.terminalViewHeightPx) / rowHeight_px);

    return [firstRowInViewport, lastRowInViewport];
  }

  /**
   * Send data to the terminal to be processed and displayed.
   *
   * Data will sent to the correct parser based on the selected data type (e.g.
   * ASCII, HEX).
   *
   * @param data The array of bytes to process.
   * @param direction The direction of the data (TX or RX). This is needed to allow
   *    the user to color the data differently based on the direction.
   */
  parseData(data: Uint8Array, direction: DataDirection) {
    // Parse each character
    // console.log("parseData() called. data=", data);
    // const dataAsStr = new TextDecoder().decode(data);

    // This variable can get modified during the loop, for example if a partial escape code
    // reaches it's length limit, the ESC char is stripped and the remainder of the partial is
    // prepending onto dataAsStr for further processing
    // let dataAsStr = String.fromCharCode.apply(null, Array.from(data));

    if (this.rxSettings.dataType === DataType.ASCII) {
      this._parseAsciiData(data, direction);
    } else if (this.rxSettings.dataType === DataType.NUMBER) {
      this._parseDataAsNumber(data, direction);
    } else {
      throw Error(`Data type ${this.rxSettings.dataType} not supported by parseData().`);
    }

    // Right at the end of adding everything, limit the num. of max. rows in the terminal
    // as determined by the settings
    this._limitNumRows();
  }

  _parseAsciiData(data: Uint8Array, direction: DataDirection) {
    let remainingData: number[] = [];
    for (let idx = 0; idx < data.length; idx += 1) {
      remainingData.push(data[idx]);
    }

    while (true) {
      // Remove char from start of remaining data
      let rxByte = remainingData.shift();
      if (rxByte === undefined) {
        // We've processed all received bytes, let's get outta here!
        break;
      }

      // const char = dataAsStr[idx];
      // This console print is very useful when debugging
      // console.log(`char: "${char}", 0x${char.charCodeAt(0).toString(16)}`);

      //========================================================================
      // NEW LINE HANDLING
      //========================================================================

      const newLineBehavior = this.rxSettings.newLineCursorBehavior;
      // Don't want to interpret new lines if we are half-way through processing an ANSI escape code
      if (this.inIdleState && rxByte === '\n'.charCodeAt(0)) {
        // If swallow is disabled, print the new line character. Do this before
        // performing any cursor movements, as we want the new line char to
        // at the end of the existing line, rather than the start of the new
        // line
        if (!this.rxSettings.swallowNewLine) {
          this._maybeAddVisibleByteAndTimestamp(rxByte, direction);
        }

        // Based of the set new line behavior in the settings, perform the appropriate action
        if (newLineBehavior == NewLineCursorBehavior.DO_NOTHING) {
          // Don't move the cursor anywhere.
          continue;
        } else if (newLineBehavior == NewLineCursorBehavior.NEW_LINE) {
          // Just move the cursor down 1 line, do not move the cursor
          // back to the beginning of the line (strict new line only)
          this._cursorDown(1);
          continue;
        } else if (newLineBehavior == NewLineCursorBehavior.CARRIAGE_RETURN_AND_NEW_LINE) {
          // this.moveToNewLine();
          // Move left FIRST, then down. This is slightly more efficient
          // as moving down first will typically mean padding with spaces if the row
          // is empty to put the cursor at the correct column position
          this._cursorLeft(this.cursorPosition[1]);
          this._cursorDown(1);
          continue;
        } else {
          throw Error('Invalid new line behavior. newLineBehavior=' + newLineBehavior);
        }
      }

      //========================================================================
      // CARRIAGE RETURN HANDLING
      //========================================================================

      const carriageReturnCursorBehavior = this.rxSettings.carriageReturnCursorBehavior;
      // Don't want to interpret new lines if we are half-way through processing an ANSI escape code
      if (this.inIdleState && rxByte === '\r'.charCodeAt(0)) {
        // If swallow is disabled, print the carriage return character. Do this before
        // performing any cursor movements, as we want the carriage return char to
        // at the end line, rather than at the start
        if (!this.rxSettings.swallowCarriageReturn) {
          this._maybeAddVisibleByteAndTimestamp(rxByte, direction);
        }

        // Based of the set carriage return cursor behavior in the settings, perform the appropriate action
        if (carriageReturnCursorBehavior == CarriageReturnCursorBehavior.DO_NOTHING) {
          // Don't move the cursor anywhere.
          continue;
        } else if (carriageReturnCursorBehavior == CarriageReturnCursorBehavior.CARRIAGE_RETURN) {
          this._cursorLeft(this.cursorPosition[1]);
          continue;
        } else if (carriageReturnCursorBehavior == CarriageReturnCursorBehavior.CARRIAGE_RETURN_AND_NEW_LINE) {
          // Move left FIRST (all the way to column 0), then down. This is slightly more efficient
          // as moving down first will typically mean padding with spaces if the row
          // is empty to put the cursor at the correct column position
          this._cursorLeft(this.cursorPosition[1]);
          this._cursorDown(1);
          continue;
        } else {
          throw Error('Invalid carriage return cursor behavior. carriageReturnCursorBehavior: ' + carriageReturnCursorBehavior);
        }
      }

      //========================================================================
      // TAB HANDLING
      //========================================================================
      if (this.inIdleState && rxByte === 0x09) { // 0x09 is the ASCII code for tab
        const tabStopWidth = this.displaySettings.tabStopWidth.appliedValue;
        const currentColumn = this.cursorPosition[1];
        let spacesToNextTabStop = tabStopWidth - (currentColumn % tabStopWidth);

        // Ensure tab does not go beyond the terminal width
        const remainingColumns = this.displaySettings.terminalWidthChars.appliedValue - currentColumn;
        if (spacesToNextTabStop > remainingColumns) {
          spacesToNextTabStop = remainingColumns;
        }

        this._cursorRight(spacesToNextTabStop);
        // Optionally, if you want to print the tab character itself or spaces:
        // for (let i = 0; i < spacesToNextTabStop; i++) {
        //   this._maybeAddVisibleByteAndTimestamp(' '.charCodeAt(0), direction);
        // }
        continue;
      }

      if (rxByte === 0x1b) {
        // console.log('Start of escape sequence found!');
        this._resetEscapeCodeParserState();
        this.inAnsiEscapeCode = true;
        this.inIdleState = false;
      }

      // Process ANSI escape codes
      if (this.rxSettings.ansiEscapeCodeParsingEnabled && this.inAnsiEscapeCode) {
        // Add received char to partial escape code
        this.partialEscapeCode += String.fromCharCode(rxByte);
        // console.log('partialEscapeCode=', this.partialEscapeCode);
        if (this.partialEscapeCode === '\x1B[') {
          this.inCSISequence = true;
        }

        if (this.inCSISequence) {
          // console.log('In CSI sequence');
          // Wait for alphabetic character to end CSI sequence
          const charStr = String.fromCharCode(rxByte);
          if (charStr.toUpperCase() !== charStr.toLowerCase()) {
            // console.log(
            //   'Received terminating letter of CSI sequence! Escape code = ',
            //   this.partialEscapeCode
            // );
            this._parseCSISequence(this.partialEscapeCode);
            this._resetEscapeCodeParserState();
            this.inIdleState = true;
          }
        }

        // When we get to the end of parsing, check that if we are still
        // parsing an escape code, and we've hit the escape code length limit,
        // then bail on escape code parsing. Emit partial code as data and go back to IDLE
        const maxEscapeCodeLengthChars = this.rxSettings.maxEscapeCodeLengthChars.appliedValue;
        // const maxEscapeCodeLengthChars = 10;

        if (this.inAnsiEscapeCode && this.partialEscapeCode.length === maxEscapeCodeLengthChars) {
          console.log(`Reached max. length (${maxEscapeCodeLengthChars}) for partial escape code.`);
          // this.app.snackbar.sendToSnackbar(
          //   `Reached max. length (${maxEscapeCodeLengthChars}) for partial escape code.`,
          //   'warning');
          // Remove the ESC byte, and then prepend the rest onto the data to be processed
          // Got to shift them in backwards
          for (let partialIdx = this.partialEscapeCode.length - 1; partialIdx >= 1; partialIdx -= 1) {
            remainingData.unshift(this.partialEscapeCode[partialIdx].charCodeAt(0));
          }
          this._resetEscapeCodeParserState();
          this.inIdleState = true;
        }
        continue;
      }

      // If we get here we are not receiving an ANSI escape code,
      // so send byte to be printed to the terminal.
      this._maybeAddVisibleByteAndTimestamp(rxByte, direction);
    }
  }

  /**
   * Parses a CSI sequence. Should be called once all of the CSI sequence has been received.
   *
   * @param ansiEscapeCode Must be in the form "ESC[<remaining data>". This function will validate
   *    the rest of the code, and perform actions on the terminal as required.
   */
  _parseCSISequence(ansiEscapeCode: string) {
    // The last char is used to work out what kind of CSI sequence it is
    const lastChar = ansiEscapeCode.slice(ansiEscapeCode.length - 1);
    //============================================================
    // CUU Cursor Up
    //============================================================
    if (lastChar === 'A') {
      // Extract number in the form ESC[nA
      let numberStr = ansiEscapeCode.slice(2, ansiEscapeCode.length - 1);
      // If there was no number provided, assume it was '1' (default)
      if (numberStr === '') {
        numberStr = '1';
      }
      let numRowsToGoUp = parseInt(numberStr, 10);
      if (Number.isNaN(numRowsToGoUp)) {
        console.error(`Number string in SGR code could not converted into integer. numberStr=${numberStr}.`);
        return;
      }
      this._cursorUp(numRowsToGoUp);
    } else if (lastChar === 'C') {
      //============================================================
      // CUC - Cursor Forward
      //============================================================
      // Extract number in the form ESC[nA
      let numberStr = ansiEscapeCode.slice(2, ansiEscapeCode.length - 1);
      // If there was no number provided, assume it was '1' (default)
      if (numberStr === '') {
        numberStr = '1';
      }
      const numColsToGoRight = parseInt(numberStr, 10);
      if (Number.isNaN(numColsToGoRight)) {
        console.error(`Number string in SGR code could not converted into integer. numberStr=${numberStr}.`);
        return;
      }
      this._cursorRight(numColsToGoRight);
    } else if (lastChar === 'D') {
      //============================================================
      // CUB Cursor Back
      //============================================================
      // Extract number in the form ESC[nA
      let numberStr = ansiEscapeCode.slice(2, ansiEscapeCode.length - 1);
      // If there was no number provided, assume it was '1' (default)
      if (numberStr === '') {
        numberStr = '1';
      }
      const numColsToGoLeft = parseInt(numberStr, 10);
      if (Number.isNaN(numColsToGoLeft)) {
        console.error(`Number string in SGR code could not converted into integer. numberStr=${numberStr}.`);
        return;
      }
      this._cursorLeft(numColsToGoLeft);
    } else if (lastChar === 'J') {
      //============================================================
      // ED Erase in Display
      //============================================================
      // Syntax: ESC[nJ where n is a number:
      // n=0: Clear from cursor to end of screen (default if no number provided)
      // n=1: Clear from cursor to start of screen
      // n=2: Clear entire screen
      // n=3: Clear entire screen and delete all lines saved in the scrollback buffer
      // Extract number:
      let numberStr = ansiEscapeCode.slice(2, ansiEscapeCode.length - 1);
      // If there was no number provided, assume it was '0' (default)
      if (numberStr === '') {
        numberStr = '0';
      }
      const numberN = parseInt(numberStr, 10);
      if (Number.isNaN(numberN)) {
        console.error(`Number string in Erase in Display (ED) CSI sequence could not converted into integer. numberStr=${numberStr}.`);
        return;
      }
      if (numberN === 0) {
        // Clear from cursor to end of screen. We assume this mean from cursor location to end
        // of all data
        this._clearDataFromCursorToEndOfScreen();
      } else if (numberN === 1) {
        // Clear from cursor to start of screen
        // User could be scrolled anywhere in the scrollback buffer, we don't want to
        // consider the viewport. Rather, assume cursor is in the last N rows that
        // would make up the viewport if scrolled to the bottom.
        // const rowHeight_px = this.displaySettings.charSizePx.appliedValue + this.displaySettings.verticalRowPaddingPx.appliedValue;
        // const numRowsInViewport = Math.floor(this.terminalViewHeightPx / rowHeight_px);
        // Find first row which would be considered part of the terminal if you
        // excluded scrollback
        let startRowIdx = this.terminalRows.length - this.terminalHeightChars;
        if (startRowIdx < 0) {
          startRowIdx = 0;
        }
        // Make sure the cursor is not above the first row
        if (this.cursorPosition[0] < startRowIdx) {
          console.warn('Got ESC[1J (erase in display, from start of screen to cursor) escape code. Cursor is above the first row that would be considered part of the terminal if you excluded scrollback. Not erasing anything.');
          return;
        }
        // Entirely clear all rows from the start row to the row with the cursor
        for (let rowIdx = startRowIdx; rowIdx < this.cursorPosition[0]; rowIdx += 1) {
          this.terminalRows[rowIdx].terminalChars = [];
          this._addOrRemoveRowFromFilteredRows(rowIdx);
        }
        // Turns all chars into spaces on the row with the cursor up to the cursor position
        const currRow = this.terminalRows[this.cursorPosition[0]];
        for (let charIdx = 0; charIdx < this.cursorPosition[1]; charIdx += 1) {
          currRow.terminalChars[charIdx].char = ' ';
          currRow.terminalChars[charIdx].forCursor = false;
          currRow.terminalChars[charIdx].style = '';
        }
      } else if (numberN === 2) {
        // Erase entire screen
        // User could be scrolled anywhere in the scrollback buffer, we don't want to just
        // clear the rows being displayed.
        // 1. Clear all data at or after cursor
        // 2. Move cursor down one row to new row
        // 3. Insert enough empty rows after row with cursor to fill the screen
        this._clearDataFromCursorToEndOfScreen();
        this._cursorDown(1);
        // Add empty rows to fill the entire terminal (ignoring scrollback buffer)
        // Subtract 1 because we already added a row with the cursor
        const numRowsToAdd = this.terminalHeightChars - 1;
        // Might not need to add any rows if terminal height is very small
        // (or 0 if hidden)
        if (numRowsToAdd > 0) {
          for (let idx = 0; idx < numRowsToAdd; idx += 1) {
            this.terminalRows.push(new TerminalRow(this.uniqueRowIndexCount, false));
            this.uniqueRowIndexCount += 1;
            // Add to filtered rows if new rows match the filter
            if (this._doesRowPassFilter(this.terminalRows.length - 1)) {
              this.filteredTerminalRows.push(this.terminalRows[this.terminalRows.length - 1]);
            }
          }
        }
      } else if (numberN === 3) {
        // Clear entire screen and delete all lines saved in the scrollback buffer
        this.clear();
      } else {
        console.error(`Number (${numberN}) passed to Erase in Display (ED) CSI sequence not supported.`);
      }
    } else if (lastChar === 'm') {
      // SGR
      // ==============================
      // console.log('Found m, select graphic rendition code');
      // https://en.wikipedia.org/wiki/ANSI_escape_code#SGR
      // Allowed form: ESC[<first number>;<second number>;...m

      // Remove "ESC["" from start and "m" from end
      let numbersAndSemicolons = ansiEscapeCode.slice(2, ansiEscapeCode.length - 1);

      // Check if there is nothing between the ESC[ and the m, i.e.
      // the entire escape code was just ESC[m. In this case, treat
      // it the same as ESC[0m]
      if (numbersAndSemicolons === '') {
        numbersAndSemicolons = '0';
      }
      // Split into individual codes
      const numberCodeStrings = numbersAndSemicolons.split(';');
      for (let idx = 0; idx < numberCodeStrings.length; idx += 1) {
        const numberCodeString = numberCodeStrings[idx];
        const numberCode = parseInt(numberCodeString, 10);
        if (Number.isNaN(numberCode)) {
          console.error(`Number string in SGR code could not converted into integer. numberCodeString=${numberCodeString}.`);
          // Skip processing this number, but continue with the rest
          continue;
        }
        // console.log('numberCode=', numberCode);
        if (numberCode === 0) {
          // console.log('Clearing all SGR styles...');
          this.clearStyle();
        } else if (numberCode === 1) {
          // Got the "bold or increased intensity" code
          this.boldOrIncreasedIntensity = true;
        } else if (numberCode >= 30 && numberCode <= 37) {
          this.currForegroundColorNum = numberCode;
        } else if (numberCode >= 40 && numberCode <= 47) {
          this.currBackgroundColorNum = numberCode;
        } else if (numberCode >= 90 && numberCode <= 97) {
          // Bright foreground colors
          this.currForegroundColorNum = numberCode;
        } else if (numberCode >= 100 && numberCode <= 107) {
          // Bright background colors
          this.currBackgroundColorNum = numberCode;
        } else {
          console.log(`Number ${numberCode} provided to SGR control sequence unsupported.`);
        }
      }
    }
  }

  _clearDataFromCursorToEndOfScreen() {
    // Clear from cursor to end of screen. We assume this mean from cursor location to end
    // of all data
    // First, remove all chars at the cursor position or beyond
    // on the current row
    const currRow = this.terminalRows[this.cursorPosition[0]];
    const numCharsToDeleteOnCurrRow = currRow.terminalChars.length - this.cursorPosition[1];
    currRow.terminalChars.splice(this.cursorPosition[1], numCharsToDeleteOnCurrRow);
    // Add cursor char at current position
    const cursorChar = new TerminalChar();
    cursorChar.char = ' ';
    cursorChar.forCursor = true;
    currRow.terminalChars.push(cursorChar);
    // The cursor has not changed row so we do not need to check if this row
    // still passes the filter

    // Remove all soon to be deleted rows from the filtered rows array (if they are present)
    for (let idx = this.cursorPosition[0] + 1; idx < this.terminalRows.length; idx += 1) {
      this._removeFromFilteredRows(this.terminalRows[idx]);
    }
    // Now remove all rows past the one the cursor is on
    this.terminalRows.splice(this.cursorPosition[0] + 1);
  }

  /**
   * Parses received data and displays it as numbers on the terminal.
   *
   * The exact formatting (e.g. hex vs. uint8 vs int16 vs. ....) depends on the RX settings.
   *
   * @param data The data to parse and display.
   */
  _parseDataAsNumber(data: Uint8Array, direction: DataDirection) {
    // console.log("_parseDataAsNumber() called. data=", data, "length: ", data.length, "selectedNumberType=", this.rxSettings.numberType);
    for (let idx = 0; idx < data.length; idx += 1) {
      const rxByte = data[idx];

      // Add received byte to number array
      this.partialNumberBuffer.push(rxByte);

      let numberAsBigInt = BigInt(0); // This is used for the new line on match feature
      let numberStr = ''; // This is used for displaying the number in the terminal
      //========================================================================
      // CREATE NUMBER PART OF STRING
      //========================================================================
      const isLittleEndian = this.rxSettings.endianness === Endianness.LITTLE_ENDIAN;
      // HEX
      //============
      if (this.rxSettings.numberType === NumberType.HEX) {
        if (this.partialNumberBuffer.length < this.rxSettings.numBytesPerHexNumber.appliedValue) {
          // Wait for enough bytes for the hex number as specified by the user
          continue;
        }
        // Got enough bytes, loop through and convert to hex
        for (let idx = 0; idx < this.partialNumberBuffer.length; idx += 1) {
          let byteIdx;
          if (this.rxSettings.endianness === Endianness.LITTLE_ENDIAN) {
            byteIdx = this.partialNumberBuffer.length - 1 - idx;
          } else if (this.rxSettings.endianness === Endianness.BIG_ENDIAN) {
            byteIdx = idx;
          } else {
            throw Error('Invalid endianness setting: ' + this.rxSettings.endianness);
          }
          let partialHexString = this.partialNumberBuffer[byteIdx].toString(16);
          partialHexString = partialHexString.padStart(2, '0');
          numberStr += partialHexString;
        }
        this.partialNumberBuffer = [];
        // Set case of hex string
        if (this.rxSettings.hexCase === HexCase.UPPERCASE) {
          numberStr = numberStr.toUpperCase();
        } else if (this.rxSettings.hexCase === HexCase.LOWERCASE) {
          numberStr = numberStr.toLowerCase();
        } else {
          throw Error('Invalid hex case setting: ' + this.rxSettings.hexCase);
        }
        numberAsBigInt = BigInt('0x' + numberStr);
        // "0x" is added later after the padding step if enabled
      }
      // UINT8
      //============
      else if (this.rxSettings.numberType === NumberType.UINT8) {
        // Even though for a uint8 we could directly convert the byte to a string,
        // we use this Array method to be consistent with the other number types
        const uint8Array = Uint8Array.from(this.partialNumberBuffer);
        const dataView = new DataView(uint8Array.buffer);
        numberStr = dataView.getUint8(0).toString(10);
        numberAsBigInt = BigInt(dataView.getUint8(0));
        this.partialNumberBuffer = [];
      }
      // INT8
      //============
      else if (this.rxSettings.numberType === NumberType.INT8) {
        const uint8Array = Uint8Array.from(this.partialNumberBuffer);
        const dataView = new DataView(uint8Array.buffer);
        numberStr = dataView.getInt8(0).toString(10);
        numberAsBigInt = BigInt(dataView.getUint8(0));
        this.partialNumberBuffer = [];
      }
      // UINT16
      //============
      else if (this.rxSettings.numberType === NumberType.UINT16) {
        if (this.partialNumberBuffer.length < 2) {
          // We need to wait for another byte to come in before we can convert
          // the two bytes to a single number
          continue;
        }
        // Convert two bytes to number, taking into account the endianness setting
        const uint8Array = Uint8Array.from(this.partialNumberBuffer);
        const dataView = new DataView(uint8Array.buffer);
        numberStr = dataView.getUint16(0, isLittleEndian).toString(10);
        numberAsBigInt = BigInt(dataView.getUint16(0, isLittleEndian));
        this.partialNumberBuffer = [];
      }
      // INT16
      //============
      else if (this.rxSettings.numberType === NumberType.INT16) {
        if (this.partialNumberBuffer.length < 2) {
          // We need to wait for another byte to come in before we can convert
          // the two bytes to a single number
          continue;
        }
        // Convert two bytes to number, taking into account the endianness setting
        const uint8Array = Uint8Array.from(this.partialNumberBuffer);
        const dataView = new DataView(uint8Array.buffer);
        numberStr = dataView.getInt16(0, isLittleEndian).toString(10);
        numberAsBigInt = BigInt(dataView.getUint16(0, isLittleEndian));
        this.partialNumberBuffer = [];
      }
      // UINT32
      //============
      else if (this.rxSettings.numberType === NumberType.UINT32) {
        if (this.partialNumberBuffer.length < 4) {
          continue;
        }
        const uint8Array = Uint8Array.from(this.partialNumberBuffer);
        const dataView = new DataView(uint8Array.buffer);
        numberStr = dataView.getUint32(0, isLittleEndian).toString(10);
        numberAsBigInt = BigInt(dataView.getUint32(0, isLittleEndian));
        this.partialNumberBuffer = [];
      }
      // INT32
      //============
      else if (this.rxSettings.numberType === NumberType.INT32) {
        if (this.partialNumberBuffer.length < 4) {
          continue;
        }
        const uint8Array = Uint8Array.from(this.partialNumberBuffer);
        const dataView = new DataView(uint8Array.buffer);
        numberStr = dataView.getInt32(0, isLittleEndian).toString(10);
        numberAsBigInt = BigInt(dataView.getUint32(0, isLittleEndian));
        this.partialNumberBuffer = [];
      }
      // UINT64
      //============
      else if (this.rxSettings.numberType === NumberType.UINT64) {
        if (this.partialNumberBuffer.length < 8) {
          continue;
        }
        const uint8Array = Uint8Array.from(this.partialNumberBuffer);
        const dataView = new DataView(uint8Array.buffer);
        numberStr = dataView.getBigUint64(0, isLittleEndian).toString(10);
        numberAsBigInt = BigInt(dataView.getBigUint64(0, isLittleEndian));
        this.partialNumberBuffer = [];
      }
      // INT64
      //============
      else if (this.rxSettings.numberType === NumberType.INT64) {
        if (this.partialNumberBuffer.length < 8) {
          continue;
        }
        const uint8Array = Uint8Array.from(this.partialNumberBuffer);
        const dataView = new DataView(uint8Array.buffer);
        numberStr = dataView.getBigInt64(0, isLittleEndian).toString(10);
        numberAsBigInt = BigInt(dataView.getBigInt64(0, isLittleEndian));
        this.partialNumberBuffer = [];
      }
      // FLOAT32
      //============
      else if (this.rxSettings.numberType === NumberType.FLOAT32) {
        if (this.partialNumberBuffer.length < 4) {
          continue;
        }
        const uint8Array = Uint8Array.from(this.partialNumberBuffer);
        const dataView = new DataView(uint8Array.buffer);
        // toFixed gives a fixed number of decimal places
        // toString gives a variable amount depending on the number
        const number = dataView.getFloat32(0, isLittleEndian);
        if (this.rxSettings.floatStringConversionMethod === FloatStringConversionMethod.TO_STRING) {
          numberStr = number.toString();
        } else if (this.rxSettings.floatStringConversionMethod === FloatStringConversionMethod.TO_FIXED) {
          numberStr = number.toFixed(this.rxSettings.floatNumOfDecimalPlaces.appliedValue);
        }
        numberAsBigInt = BigInt(dataView.getUint32(0, isLittleEndian));
        this.partialNumberBuffer = [];
      }
      // FLOAT64
      //============
      else if (this.rxSettings.numberType === NumberType.FLOAT64) {
        if (this.partialNumberBuffer.length < 8) {
          continue;
        }
        const uint8Array = Uint8Array.from(this.partialNumberBuffer);
        const dataView = new DataView(uint8Array.buffer);
        // toFixed gives a fixed number of decimal places
        // toString gives a variable amount depending on the number
        const number = dataView.getFloat64(0, isLittleEndian);
        if (this.rxSettings.floatStringConversionMethod === FloatStringConversionMethod.TO_STRING) {
          numberStr = number.toString();
        } else if (this.rxSettings.floatStringConversionMethod === FloatStringConversionMethod.TO_FIXED) {
          numberStr = number.toFixed(this.rxSettings.floatNumOfDecimalPlaces.appliedValue);
        }
        numberAsBigInt = BigInt(dataView.getBigUint64(0, isLittleEndian));
        this.partialNumberBuffer = [];
      }
      // INVALID
      //============
      else {
        throw Error('Invalid number type: ' + this.rxSettings.numberType);
      }
      // console.log('Converted numberStr=', numberStr);

      //========================================================================
      // ADD PADDING
      //========================================================================
      if (this.rxSettings.padValues) {
        // If padding is set to automatic, pad to the largest possible value for the selected number type
        let paddingChar = ' ';
        if (this.rxSettings.paddingCharacter === PaddingCharacter.ZERO) {
          paddingChar = '0';
        } else if (this.rxSettings.paddingCharacter === PaddingCharacter.WHITESPACE) {
          paddingChar = ' ';
        } else {
          throw Error('Invalid padding character setting: ' + this.rxSettings.paddingCharacter);
        }
        // If padding is set to automatic, pad to the largest possible value for the selected number type
        let numPaddingChars = this.rxSettings.numPaddingChars.appliedValue;
        if (numPaddingChars === -1) {
          if (this.rxSettings.numberType === NumberType.HEX) {
            numPaddingChars = 2;
          } else if (this.rxSettings.numberType === NumberType.UINT8) {
            // Numbers 0 to 255, so 3 chars
            numPaddingChars = 3;
          } else if (this.rxSettings.numberType === NumberType.INT8) {
            // Numbers -128 to 127, so 4 chars
            numPaddingChars = 4;
          } else if (this.rxSettings.numberType === NumberType.UINT16) {
            // Numbers 0 to 65535, so 5 chars
            numPaddingChars = 5;
          } else if (this.rxSettings.numberType === NumberType.INT16) {
            // Numbers -32768 to 32767, so 6 chars
            numPaddingChars = 6;
          } else if (this.rxSettings.numberType === NumberType.UINT32) {
            // Numbers 0 to 4294967296, so 10 chars
            numPaddingChars = 10;
          } else if (this.rxSettings.numberType === NumberType.INT32) {
            // Numbers -2147483648 to 2147483647, so 11 chars
            numPaddingChars = 11;
          } else if (this.rxSettings.numberType === NumberType.UINT64) {
            // Numbers 0 to 18,446,744,073,709,551,615, so 20 chars
            numPaddingChars = 20;
          } else if (this.rxSettings.numberType === NumberType.INT64) {
            // Numbers -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807, so 20 chars
            numPaddingChars = 20;
          } else if (this.rxSettings.numberType === NumberType.FLOAT32) {
            // Arbitrarily choose 6 for floats if it's set to "auto" (-1)
            numPaddingChars = 6;
          } else if (this.rxSettings.numberType === NumberType.FLOAT64) {
            numPaddingChars = 6;
          } else {
            throw Error('Invalid number type: ' + this.rxSettings.numberType);
          }
        }

        // Handle negative numbers combined with zeroes padding by padding after the negative sign
        // (padding negative numbers with spaces is handled the same way as positive numbers, the padding
        // goes before the negative sign).
        if (this.rxSettings.paddingCharacter == PaddingCharacter.ZERO && numberStr[0] === '-') {
          numberStr = numberStr.slice(1);
          numPaddingChars -= 1; // Negative sign takes up one padding char
          numberStr = '-' + numberStr.padStart(numPaddingChars, paddingChar);
        } else {
          // Number must be positive, can pad normally
          numberStr = numberStr.padStart(numPaddingChars, paddingChar);
        }
      }
      // console.log('After padding, numberStr=', numberStr);

      // Add 0x if hex and setting is enabled
      if (this.rxSettings.numberType === NumberType.HEX && this.rxSettings.prefixHexValuesWith0x) {
        numberStr = '0x' + numberStr;
      }

      //========================================================================
      // PREVENT WRAPPING
      //========================================================================

      // Only prevent numerical value wrapping mid-value if:
      // 1) Setting is enabled
      // 2) The terminal column width is high enough to fit an entire value in it
      if (this.rxSettings.preventValuesWrappingAcrossRows && this.displaySettings.terminalWidthChars.appliedValue >= numberStr.length) {
        // Create a new terminal row if the hex value will not fit on existing row
        const currRow = this.terminalRows[this.cursorPosition[0]];
        const numColsLeftOnRow = this.displaySettings.terminalWidthChars.appliedValue - this.cursorPosition[1];
        if (numberStr.length > numColsLeftOnRow) {
          // Move cursor to next row
          this._cursorDown(1, true);
          // Move cursor to start of row
          this._cursorLeft(this.cursorPosition[1]);
        }
      }

      //========================================================================
      // NEWLINE NEEDED?
      //========================================================================

      // Work out if we need to insert a new line because the numerical value matches the new line value
      // in the settings
      let insertNewLine = false;
      if (this.rxSettings.insertNewLineOnMatchedValue) {
        const valueToInsertNewLineAsNum = BigInt('0x' + this.rxSettings.newLineMatchValueAsHex.appliedValue);
        if (numberAsBigInt == valueToInsertNewLineAsNum) {
          insertNewLine = true;
        }
      }

      if (insertNewLine && this.rxSettings.newLinePlacementOnHexValue === NewLinePlacementOnHexValue.BEFORE) {
        // Insert new line before hex value
        this._cursorDown(1, false); // Not due to wrapping
        this._cursorLeft(this.cursorPosition[1]);
      }

      // Add to string to the the terminal
      for (let charIdx = 0; charIdx < numberStr.length; charIdx += 1) {
        const charCode = numberStr.charCodeAt(charIdx);
        this._maybeAddVisibleByteAndTimestamp(numberStr.charCodeAt(charIdx), direction);
      }
      // Append the hex separator string
      for (let charIdx = 0; charIdx < this.rxSettings.numberSeparator.appliedValue.length; charIdx += 1) {
        this._maybeAddVisibleByteAndTimestamp(this.rxSettings.numberSeparator.appliedValue.charCodeAt(charIdx), direction);
      }

      if (insertNewLine && this.rxSettings.newLinePlacementOnHexValue === NewLinePlacementOnHexValue.AFTER) {
        // Insert new line after hex value
        this._cursorDown(1, false); // Not due to wrapping
        this._cursorLeft(this.cursorPosition[1]);
      }
    } // for (let idx = 0; idx < data.length; idx += 1) {
  }

  /**
   * Moves the cursor left the specified number of columns. Does not move the cursor any further
   * if it reaches column 0.
   * @param numCols The number of columns to move left.
   * @returns
   */
  _cursorLeft(numCols: number) {
    // Cap number columns to go left
    const currCursorColIdx = this.cursorPosition[1];
    let numColsToLeftAdjusted = numCols;
    if (numCols > currCursorColIdx) {
      numColsToLeftAdjusted = currCursorColIdx;
    }
    // Check if we actually need to move
    if (numColsToLeftAdjusted === 0) {
      return;
    }
    const currRow = this.terminalRows[this.cursorPosition[0]];
    // Check if terminal char we are moving from is only for cursor, and
    // is so, delete it
    if (currRow.terminalChars[this.cursorPosition[1]].forCursor) {
      currRow.terminalChars.splice(this.cursorPosition[1], 1);
    }
    this.cursorPosition[1] -= numColsToLeftAdjusted;
  }

  /**
   * Moves the cursor right the specified number of columns. Does not move the cursor any further
   * if it reaches the end of the terminal width.
   *
   * @param numCols Number of columns to move right.
   */
  _cursorRight(numCols: number) {
    // Go right one character at a time and perform various checks along the way
    for (let numColsGoneRight = 0; numColsGoneRight < numCols; numColsGoneRight += 1) {
      // Never exceed the specified terminal width when going right
      if (this.cursorPosition[1] >= this.displaySettings.terminalWidthChars.appliedValue) {
        return;
      }
      // If we reach here, we can go right by at least 1

      // If we are moving off a character which was specifically for the cursor, now we consider it an actual space, and so set forCursor to false
      const currRow = this.terminalRows[this.cursorPosition[0]];
      const existingChar = currRow.terminalChars[this.cursorPosition[1]];
      if (existingChar.forCursor) {
        existingChar.forCursor = false;
      }

      this.cursorPosition[1] += 1;
      // If there is no character here, add one for cursor
      if (this.cursorPosition[1] === currRow.terminalChars.length) {
        const spaceTerminalChar = new TerminalChar();
        spaceTerminalChar.char = ' ';
        spaceTerminalChar.forCursor = true;
        currRow.terminalChars.push(spaceTerminalChar);
      }
    }
  }

  /**
   * Moves the cursor up the specified number of rows. Does not move the cursor up
   * into the scrollback buffer, so that it behaves like a proper terminal.
   * @param numRows The number of rows to move up.
   */
  _cursorUp(numRows: number) {
    // Go up one row at a time and perform various checks along the way
    for (let numRowsGoneUp = 0; numRowsGoneUp < numRows; numRowsGoneUp += 1) {
      // Never go above the first row!
      if (this.cursorPosition[0] === 0) {
        return;
      }
      // Never go into the scrollback buffer
      // e.g. 10 terminal rows, terminal height is 2, cursor pos would stop at 7
      if (this.cursorPosition[0] <= this.terminalRows.length - this.terminalHeightChars) {
        return;
      }
      // If we reach here, we can go up by at least 1
      const oldRowIdx = this.cursorPosition[0];

      // If we are moving off a character which was specifically for the cursor, now we consider it an actual space, and so set forCursor to false
      const currRow = this.terminalRows[oldRowIdx];
      const existingChar = currRow.terminalChars[this.cursorPosition[1]];
      if (existingChar.forCursor) {
        existingChar.forCursor = false;
      }

      const newRowIdx = oldRowIdx - 1;
      // Update cursor to new row
      this.cursorPosition[0] = newRowIdx;

      // The row we are moving off might no longer pass the filter, if it was only
      // passing because the cursor was on it
      if (!this._doesRowPassFilter(oldRowIdx)) {
        const idxOfRowToRemove = this.filteredTerminalRows.indexOf(this.terminalRows[oldRowIdx]);
        this.filteredTerminalRows.splice(idxOfRowToRemove, 1);
      }

      const newRow = this.terminalRows[newRowIdx];
      // Add empty spaces in this new row (if needed) up to the current cursor column position
      while (this.cursorPosition[1] >= newRow.terminalChars.length) {
        const newTerminalChar = new TerminalChar();
        newTerminalChar.char = ' ';
        // newTerminalChar.forCursor = true;
        newRow.terminalChars.push(newTerminalChar);
      }

      // Because the cursor is now on the row above what it used to be on,
      // we need to make sure it is in the filtered rows array
      this._addToFilteredRows(this.terminalRows[newRowIdx]);
    }
  }

  /**
   * Moves the cursor down the specified number of rows, creating new rows if needed (if passing the last
   * existing row), and adding empty spaces in the new rows up (padding) to the current cursor column position.
   *
   * @param numRows The number of rows to move down.
   * @param isDueToWrapping True if this cursor movement was due to the previous row running out of columns to place text.
   */
  _cursorDown(numRows: number, isDueToWrapping: boolean = false) {
    // Go down one row at a time and perform various checks along the way
    for (let numRowsGoneDown = 0; numRowsGoneDown < numRows; numRowsGoneDown += 1) {
      // If we are moving off a character which was specifically for the cursor, now we consider it an actual space, and so set forCursor to false
      const currRow = this.terminalRows[this.cursorPosition[0]];
      const existingChar = currRow.terminalChars[this.cursorPosition[1]];
      if (existingChar.forCursor) {
        existingChar.forCursor = false;
      }

      // Now move cursor position down 1 row
      this.cursorPosition[0] += 1;

      // We could have just been showing the row the cursor position was on
      // just because the cursor was on it. Check to see if it actually matches
      // the filter text (this function uses cursorPosition, so we make sure this
      // code is below the cursorPosition update)
      // We don't need to handle the situation in where it does pass the filter, because
      // we now the tow already exists in filteredTerminalRows
      if (!this._doesRowPassFilter(this.cursorPosition[0] - 1)) {
        const idxOfRowToRemove = this.filteredTerminalRows.indexOf(this.terminalRows[this.cursorPosition[0] - 1]);
        this.filteredTerminalRows.splice(idxOfRowToRemove, 1);
      }

      // If this pushes us past the last existing row, add a new one
      if (this.cursorPosition[0] === this.terminalRows.length) {
        const newRow = new TerminalRow(this.uniqueRowIndexCount, isDueToWrapping);
        this.uniqueRowIndexCount += 1;
        this.terminalRows.push(newRow);
        // Because we are the end of the terminal rows, we can just add the row to the
        // end of the filtered terminal rows. This is an optimization which is faster than
        // using the unique IDs to find the correct position in the filteredTerminalRows array
        // and this is a very common operation
        this.filteredTerminalRows.push(newRow);
      } else {
        // We need to add this row into the filtered rows array if it's not already
        // in it. Also, because we are not at the end of the terminal rows, we can't
        // just add the row to the end of the filteredTerminalRows array, we need to
        // find the correct position using the unique IDs
        // TODO
        // this._filterRowAsNeeded(this.cursorPosition[0]);
      }

      const newRow = this.terminalRows[this.cursorPosition[0]];
      // Add empty spaces in this new row (if needed) up to the current cursor column position
      while (this.cursorPosition[1] >= newRow.terminalChars.length) {
        const newTerminalChar = new TerminalChar();
        newTerminalChar.char = ' ';
        newRow.terminalChars.push(newTerminalChar);
      }
    }
  }

  /**
   * Adds a visible character to the terminal at the current cursor position. Also adds a timestamp if:
   * - The cursor is at the start of a line
   * - The line wasn't created due to wrapping
   * - The timestamp setting is enabled
   *
   * This should be usually called by higher-level code rather than _addVisibleChar() as it handles
   * adding a timestamp if needed.
   *
   * @param rxByte The byte to add to the terminal.
   */
  // _addVisibleCharAndTimestamp(rxByte: number) {

  //   this._maybeAddVisibleByteAndTimestamp(rxByte);
  // }

  /**
   * Wrapper for _addVisibleChar() which lets you add multiple characters at once.
   * @param rxBytes The printable characters to display.
   */
  _addVisibleChars(rxBytes: number[], direction: DataDirection) {
    for (let idx = 0; idx < rxBytes.length; idx += 1) {
      this._maybeAddVisibleByteAndTimestamp(rxBytes[idx], direction);
    }
  }

  /**
   * Adds a single printable character to the terminal at the current cursor position.
   * Cursor is also incremented to next suitable position. Nothing will be added if it is a non-visible character
   * and it has been configured to swallow non-visible characters.
   *
   * @param char Must be a number in the range [0, 255]. If number is in the valid ASCII range, the appropriate character
   *   will be displayed. If the number is not in the valid ASCII range, the character might be displayed as a special glyph
   *   depending on the data processing settings.
   */
  _maybeAddVisibleByteAndTimestamp(rxByte: number, direction: DataDirection) {
    // console.log('addVisibleChar() called. rxByte=', rxByte);

    const nonVisibleCharDisplayBehavior = this.rxSettings.nonVisibleCharDisplayBehavior;

    let char = '';
    if (rxByte >= 0x20 && rxByte <= 0x7e) {
      // Is printable ASCII character, no shifting needed
      char = String.fromCharCode(rxByte);
    } else {
      // We have either a control char or not in ASCII range (0x80 and above).
      // What we do depends on data processing setting
      if (nonVisibleCharDisplayBehavior == NonVisibleCharDisplayBehaviors.SWALLOW) {
        // Do nothing, don't display any non-visible characters
        return;
      } else if (nonVisibleCharDisplayBehavior == NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS) {
        // If the char is a control char (any value <= 0x7F, given we have already matched against visible chars), shift up to the PUA (starts at 0xE000) where our special font has visible glyphs for these.
        if (rxByte <= 0x7f) {
          char = String.fromCharCode(rxByte + START_OF_CONTROL_GLYPHS);
        } else {
          // Must be a non-ASCII char, so display as hex glyph. These start at 0xE100
          char = String.fromCharCode(rxByte + START_OF_HEX_GLYPHS);
        }
      } else if (nonVisibleCharDisplayBehavior == NonVisibleCharDisplayBehaviors.HEX_GLYPHS) {
        char = String.fromCharCode(rxByte + START_OF_HEX_GLYPHS);
      } else {
        throw Error('Invalid nonVisibleCharDisplayBehavior. nonVisibleCharDisplayBehavior=' + nonVisibleCharDisplayBehavior);
      }
    }

    // If we get here, we are definitely adding a visible character
    // If at start of line, and line wasn't created due to wrapping, add timestamp first!
    const rowToInsertInto = this.terminalRows[this.cursorPosition[0]];
    const startOfLineNotDueToWrapping = rowToInsertInto.wasCreatedDueToWrapping == false && this.cursorPosition[1] === 0;
    if (startOfLineNotDueToWrapping && this.rxSettings.addTimestamps) {
      // Need to add timestamp. First, we need to format it based on the timestamp format setting
      const now = new Date();
      const timestamp = moment(now)
      let timestampString = '';
      if (this.rxSettings.timestampFormat === TimestampFormat.ISO8601_WITHOUT_TIMEZONE) {
        // Format as ISO8601 with millisecond precision and no timezone
        timestampString = timestamp.format('YYYY-MM-DDTHH:mm:ss.SSS ');
      } else if (this.rxSettings.timestampFormat === TimestampFormat.ISO8601_WITH_TIMEZONE) {
        // Format as ISO8601 with millisecond precision and timezone
        timestampString = timestamp.format('YYYY-MM-DDTHH:mm:ss.SSSZ ');
      } else if (this.rxSettings.timestampFormat === TimestampFormat.LOCAL) {
        // Format as local time (no timezone info)
        timestampString = timestamp.format('YYYY-MM-DD HH:mm:ss.SSS ');
      } else if (this.rxSettings.timestampFormat === TimestampFormat.UNIX_SECONDS) {
        // Format as Unix time in seconds
        timestampString = timestamp.format('X ');
      } else if (this.rxSettings.timestampFormat === TimestampFormat.UNIX_SECONDS_AND_MILLISECONDS) {
        // Format as Unix time in seconds with milliseconds
        // timestampString = timestamp.format('x');
        // This returns the timestamp in milliseconds, we need to convert to seconds by adding a decimal point
        // before the last 3 digits
        timestampString = timestamp.format('X.SSS ');
      } else if (this.rxSettings.timestampFormat === TimestampFormat.CUSTOM) {
        // Format as custom string
        timestampString = timestamp.format(this.rxSettings.customTimestampFormatString.appliedValue);
      } else {
        throw Error('Invalid timestamp format. timestampFormat=' + this.rxSettings.timestampFormat);
      }

      for (let idx = 0; idx < timestampString.length; idx += 1) {
        this.addVisibleChar(timestampString[idx], direction);
      }
      // Add a space after the timestamp
      // this.addVisibleChar(' ');
    }

    this.addVisibleChar(char, direction);
  }

  addVisibleChar(char: string, direction: DataDirection) {
    const terminalChar = new TerminalChar();
    terminalChar.char = char;

    // This stores all classes we wish to apply to the char
    let classList = [];

    // Apply a class indicating the direction of the data
    if (direction === DataDirection.TX) {
      classList.push('tx');
    } else if (direction === DataDirection.RX) {
      classList.push('rx');
    } else {
      throw Error('Invalid direction. direction=' + direction);
    }

    // Calculate the foreground class
    // Should be in the form: "f<number", e.g. "f30" or "f90"
    if (this.currForegroundColorNum !== null) {
      if (this.currForegroundColorNum >= 30 && this.currForegroundColorNum <= 37) {
        if (this.boldOrIncreasedIntensity) {
          classList.push(`b`); // b for bold
          classList.push(`f${this.currForegroundColorNum}`);
        } else {
          classList.push(`f${this.currForegroundColorNum}`);
        }
      } else if (this.currForegroundColorNum >= 90 && this.currForegroundColorNum <= 97) {
        // Bright foreground colors
        classList.push(`f${this.currForegroundColorNum}`);
      }
    }

    // Calculate the background color class
    // Should be in the form: "b<number", e.g. "b40" or "b100"
    if (this.currBackgroundColorNum !== null) {
      if (this.currBackgroundColorNum >= 40 && this.currBackgroundColorNum <= 47) {
        if (this.boldOrIncreasedIntensity) {
          // b for bold. Note that we may have already applied this in the foreground
          // above, but two "b" classes does not matter
          classList.push(`b`);
          classList.push(`b${this.currBackgroundColorNum}`);
        } else {
          classList.push(`b${this.currBackgroundColorNum}`);
        }
      } else if (this.currBackgroundColorNum >= 100 && this.currBackgroundColorNum <= 107) {
        // Bright background colors
        classList.push(`b${this.currBackgroundColorNum}`);
      }
    }

    terminalChar.className = classList.join(' ');

    const rowToInsertInto = this.terminalRows[this.cursorPosition[0]];
    // Cursor should always be at a valid and pre-existing character position
    // Most of the time cursor will at a " " inserted for holding the cursor at
    // the end of all pre-existing text.
    rowToInsertInto.terminalChars[this.cursorPosition[1]] = terminalChar;
    // Increment cursor, move to next row if we have hit max char width
    // NOTE: Max. width may change at any time, and may reduce to a smaller value even
    // when chars are currently being inserted beyond the end. Thus the >= comparison here.
    if (this.cursorPosition[1] >= this.displaySettings.terminalWidthChars.appliedValue - 1) {
      // Remove space " " for cursor at the end of the current line
      this.cursorPosition[1] = 0;
      // When moving cursor down, make sure to specify it was due to wrapping. This will
      // make sure the next terminal row is created with the correct wasCreatedDueToWrapping parameter,
      // which makes sure that copying terminal text to the clipboard works correctly
      this._cursorDown(1, true);
    } else {
      this.cursorPosition[1] += 1;
      // Add space here is there is no text
      if (this.cursorPosition[1] === rowToInsertInto.terminalChars.length) {
        const spaceTerminalChar = new TerminalChar();
        spaceTerminalChar.char = ' ';
        spaceTerminalChar.forCursor = true;
        rowToInsertInto.terminalChars.push(spaceTerminalChar);
      }
    }
  }

  /**
   * Clears all data from the terminal (including scrollback), clears any internal buffers, resets all styles, resets cursor position,
   * and re-enables scroll lock.
   */
  clear() {
    this.cursorPosition = [0, 0];

    this.terminalRows = [];
    this.uniqueRowIndexCount = 0;

    // Now we've cleared all existing rows, create single row
    // with one space in it to hold the cursor.
    // The wasCreatedDueToWrapping parameter doesn't really matter for the first row
    // as the user cannot create a terminal text selection that starts prior to it
    const terminalRow = new TerminalRow(this.uniqueRowIndexCount, false);
    this.uniqueRowIndexCount += 1;
    const terminalChar = new TerminalChar();
    terminalChar.char = ' ';
    terminalChar.forCursor = true;
    terminalRow.terminalChars.push(terminalChar);
    this.terminalRows.push(terminalRow);

    this.rowToScrollLockTo = 0;

    // Always re-enable scroll lock when clearing
    // (this is probably what the users wants most of
    // the time)
    this.setScrollLock(true);

    // Reset the filtered rows to just show the one row
    // we have created above (but don't clear/reset the
    // filter)
    this.filteredTerminalRows = [terminalRow];

    // Clear all styles that ANSI escape codes might
    // have applied
    this.clearStyle();

    // Clear the multi-byte number buffer
    this.clearPartialNumberBuffer();
  }

  clearStyle() {
    // Clear all styles
    this.boldOrIncreasedIntensity = false;
    this.currForegroundColorNum = null;
    this.currBackgroundColorNum = null;
  }

  setScrollLock(trueFalse: boolean) {
    this.scrollLock = trueFalse;
  }

  _resetEscapeCodeParserState() {
    this.inAnsiEscapeCode = false;
    this.partialEscapeCode = '';
    this.inCSISequence = false;
  }

  static _isNumber(char: string) {
    return /^\d$/.test(char);
  }

  /**
   * Removes the oldest rows of data if needed to make sure the total number of rows in terminalRows does not exceed the terminal height + scrollback buffer size.
   */
  _limitNumRows() {
    // Max. number of rows in the terminalRows array has to take into account the
    // terminal height and size of the scrollback buffer
    const maxRows = this.terminalHeightChars + this.displaySettings.scrollbackBufferSizeRows.appliedValue;
    const numRowsToRemove = this.terminalRows.length - maxRows;
    if (numRowsToRemove <= 0) {
      return;
    }
    // Remove oldest rows (rows from start of array)
    const deletedRows = this.terminalRows.splice(0, numRowsToRemove);

    // We need to update the cursor position to point to the
    // same row before we deleted some
    const prevCursorRowIdx = this.cursorPosition[0];
    const newCursorRowIdx = prevCursorRowIdx - numRowsToRemove;
    if (newCursorRowIdx >= 0) {
      this.cursorPosition[0] = newCursorRowIdx;
    } else {
      // This means we deleted the row the cursor was on, in this case, move cursor to
      // the oldest row and at it's start
      this.cursorPosition[0] = 0;
      this.cursorPosition[1] = 0;
    }

    // Work out how many of the rows we just deleted are visible, and then remove them
    // from the filtered row indexes array.
    let numFilteredIndexesToRemove = 0;
    for (let idx = 0; idx < numRowsToRemove; idx += 1) {
      const deletedRow = deletedRows[idx];
      if (this.filteredTerminalRows.indexOf(deletedRow) !== -1) {
        numFilteredIndexesToRemove += 1;
      }
    }
    this.filteredTerminalRows.splice(0, numFilteredIndexesToRemove);

    // Need to update scroll position for view to use if we are not scroll locked to the bottom. Move the scroll position back the same amount of rows we deleted which were visible, so the user sees the same data on the screen
    // Drift occurs if char size is not an integer number of pixels!
    if (!this.scrollLock) {
      let newScrollPos = this.scrollPos - (this.displaySettings.charSizePx.appliedValue + this.displaySettings.verticalRowPaddingPx.appliedValue) * numFilteredIndexesToRemove;
      if (newScrollPos < 0) {
        newScrollPos = 0;
      }
      this.scrollPos = newScrollPos;
    }
  }

  /**
   * Use this to set whether the terminal is considered focused or not. If focused, the
   * terminal will be given a glow border and the cursor will go solid.
   *
   * @param value True to set as focused, false to not be focused.
   */
  setIsFocused(value: boolean) {
    // Only let this be set if terminal is focusable
    if (!this.isFocusable) {
      return;
    }
    this.isFocused = value;
  }

  async handleKeyDown(event: React.KeyboardEvent) {
    if (this.onTerminalKeyDown !== null) {
      await this.onTerminalKeyDown(event);
    }
  }

  /**
   * Call this to set filter text to apply to each row in the terminals buffer. Only
   * rows containing the filter text will be displayed.
   * @param filterText
   */
  setFilterText(filterText: string) {
    this.filterText = filterText;

    // Because the filter text has changed, we need to recheck every single row of
    // data
    // Clear the rows first, this should be more efficient than removing
    // them 1 by 1.
    this.filteredTerminalRows = [];
    for (let rowIdx = 0; rowIdx < this.terminalRows.length; rowIdx += 1) {
      if (this._doesRowPassFilter(rowIdx)) {
        this.filteredTerminalRows.push(this.terminalRows[rowIdx]);
      }
    }
    // We could get smart here and modify the scroll position to try
    // and keep the user in roughly the same "position" as before, i.e.
    // one way to do it would be to:
    // 1) Find row at top of terminal before filter text is changed
    // 2) After filter text is changed, find the closest row that passes the filter to the
    //    one found in 1) that occurs after (in time).
    // 3) Set this to the row at the top of the terminal
  }

  /**
   * Checks if the row at the specified index passes the filter.
   *
   * @param rowIdx If rowIdx is outside the bounds of the terminalRows array, this function returns false.
   * @returns True if row passes filter, otherwise false.
   */
  _doesRowPassFilter(rowIdx: number) {
    if (rowIdx >= this.terminalRows.length) {
      // Row does not exist, so it does not pass the filter
      // This functionality allows the "erase in display" command to easily
      // remove row indexes of removed rows from the filtered list
      return false;
    }
    const row = this.terminalRows[rowIdx];
    const rowText = row.getText();
    if (this.filterText === '') {
      // No filter text, so all rows pass
      return true;
    }
    if (rowIdx === this.cursorPosition[0]) {
      // The cursor row always passes the filter
      return true;
    }
    if (rowText.includes(this.filterText)) {
      return true;
    }
    return false;
  }

  /**
   * Adds the provided row the the filtered rows array. It is inserted at the correct
   * position in the array based on it's uniqueRowId. If row already exists in the
   * filtered rows array, this function does nothing.
   *
   * @param terminalRowToInsert The row to insert into the filtered rows array.
   */
  _addToFilteredRows(terminalRowToInsert: TerminalRow) {
    if (this.filteredTerminalRows.indexOf(terminalRowToInsert) === -1) {
      // The row is not already in the filtered rows array, so we need to insert
      // it at the correct location. We need to insert it in order given by it's
      // uniqueRowId. Begin search from the end of the array, as this is where
      // we'll be normally be doing these sorts of operations (e.g. it will be more
      // efficient most of the time)
      // console.log('Row is not in filtered rows, need to insert it at the correct location');
      for (let idx = this.filteredTerminalRows.length - 1; idx >= 0; idx -= 1) {
        if (this.filteredTerminalRows[idx].uniqueRowId < terminalRowToInsert.uniqueRowId) {
          // Insert after this index
          this.filteredTerminalRows.splice(idx + 1, 0, terminalRowToInsert);
          return;
        }
      }
    }
  }

  /**
   * Removes the provided row from the filtered rows array, if it is present.
   *
   * @param terminalRowToRemove The row to remove.
   */
  _removeFromFilteredRows(terminalRowToRemove: TerminalRow) {
    const idx = this.filteredTerminalRows.indexOf(terminalRowToRemove);
    if (idx !== -1) {
      this.filteredTerminalRows.splice(idx, 1);
    }
  }

  _addOrRemoveRowFromFilteredRows = (rowIdx: number) => {
    if (this._doesRowPassFilter(rowIdx)) {
      this._addToFilteredRows(this.terminalRows[rowIdx]);
    } else {
      this._removeFromFilteredRows(this.terminalRows[rowIdx]);
    }
  }

  getSelectionInfoIfWithinTerminal() {
    return SelectionController.getSelectionInfo(window.getSelection(), this.id);
  }

  /**
   * Call this to clear the buffer which is used to store partially received multi-byte numbers.
   */
  clearPartialNumberBuffer = () => {
    this.partialNumberBuffer = [];
  };
}
