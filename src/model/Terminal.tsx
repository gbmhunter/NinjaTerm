import { makeAutoObservable } from 'mobx';
import { ReactElement } from 'react';

/**
 * Represents a single terminal-style user interface.
 */
export default class Terminal {
  txRxHtml: ReactElement[];

  // If true, the data pane scroll will be locked at the bottom
  scrollLock = true;

  constructor() {
    this.txRxHtml = [];
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  setScrollLock(trueFalse: boolean) {
    this.scrollLock = trueFalse;
  }
}
