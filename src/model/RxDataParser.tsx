/* eslint-disable no-continue */
// import TextDecoder from 'util';
import { makeAutoObservable } from 'mobx';
import { TextEncoder, TextDecoder } from 'util';

import Terminal from './Terminal/Terminal';

// Polyfill because TextDecoder is not bundled with jsdom 16 and breaks Jest, see
// https://stackoverflow.com/questions/68468203/why-am-i-getting-textencoder-is-not-defined-in-jest
Object.assign(global, { TextDecoder, TextEncoder });

export default class RxDataParser {
  txRxTerminal: Terminal;

  // True if this RX data parser is just processing text as plain text, i.e.
  // no partial escape code has been detected.
  inIdleState: boolean;

  // True if we have received the escape code start char and are currently waiting
  // for more data to complete the sequence
  inAnsiEscapeCode: boolean;

  // True is we have received part of a CSI sequence ("ESC[")
  inCSISequence: boolean;

  partialEscapeCode: string;

  codeToNormalColourMap: { [key: string]: string } = {};

  count = 0;

  constructor(txRxTerminal: Terminal) {
    this.txRxTerminal = txRxTerminal;
    this.inIdleState = true;
    this.inAnsiEscapeCode = false;
    this.partialEscapeCode = '';
    this.inCSISequence = false;

    // Populate the map with data
    // TODO: Add support for [ESC][0m
    this.codeToNormalColourMap['30'] = 'rgb(0, 0, 0)';
    this.codeToNormalColourMap['31'] = 'rgb(170, 0, 0)';
    this.codeToNormalColourMap['32'] = 'rgb(0, 170, 0)';
    this.codeToNormalColourMap['33'] = 'rgb(170, 85, 0)';
    this.codeToNormalColourMap['34'] = 'rgb(0, 0, 170)';
    this.codeToNormalColourMap['35'] = 'rgb(170, 0, 170)';
    this.codeToNormalColourMap['36'] = 'rgb(0, 170, 170)';
    this.codeToNormalColourMap['37'] = 'rgb(170, 170, 170)';

    makeAutoObservable(this); // Make sure this is at the end of the constructor
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
        this.txRxTerminal.moveToNewLine();
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
            // this.parseCSISequence(this.partialEscapeCode);
            this.resetEscapeCodeParserState();
            this.inIdleState = true;
          }
        }
      } else {
        // Not currently receiving ANSI escape code,
        // so send character to terminal(s)
        this.txRxTerminal.addVisibleText(char);
      }
    }
  }

  resetEscapeCodeParserState() {
    this.inAnsiEscapeCode = false;
    this.partialEscapeCode = '';
    this.inCSISequence = false;
  }
}
