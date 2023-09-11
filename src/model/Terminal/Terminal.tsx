import { makeAutoObservable } from 'mobx';
import { ReactElement } from 'react';

import TerminalRow from './TerminalRow';
import TerminalChar from './TerminalChar';

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

    makeAutoObservable(this);
  }

  addText(text: string) {
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
      console.log('row=', rowToInsertInto.terminalChars);
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

  setScrollLock(trueFalse: boolean) {
    this.scrollLock = trueFalse;
  }

  moveToNewLine() {
    // If we are currently not on the last row, we just need to move to the start of the next line
    if (this.cursorPosition[0] !== this.terminalRows.length - 1) {
      console.log('Not on last line.');
      this.cursorPosition[0] += 1;
      this.cursorPosition[1] = 0;
    } else {
      console.log('Cursor on last line!');
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
}
