/* eslint-disable no-continue */
import { autorun, makeAutoObservable } from 'mobx';

import TerminalRow from './SingleTerminalRow';
import TerminalChar from './SingleTerminalChar';
import { App } from 'src/App';

/**
 * Represents a single terminal-style user interface.
 */
export default class Terminal {

  /**
   * The App object which owns this Terminal.
   */
  app: App;

  // This represents the current style active on the terminal
  currentStyle: {};

  cursorPosition: [number, number];

  // If true, the data pane scroll will be locked at the bottom
  scrollLock: boolean;

  rowToScrollLockTo: number;

  scrollPos: number;

  terminalRows: TerminalRow[];

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

  // Set to true when the user clicks within the Terminals bounding box
  // Used to know when to capture key strokes for the Terminal
  isFocused: boolean;

  // If this is set to false, the Terminal is not focusable. It will not have a background
  // glow on hover or click, and the cursor will always outlined, never filled in.
  isFocusable: boolean;

  constructor(app: App, isFocusable: boolean) {
    this.app = app;
    this.isFocusable = isFocusable;

    autorun(() => {
      if (!this.app.settings.dataProcessing.appliedData.fields.ansiEscapeCodeParsingEnabled.value) {
        // ANSI escape code parsing has been disabled
        // Flush any partial ANSI escape code
        for (let idx = 0; idx < this.partialEscapeCode.length; idx += 1) {
          this.addVisibleChar(this.partialEscapeCode[idx].charCodeAt(0));
        }
        this.partialEscapeCode = '';
        this.inAnsiEscapeCode = false;
        this.inCSISequence = false;
        this.inIdleState = true;
      }
    })

    // reaction(
    //   () => this.settings.dataProcessing.appliedData.fields.scrollbackBufferSizeRows.value,
    //   (scrollbackBufferSizeRows) => {
    //     console.log('scrollbackBufferSizeRows=', scrollbackBufferSizeRows);
    //   }
    // )

    this.cursorPosition = [0, 0];

    this.scrollLock = true;
    this.rowToScrollLockTo = 0;
    this.scrollPos = 0;

    // This is just to keep typescript happy, they
    // are all set in clearData() anyway.
    this.currentStyle = {
      color: '#ffffff',
    };
    this.terminalRows = [];
    this.clearData();

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

  setScrollPos(scrollPos: number) {
    this.scrollPos = scrollPos;
  }

  parseData(data: Uint8Array) {
    // Parse each character
    // console.log('parseData() called. data=', data);
    // const dataAsStr = new TextDecoder().decode(data);

    // This variable can get modified during the loop, for example if a partial escape code
    // reaches it's length limit, the ESC char is stripped and the remainder of the partial is
    // prepending onto dataAsStr for further processing
    // let dataAsStr = String.fromCharCode.apply(null, Array.from(data));

    let remainingData: number[] = []
    for (let idx = 0; idx < data.length; idx += 1) {
      remainingData.push(data[idx]);
    }

    while (true) {

      // Remove char from start of remaining data
      let rxByte = remainingData.shift();
      if (rxByte === undefined) {
        break;
      }

      // const char = dataAsStr[idx];
      // This console print is very useful when debugging
      // console.log(`char: "${char}", 0x${char.charCodeAt(0).toString(16)}`);

      // Don't want to interpret new lines if we are half-way
      // through processing an ANSI escape code
      if (this.inIdleState && rxByte === '\n'.charCodeAt(0)) {
        this.moveToNewLine();
        // this.limitNumRows();
        // eslint-disable-next-line no-continue
        continue;
      }

      // Check if ANSI escape code parsing is disabled, and if so, skip parsing
      if (!this.app.settings.dataProcessing.appliedData.fields.ansiEscapeCodeParsingEnabled.value) {
        this.addVisibleChar(rxByte);
        // this.limitNumRows();
        continue;
      }

      if (rxByte === 0x1B) {
        // console.log('Start of escape sequence found!');
        this.resetEscapeCodeParserState();
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
            this.resetEscapeCodeParserState();
            this.inIdleState = true;
          }
        }
      } else {
        // Not currently receiving ANSI escape code,
        // so send character to terminal(s)
        this.addVisibleChar(rxByte);
      }

      // When we get to the end of parsing, check that if we are still
      // parsing an escape code, and we've hit the escape code length limit,
      // then bail on escape code parsing. Emit partial code as data and go back to IDLE
      const maxEscapeCodeLengthChars = this.app.settings.dataProcessing.appliedData.fields.maxEscapeCodeLengthChars.value;
      if (this.inAnsiEscapeCode && this.partialEscapeCode.length === maxEscapeCodeLengthChars) {
        console.log(`Reached max. length (${maxEscapeCodeLengthChars}) for partial escape code.`);
        this.app.snackbar.sendToSnackbar(
          `Reached max. length (${maxEscapeCodeLengthChars}) for partial escape code.`,
          'warning');
        // Remove the ESC byte, and then prepend the rest onto the data to be processed
        // Got to shift them in backwards
        for (let partialIdx = this.partialEscapeCode.length - 1; partialIdx >= 1; partialIdx -= 1) {
          remainingData.unshift(this.partialEscapeCode[partialIdx].charCodeAt(0));
        }
        this.resetEscapeCodeParserState();
        this.inIdleState = true;
      }
    }

    // Right at the end of adding everything, limit the num. of max. rows in the terminal
    // as determined by the settings
    this.limitNumRows();
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
      // Check if we can't go up the full amount, and if so, only
      // go up to the first line
      if (numRowsToGoUp > this.cursorPosition[0]) {
        [numRowsToGoUp] = this.cursorPosition;
      }
      // There is a row above us, so safe to go up.
      this.cursorPosition[0] -= numRowsToGoUp;
      // Need to pad out this row with spaces " " if cursor
      // is beyond end of existing text on row
      const row = this.terminalRows[this.cursorPosition[0]];
      while (this.cursorPosition[1] > row.terminalChars.length - 1) {
        const space = new TerminalChar();
        space.char = ' ';
        row.terminalChars.push(space);
        // If this is the last ' ' to insert, set it to a special "for cursor"
        // space which will get deleted if the cursor moves. Note that we don't
        // do this for any of the other spaces added (should we?)
        if (this.cursorPosition[1] === row.terminalChars.length - 1) {
          row.terminalChars[this.cursorPosition[1]].forCursor = true;
        }
      }
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
      this.cursorRight(numColsToGoRight);
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
      this.cursorLeft(numColsToGoLeft);
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

  cursorRight(numColsToGoRight: number) {
    // Go right one character at a time and perform various checks along the way
    for (let numColsGoneRight = 0; numColsGoneRight < numColsToGoRight; numColsGoneRight += 1) {
      // Never exceed the specified terminal width when going right
      if (this.cursorPosition[1] >= this.app.settings.dataProcessing.appliedData.fields.terminalWidthChars.value) {
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

  cursorLeft(numColsToGoLeft: number) {
    // Cap number columns to go left
    const currCursorColIdx = this.cursorPosition[1];
    let numColsToLeftAdjusted = numColsToGoLeft;
    if (numColsToGoLeft > currCursorColIdx) {
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

  addVisibleChars(rxBytes: number[]) {
    for (let idx = 0; idx < rxBytes.length; idx += 1) {
      this.addVisibleChar(rxBytes[idx]);
    }
  }

  /**
   * Adds a single printable character to the terminal at the current cursor position.
   * Cursor is also incremented to next suitable position.
   * @param char Must be a single printable character only.
   */
  addVisibleChar(rxByte: number) {
    // console.log('addVisibleChar() called. rxByte=', rxByte);
    const terminalChar = new TerminalChar();

    // if (rxByte === 0x00) {
    //   terminalChar.char = String.fromCharCode(0x2400);
    // } else {
    //   terminalChar.char = String.fromCharCode(rxByte);
    // }
    terminalChar.char = String.fromCharCode(rxByte);

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
    if (this.cursorPosition[1] >= this.app.settings.dataProcessing.appliedData.fields.terminalWidthChars.value - 1) {
      // Remove space " " for cursor at the end of the current line
      this.cursorPosition[1] = 0;
      this.moveToNewLine(); // This adds the " " if needed for the cursor
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

  clearData() {
    this.currentStyle = {};

    this.cursorPosition = [0, 0];

    this.terminalRows = [];
    const terminalRow = new TerminalRow();
    const terminalChar = new TerminalChar();
    terminalChar.char = ' ';
    terminalChar.forCursor = true;
    terminalRow.terminalChars.push(terminalChar);
    this.terminalRows.push(terminalRow);
    this.rowToScrollLockTo = 0;
  }

  setStyle(style: {}) {
    // Override any provided style properties
    this.currentStyle = Object.assign(this.currentStyle, style);
  }

  clearStyle() {
    // Clear all styles
    this.currentStyle = {};
    this.boldOrIncreasedIntensity = false;
    this.currForegroundColorNum = null;
    this.currBackgroundColorNum = null;
  }

  setScrollLock(trueFalse: boolean) {
    this.scrollLock = trueFalse;
  }

  moveToNewLine() {
    // Delete char at current cursor location if specifically for cursor
    if (
      this.terminalRows[this.cursorPosition[0]].terminalChars[
        this.cursorPosition[1]
      ].forCursor
    ) {
      this.terminalRows[this.cursorPosition[0]].terminalChars.splice(
        this.cursorPosition[1],
        1
      );
    }
    if (this.cursorPosition[0] !== this.terminalRows.length - 1) {
      this.cursorPosition[0] += 1;
      this.cursorPosition[1] = 0;
    } else {
      const terminalRow = new TerminalRow();
      this.terminalRows.push(terminalRow);
      this.cursorPosition[0] += 1;
      this.cursorPosition[1] = 0;
      this.rowToScrollLockTo = this.terminalRows.length - 1;
    }
    // If there is no char at current cursor position in the row it's now in, insert empty space for cursor
    const rowCursorIsNowOn = this.terminalRows[this.cursorPosition[0]];
    if (this.cursorPosition[1] >= rowCursorIsNowOn.terminalChars.length) {
      const terminalChar = new TerminalChar();
      terminalChar.char = ' ';
      rowCursorIsNowOn.terminalChars.push(terminalChar);
    }
  }

  resetEscapeCodeParserState() {
    this.inAnsiEscapeCode = false;
    this.partialEscapeCode = '';
    this.inCSISequence = false;
  }

  static isNumber(char: string) {
    return /^\d$/.test(char);
  }

  limitNumRows() {
    const maxRows = this.app.settings.dataProcessing.appliedData.fields.scrollbackBufferSizeRows.value;
    // console.log('limitNumRows() called. maxRows=', maxRows);
    const numRowsToRemove = this.terminalRows.length - maxRows;
    if (numRowsToRemove <= 0) {
      // console.log('No need to remove any rows.');
      return;
    }
    // console.log(`Removing ${numRowsToRemove} from terminal which has ${this.terminalRows.length} rows.`)
    // Remove oldest rows (rows from start of array)
    this.terminalRows.splice(0, numRowsToRemove);
    // console.log(`Now has ${this.terminalRows.length} rows.`)

    // We need to update the cursor position to point to the
    // same row before we deleted some
    const prevCursorRowIdx = this.cursorPosition[0];
    const newCursorRowIdx = prevCursorRowIdx - numRowsToRemove;
    if (newCursorRowIdx >= 0) {
      this.cursorPosition[0] = newCursorRowIdx;
    } else {
      // This means we deleted the row the cursor was on, in this case, move cursor to
      // the oldest row, at the start of the row
      this.cursorPosition[0] = 0;
      this.cursorPosition[1] = 0;
    }

    // Need to update scroll position for view to use if we are not scroll locked
    // to the bottom. Move the scroll position back the same amount of vertical
    // space as the rows we removed, so the user sees the same data on the screen
    // Drift occurs if char size is not an integer number of pixels!
    if (!this.scrollLock) {
      let newScrollPos = this.scrollPos - (this.app.settings.dataProcessing.charSizePx.appliedValue + 5)*numRowsToRemove;
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
   * @param trueFalse True to set as focused.
   */
  setIsFocused(trueFalse: boolean) {
    // Only let this be set if terminal is focusable
    if (!this.isFocusable) {
      return;
    }
    this.isFocused = trueFalse;
  }

  handleKeyDown(event: React.KeyboardEvent) {
    this.app.handleTerminalKeyDown(event);
  }
}
