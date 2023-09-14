/* eslint-disable no-continue */
import { makeAutoObservable } from 'mobx';
import { ReactElement } from 'react';
import { TextEncoder, TextDecoder } from 'util';

import TerminalRow from './TerminalRow';
import TerminalChar from './TerminalChar';

// Polyfill because TextDecoder is not bundled with jsdom 16 and breaks Jest, see
// https://stackoverflow.com/questions/68468203/why-am-i-getting-textencoder-is-not-defined-in-jest
Object.assign(global, { TextDecoder, TextEncoder });

/**
 * Represents a single terminal-style user interface.
 */
export default class Terminal {
  outputHtml: ReactElement[];

  // This represents the current style active on the terminal
  currentStyle: {};

  cursorPosition: [number, number];

  // If true, the data pane scroll will be locked at the bottom
  scrollLock = true;

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

  sgaCodeToColorMapVga: { [key: number]: string } = {};

  sgaCodeToBrightColorMapVga: { [key: number]: string } = {};

  constructor() {
    this.outputHtml = [];
    this.cursorPosition = [0, 0];

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

    // Populate the map with data
    this.sgaCodeToColorMapVga[0] = 'rgb(0, 0, 0)';
    this.sgaCodeToColorMapVga[1] = 'rgb(170, 0, 0)';
    this.sgaCodeToColorMapVga[2] = 'rgb(0, 170, 0)';
    this.sgaCodeToColorMapVga[3] = 'rgb(170, 85, 0)';
    this.sgaCodeToColorMapVga[4] = 'rgb(0, 0, 170)';
    this.sgaCodeToColorMapVga[5] = 'rgb(170, 0, 170)';
    this.sgaCodeToColorMapVga[6] = 'rgb(0, 170, 170)';
    this.sgaCodeToColorMapVga[7] = 'rgb(170, 170, 170)';

    this.sgaCodeToBrightColorMapVga[0] = 'rgb(85, 85, 85)';
    this.sgaCodeToBrightColorMapVga[1] = 'rgb(255, 85, 85)';
    this.sgaCodeToBrightColorMapVga[2] = 'rgb(85, 255, 85)';
    this.sgaCodeToBrightColorMapVga[3] = 'rgb(255, 255, 85)';
    this.sgaCodeToBrightColorMapVga[4] = 'rgb(85, 85, 255)';
    this.sgaCodeToBrightColorMapVga[5] = 'rgb(255, 85, 255)';
    this.sgaCodeToBrightColorMapVga[6] = 'rgb(85, 255, 255)';
    this.sgaCodeToBrightColorMapVga[7] = 'rgb(255, 255, 255)';

    makeAutoObservable(this);
  }

  addVisibleText(text: string) {
    for (let idx = 0; idx < text.length; idx += 1) {
      const char = text[idx];
      const terminalChar = new TerminalChar();
      terminalChar.char = char;
      // We need to make a copy of the current style, so that future updates won't
      // effect all previous styles
      terminalChar.style = { ...this.currentStyle };
      const rowToInsertInto = this.terminalRows[this.cursorPosition[0]];
      rowToInsertInto.terminalChars.splice(
        this.cursorPosition[1],
        0,
        terminalChar
      );
    }

    // Increment cursor
    this.cursorPosition[1] += text.length;
  }

  clearData() {
    this.currentStyle = {};

    this.outputHtml = [];
    this.outputHtml.push(<span key={this.cursorPosition[0]}> </span>);
    this.cursorPosition = [0, 0];

    this.terminalRows = [];
    const terminalRow = new TerminalRow();
    const terminalChar = new TerminalChar();
    terminalChar.char = ' ';
    terminalRow.terminalChars.push(terminalChar);
    this.terminalRows.push(terminalRow);
  }

  setStyle(style: {}) {
    // Override any provided style properties
    this.currentStyle = Object.assign(this.currentStyle, style);
  }

  clearStyle() {
    // Clear all styles
    this.currentStyle = {};
    this.boldOrIncreasedIntensity = false;
  }

  setScrollLock(trueFalse: boolean) {
    this.scrollLock = trueFalse;
  }

  moveToNewLine() {
    // If we are currently not on the last row, we just need to move to the start of the next line
    if (this.cursorPosition[0] !== this.terminalRows.length - 1) {
      this.cursorPosition[0] += 1;
      this.cursorPosition[1] = 0;
    } else {
      const terminalRow = new TerminalRow();
      this.terminalRows.push(terminalRow);
      this.cursorPosition[0] += 1;
      this.cursorPosition[1] = 0;
    }
    // If there is no char at current cursor position in the row it's now in, insert empty space for cursor
    const rowCursorIsNowOn = this.terminalRows[this.cursorPosition[0]];
    if (this.cursorPosition[1] >= rowCursorIsNowOn.terminalChars.length) {
      const terminalChar = new TerminalChar();
      terminalChar.char = ' ';
      rowCursorIsNowOn.terminalChars.push(terminalChar);
    }
  }

  parseData(data: Buffer) {
    // Parse each character
    const dataAsStr = new TextDecoder().decode(data);
    for (let idx = 0; idx < data.length; idx += 1) {
      const char = dataAsStr[idx];
      console.log('char=', char);

      // Don't want to interpret new lines if we are half-way
      // through processing an ANSI escape code
      if (this.inIdleState && char === '\n') {
        console.log('Found new line char');
        this.moveToNewLine();
        // eslint-disable-next-line no-continue
        continue;
      }

      if (char === '\x1B') {
        console.log('Start of escape sequence found!');
        this.resetEscapeCodeParserState();
        this.inAnsiEscapeCode = true;
        this.inIdleState = false;
      }
      // If we are not currently processing an escape code
      // character is to be displayed
      if (this.inAnsiEscapeCode) {
        // Add received char to partial escape code
        this.partialEscapeCode += char;
        console.log('partialEscapeCode=', this.partialEscapeCode);
        if (this.partialEscapeCode === '\x1B[') {
          this.inCSISequence = true;
        }

        if (this.inCSISequence) {
          console.log('In CSI sequence');
          // Wait for alphabetic character to end CSI sequence
          if (char.toUpperCase() !== char.toLowerCase()) {
            console.log(
              'Received terminating letter of CSI sequence! Escape code = ',
              this.partialEscapeCode
            );
            this.parseCSISequence(this.partialEscapeCode);
            this.resetEscapeCodeParserState();
            this.inIdleState = true;
          }
        }
      } else {
        // Not currently receiving ANSI escape code,
        // so send character to terminal(s)
        this.addVisibleText(char);
      }
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

  parseCSISequence(ansiEscapeCode: string) {
    const lastChar = ansiEscapeCode.slice(ansiEscapeCode.length - 1);
    if (lastChar === 'm') {
      console.log('Found m, select graphic rendition code');
      // https://en.wikipedia.org/wiki/ANSI_escape_code#SGR
      // Allowed form: ESC[<first number>;<second number>;...m

      // Remove "ESC["" from start and "m" from end
      const numbersAndSemicolons = ansiEscapeCode.slice(
        2,
        ansiEscapeCode.length - 1
      );
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
        console.log('numberCode=', numberCode);
        if (numberCode === 0) {
          console.log('Clearing all SGR styles...');
          this.clearStyle();
        } else if (numberCode === 1) {
          // Got the "bold or increased intensity" code
          this.boldOrIncreasedIntensity = true;
        } else if (numberCode >= 30 && numberCode <= 37) {
          console.log('Setting foreground colour...');
          let color;
          if (this.boldOrIncreasedIntensity) {
            color = this.sgaCodeToBrightColorMapVga[numberCode - 30];
          } else {
            color = this.sgaCodeToColorMapVga[numberCode - 30];
          }
          console.log('color=', color);
          this.setStyle({ color });
        } else if (numberCode >= 40 && numberCode <= 47) {
          console.log('Setting background colour...');
          let color;
          if (this.boldOrIncreasedIntensity) {
            color = this.sgaCodeToBrightColorMapVga[numberCode - 40];
          } else {
            color = this.sgaCodeToColorMapVga[numberCode - 40];
          }
          console.log('color=', color);
          this.setStyle({ 'background-color': color });
        } else {
          console.log(
            `Number ${numberCode} provided to SGR control sequence unsupported.`
          );
        }
      }
    }
  }
}
