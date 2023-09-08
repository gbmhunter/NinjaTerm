import { makeAutoObservable } from 'mobx';
import { ReactElement } from 'react';

/**
 * Represents a single terminal-style user interface.
 */
export default class Terminal {
  txRxHtml: ReactElement[];

  // This represents the current style active on the terminal
  currentStyle: {};

  cursorPosition: [number, number];

  // If true, the data pane scroll will be locked at the bottom
  scrollLock = true;

  constructor() {
    this.txRxHtml = [];

    this.currentStyle = {
      color: '#ffffff',
    };

    this.txRxHtml.push(<span> </span>);
    this.cursorPosition = [0, 0];
    makeAutoObservable(this);
  }

  addText(text: string) {
    const spanToInsertInto = this.txRxHtml[this.cursorPosition[0]];
    const existingText = spanToInsertInto.props.children as string;
    const newText =
      existingText.slice(0, this.cursorPosition[1]) +
      text +
      existingText.slice(this.cursorPosition[1]);
    this.txRxHtml[this.cursorPosition[0]] = <span>{newText}</span>;
  }

  setScrollLock(trueFalse: boolean) {
    this.scrollLock = trueFalse;
  }
}
