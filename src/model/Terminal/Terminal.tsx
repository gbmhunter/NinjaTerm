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
    // const spanToInsertInto = this.outputHtml[this.cursorPosition[0]];
    // const existingText = spanToInsertInto.props.children as string;
    // console.log(`existingText="${existingText}"`);
    // const newText =
    //   existingText.slice(0, this.cursorPosition[1]) +
    //   text +
    //   existingText.slice(this.cursorPosition[1]);
    // console.log(`newText="${newText}"`);
    // const style = makeAutoObservable({
    //   color: '#456789',
    // });
    // this.outputHtml[this.cursorPosition[0]] = toJS(
    //   <span key={this.cursorPosition[0]} style={style}>
    //     {newText}
    //   </span>
    // );

    for (let idx = 0; idx < text.length; idx += 1) {
      const char = text[idx];
      const terminalChar = new TerminalChar();
      terminalChar.char = char;
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
    this.currentStyle = {
      color: '#ffffff',
    };

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
    this.currentStyle = style;
  }

  setScrollLock(trueFalse: boolean) {
    this.scrollLock = trueFalse;
  }
}
