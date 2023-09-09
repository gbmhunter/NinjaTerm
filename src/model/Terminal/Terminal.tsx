import { makeAutoObservable, makeObservable, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { ReactElement } from 'react';

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

  constructor() {
    this.outputHtml = [];
    this.cursorPosition = [0, 0];

    // This is just to keep typescript happy, they
    // are all set in clearData() anyway.
    this.currentStyle = {
      color: '#ffffff',
    };
    this.clearData();
    makeAutoObservable(this);
  }

  addText(text: string) {
    const spanToInsertInto = this.outputHtml[this.cursorPosition[0]];
    const existingText = spanToInsertInto.props.children as string;
    console.log(`existingText="${existingText}"`);
    const newText =
      existingText.slice(0, this.cursorPosition[1]) +
      text +
      existingText.slice(this.cursorPosition[1]);
    console.log(`newText="${newText}"`);
    const style = makeAutoObservable({
      color: '#456789',
    });
    this.outputHtml[this.cursorPosition[0]] = toJS(
      <span key={this.cursorPosition[0]} style={style}>
        {newText}
      </span>
    );
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
  }

  setStyle(style: {}) {
    this.currentStyle = style;
  }

  setScrollLock(trueFalse: boolean) {
    this.scrollLock = trueFalse;
  }
}
