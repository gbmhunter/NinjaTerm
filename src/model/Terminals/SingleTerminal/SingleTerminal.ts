/* eslint-disable no-continue */
import { autorun, makeAutoObservable } from 'mobx';

import TerminalRow from '../../../view/Terminals/SingleTerminal/TerminalRow';
import TerminalChar from '../../../view/Terminals/SingleTerminal/SingleTerminalChar';
import RxSettings, { CarriageReturnCursorBehavior, DataType, HexCase, NewLineCursorBehavior, NonVisibleCharDisplayBehaviors } from 'src/model/Settings/RxSettings/RxSettings';
import DisplaySettings from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { ListOnScrollProps } from 'react-window';
import { SelectionController, SelectionInfo } from 'src/model/SelectionController/SelectionController';

const START_OF_CONTROL_GLYPHS = 0xE000;
const START_OF_HEX_GLYPHS = 0xE100;

/**
 * Represents a single terminal-style user interface.
 */
export default class SingleTerminal {

  // PASSED IN VARIABLES
  //======================================================================

  id: string;

  dataProcessingSettings: RxSettings;

  displaySettings: DisplaySettings;

  onTerminalKeyDown: ((event: React.KeyboardEvent) => Promise<void>) | null;

  // OTHER VARIABLES
  //======================================================================

  // [ row_idx, col_idx ]
  cursorPosition: [number, number];

  // If true, the data pane scroll will be locked at the bottom
  scrollLock: boolean;

  rowToScrollLockTo: number;

  scrollPos: number;

  /*
    * The height of the terminal view in pixels. This does not include any padding,
    * i.e. it's the height that terminal rows will be packed into. Set by the UI.
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

  constructor(
      id: string,
      isFocusable: boolean,
      dataProcessingSettings: RxSettings,
      displaySettings: DisplaySettings,
      onTerminalKeyDown: ((event: React.KeyboardEvent) => Promise<void>) | null) {
    // Save passed in variables and dependencies
    this.id = id;
    this.isFocusable = isFocusable;
    this.dataProcessingSettings = dataProcessingSettings;
    this.displaySettings = displaySettings;
    this.onTerminalKeyDown = onTerminalKeyDown;

    autorun(() => {
      if (!this.dataProcessingSettings.config.ansiEscapeCodeParsingEnabled) {
        // ANSI escape code parsing has been disabled
        // Flush any partial ANSI escape code
        for (let idx = 0; idx < this.partialEscapeCode.length; idx += 1) {
          this._addVisibleChar(this.partialEscapeCode[idx].charCodeAt(0));
        }
        this.partialEscapeCode = '';
        this.inAnsiEscapeCode = false;
        this.inCSISequence = false;
        this.inIdleState = true;
      }
    })

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

    makeAutoObservable(this);
  }

  get charSizePx() {
    return this.displaySettings.charSizePx.appliedValue;
  }

  get verticalRowPaddingPx() {
    return this.displaySettings.verticalRowPaddingPx.appliedValue;
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
    if (!scrollProps.scrollUpdateWasRequested
          && scrollProps.scrollDirection == 'forward'
          && scrollProps.scrollOffset >= totalTerminalRowsHeightPx - this.terminalViewHeightPx) {
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

  setTerminalViewHeightPx(terminalViewHeightPx: number) {
    this.terminalViewHeightPx = terminalViewHeightPx;
  }

  /**
   * Send data to the terminal to be processed and displayed.
   *
   * Data will sent to the correct parser based on the selected data type (e.g.
   * ASCII, HEX).
   *
   * @param data The array of bytes to process.
   */
  parseData(data: Uint8Array) {
    // Parse each character
    // console.log('parseData() called. data=', data);
    // const dataAsStr = new TextDecoder().decode(data);

    // This variable can get modified during the loop, for example if a partial escape code
    // reaches it's length limit, the ESC char is stripped and the remainder of the partial is
    // prepending onto dataAsStr for further processing
    // let dataAsStr = String.fromCharCode.apply(null, Array.from(data));

    if (this.dataProcessingSettings.config.dataType === DataType.ASCII) {
      this.parseAsciiData(data);
    } else if (this.dataProcessingSettings.config.dataType === DataType.HEX) {
      this._parseHexData(data);
    } else {
      throw Error(`Data type ${this.dataProcessingSettings.config.dataType} not supported by parseData().`);
    }

    // Right at the end of adding everything, limit the num. of max. rows in the terminal
    // as determined by the settings
    this.limitNumRows();
  }

  parseAsciiData(data: Uint8Array) {
    let remainingData: number[] = []
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

      // NEW LINE HANDLING
      //========================================================================

      const newLineBehavior = this.dataProcessingSettings.config.newLineCursorBehavior;
      // Don't want to interpret new lines if we are half-way through processing an ANSI escape code
      if (this.inIdleState && rxByte === '\n'.charCodeAt(0)) {

        // If swallow is disabled, print the new line character. Do this before
        // performing any cursor movements, as we want the new line char to
        // at the end of the existing line, rather than the start of the new
        // line
        if (!this.dataProcessingSettings.config.swallowNewLine) {
          this._addVisibleChar(rxByte);
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

      // CARRIAGE RETURN HANDLING
      //========================================================================

      const carriageReturnCursorBehavior = this.dataProcessingSettings.config.carriageReturnCursorBehavior;
      // Don't want to interpret new lines if we are half-way through processing an ANSI escape code
      if (this.inIdleState && rxByte === '\r'.charCodeAt(0)) {

        // If swallow is disabled, print the carriage return character. Do this before
        // performing any cursor movements, as we want the carriage return char to
        // at the end line, rather than at the start
        if (!this.dataProcessingSettings.config.swallowCarriageReturn) {
          this._addVisibleChar(rxByte);
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

      // Check if ANSI escape code parsing is disabled, and if so, skip parsing
      if (!this.dataProcessingSettings.config.ansiEscapeCodeParsingEnabled) {
        this._addVisibleChar(rxByte);
        continue;
      }

      if (rxByte === 0x1B) {
        // console.log('Start of escape sequence found!');
        this._resetEscapeCodeParserState();
        this.inAnsiEscapeCode = true;
        this.inIdleState = false;
      }

      // If we are not currently processing an escape code
      // character is to be displayed
      if (this.inAnsiEscapeCode) {
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
            this.parseCSISequence(this.partialEscapeCode);
            this._resetEscapeCodeParserState();
            this.inIdleState = true;
          }
        }
      } else {
        // Not currently receiving ANSI escape code,
        // so send character to terminal(s)
        this._addVisibleChar(rxByte);
      }

      // When we get to the end of parsing, check that if we are still
      // parsing an escape code, and we've hit the escape code length limit,
      // then bail on escape code parsing. Emit partial code as data and go back to IDLE
      const maxEscapeCodeLengthChars = this.dataProcessingSettings.config.maxEscapeCodeLengthChars;
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
    }
  }

  /**
   * Parses a CSI sequence.
   * @param ansiEscapeCode Must be in the form "ESC[<remaining data>". This function will validate
   *    the rest of the code, and perform actions on the terminal as required.
   */
  parseCSISequence(ansiEscapeCode: string) {
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
        console.error(
          `Number string in SGR code could not converted into integer. numberStr=${numberStr}.`
        );
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
        console.error(
          `Number string in SGR code could not converted into integer. numberStr=${numberStr}.`
        );
        return;
      }
      this._cursorLeft(numColsToGoLeft);
    } else if (lastChar === 'J') {
      //============================================================
      // ED Erase in Display
      //============================================================
      // console.log('Erase in display');
      // Extract number in the form ESC[nJ
      let numberStr = ansiEscapeCode.slice(2, ansiEscapeCode.length - 1);
      // If there was no number provided, assume it was '0' (default)
      if (numberStr === '') {
        numberStr = '0';
      }
      const numberN = parseInt(numberStr, 10);
      if (Number.isNaN(numberN)) {
        console.error(
          `Number string in Erase in Display (ED) CSI sequence could not converted into integer. numberStr=${numberStr}.`
        );
        return;
      }
      if (numberN === 0) {
        // Clear from cursor to end of screen. We assume this mean from cursor location to end
        // of all data
        // First, remove all chars at the cursor position or beyond
        // on the current row
        const currRow = this.terminalRows[this.cursorPosition[0]];
        const numCharsToDeleteOnCurrRow = currRow.terminalChars.length - this.cursorPosition[1];
        currRow.terminalChars.splice(
          this.cursorPosition[1],
          numCharsToDeleteOnCurrRow
        );
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
      let numbersAndSemicolons = ansiEscapeCode.slice(
        2,
        ansiEscapeCode.length - 1
      );

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
          console.error(
            `Number string in SGR code could not converted into integer. numberCodeString=${numberCodeString}.`
          );
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
          this.currForegroundColorNum = numberCode
        } else if (numberCode >= 40 && numberCode <= 47) {
          this.currBackgroundColorNum = numberCode;
        } else if (numberCode >= 90 && numberCode <= 97) {
          // Bright foreground colors
          this.currForegroundColorNum = numberCode;
        } else if (numberCode >= 100 && numberCode <= 107) {
          // Bright background colors
          this.currBackgroundColorNum = numberCode;
        } else {
          console.log(
            `Number ${numberCode} provided to SGR control sequence unsupported.`
          );
        }
      }
    }
  }

  /**
   * Parses received data and displays it as hex characters on the terminal.
   *
   * @param data The data to parse and display.
   */
  _parseHexData(data: Uint8Array) {
    for (let idx = 0; idx < data.length; idx += 1) {
      const rxByte = data[idx];
      // Convert byte to hex string
      let hexStr = rxByte.toString(16).padStart(2, '0');
      // Set case of hex string
      if (this.dataProcessingSettings.config.hexCase === HexCase.UPPERCASE) {
        hexStr = hexStr.toUpperCase();
      } else if (this.dataProcessingSettings.config.hexCase === HexCase.LOWERCASE) {
        hexStr = hexStr.toLowerCase();
      } else {
        throw Error('Invalid hex case setting: ' + this.dataProcessingSettings.config.hexCase);
      }

      // Add 0x prefix if needed
      if (this.dataProcessingSettings.config.prefixHexValuesWith0x) {
        hexStr = '0x' + hexStr;
      }

      // Only prevent hex value wrapping mid-value if:
      // 1) Setting is enabled
      // 2) The terminal column width is high enough to fit an entire hex value in it
      if (this.dataProcessingSettings.config.preventHexValuesWrappingAcrossRows
        && this.displaySettings.terminalWidthChars.appliedValue >= hexStr.length) {
        // Create a new terminal row if the hex value will not fit on existing row
        const currRow = this.terminalRows[this.cursorPosition[0]];
        const numColsLeftOnRow = this.displaySettings.terminalWidthChars.appliedValue - this.cursorPosition[1];
        if (hexStr.length > numColsLeftOnRow) {
          // Move cursor to next row
          this._cursorDown(1, true);
          // Move cursor to start of row
          this._cursorLeft(this.cursorPosition[1]);
        }
      }

      // Add to hex chars to the the terminal
      for (let charIdx = 0; charIdx < hexStr.length; charIdx += 1) {
        this._addVisibleChar(hexStr.charCodeAt(charIdx));
      }
      // Append the hex separator string
      for (let charIdx = 0; charIdx < this.dataProcessingSettings.config.hexSeparator.length; charIdx += 1) {
        this._addVisibleChar(this.dataProcessingSettings.config.hexSeparator.charCodeAt(charIdx));
      }

    }
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
   * Moves the cursor up the specified number of rows. Does not move the cursor any further
   * it it reaches the first row.
   * @param numRows The number of rows to move up.
   */
  _cursorUp(numRows: number) {
    // Go up one row at a time and perform various checks along the way
    for (let numRowsGoneUp = 0; numRowsGoneUp < numRows; numRowsGoneUp += 1) {
      // Never go above the first row!
      if (this.cursorPosition[0] === 0) {
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
   * Wrapper for _addVisibleChar() which lets you add multiple characters at once.
   * @param rxBytes The printable characters to display.
   */
  _addVisibleChars(rxBytes: number[]) {
    for (let idx = 0; idx < rxBytes.length; idx += 1) {
      this._addVisibleChar(rxBytes[idx]);
    }
  }

  /**
   * Adds a single printable character to the terminal at the current cursor position.
   * Cursor is also incremented to next suitable position.
   *
   * @param char Must be a number in the range [0, 255]. If number is in the valid ASCII range, the appropriate character
   *   will be displayed. If the number is not in the valid ASCII range, the character might be displayed as a special glyph
   *   depending on the data processing settings.
   */
  _addVisibleChar(rxByte: number) {
    // console.log('addVisibleChar() called. rxByte=', rxByte);
    const terminalChar = new TerminalChar();

    const nonVisibleCharDisplayBehavior = this.dataProcessingSettings.config.nonVisibleCharDisplayBehavior;

    if (rxByte >= 0x20 && rxByte <= 0x7E) {
      // Is printable ASCII character, no shifting needed
      terminalChar.char = String.fromCharCode(rxByte);
    } else {
      // We have either a control char or not in ASCII range (0x80 and above).
      // What we do depends on data processing setting
      if (nonVisibleCharDisplayBehavior == NonVisibleCharDisplayBehaviors.SWALLOW) {
        // Do nothing, don't display any non-visible characters
        return;
      } else if (nonVisibleCharDisplayBehavior == NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS) {
        // If the char is a control char (any value <= 0x7F, given we have already matched against visible chars), shift up to the PUA (starts at 0xE000) where our special font has visible glyphs for these.
        if (rxByte <= 0x7F) {
          terminalChar.char = String.fromCharCode(rxByte + START_OF_CONTROL_GLYPHS);
        } else {
          // Must be a non-ASCII char, so display as hex glyph. These start at 0xE100
          terminalChar.char = String.fromCharCode(rxByte + START_OF_HEX_GLYPHS);
        }
      } else if (nonVisibleCharDisplayBehavior == NonVisibleCharDisplayBehaviors.HEX_GLYPHS) {
        terminalChar.char = String.fromCharCode(rxByte + START_OF_HEX_GLYPHS);
      } else {
        throw Error('Invalid nonVisibleCharDisplayBehavior. nonVisibleCharDisplayBehavior=' + nonVisibleCharDisplayBehavior);
      }
    }

    // This stores all classes we wish to apply to the char
    let classList = [];
    // Calculate the foreground class
    // Should be in the form: "f<number", e.g. "f30" or "f90"
    if (this.currForegroundColorNum !== null) {
      if (this.currForegroundColorNum >= 30 && this.currForegroundColorNum <= 37) {
        if (this.boldOrIncreasedIntensity) {
          classList.push(`b`); // b for bold
          classList.push(`f${this.currForegroundColorNum}`)
        } else {
          classList.push(`f${this.currForegroundColorNum}`)
        }
      } else if (this.currForegroundColorNum >= 90 && this.currForegroundColorNum <= 97) {
        // Bright foreground colors
        classList.push(`f${this.currForegroundColorNum}`);

      };
    }

    // Calculate the background color class
    // Should be in the form: "b<number", e.g. "b40" or "b100"
    if (this.currBackgroundColorNum !== null) {
      if (this.currBackgroundColorNum >= 40 && this.currBackgroundColorNum <= 47) {
        if (this.boldOrIncreasedIntensity) {
          // b for bold. Note that we may have already applied this in the foreground
          // above, but two "b" classes does not matter
          classList.push(`b`);
          classList.push(`b${this.currBackgroundColorNum}`)
        } else {
          classList.push(`b${this.currBackgroundColorNum}`)
        }
      } else if (this.currBackgroundColorNum >= 100 && this.currBackgroundColorNum <= 107) {
        // Bright background colors
        classList.push(`b${this.currBackgroundColorNum}`)
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
   * Clears all data from the terminal, resets all styles, resets cursor position,
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
    this.filteredTerminalRows = [ terminalRow ];

    // Clear all styles that ANSI escape codes might
    // have applied
    this.clearStyle();
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
   * Removes the oldest rows of data if needed to make sure it don't exceed the scrollback buffer size.
   */
  limitNumRows() {
    const maxRows = this.displaySettings.scrollbackBufferSizeRows.appliedValue;
    // console.log('limitNumRows() called. maxRows=', maxRows);
    const numRowsToRemove = this.terminalRows.length - maxRows;
    if (numRowsToRemove <= 0) {
      // console.log('No need to remove any rows.');
      return;
    }
    // console.log(`Removing ${numRowsToRemove} from terminal which has ${this.terminalRows.length} rows.`)
    // Remove oldest rows (rows from start of array)
    const deletedRows = this.terminalRows.splice(0, numRowsToRemove);
    // console.log(`Now has ${this.terminalRows.length} rows.`)

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
      let newScrollPos = this.scrollPos - (this.displaySettings.charSizePx.appliedValue + this.displaySettings.verticalRowPaddingPx.appliedValue)*numFilteredIndexesToRemove;
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
      console.log('Row is not in filtered rows, need to insert it at the correct location');
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

  getSelectionInfoIfWithinTerminal() {
    return SelectionController.getSelectionInfo(window.getSelection(), this.id);
  }
}
