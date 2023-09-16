import { makeAutoObservable } from 'mobx';

/**
 * Represents a single terminal-style user interface.
 */
export default class Style {
  foregroundColor: string;

  constructor() {
    this.foregroundColor = '#ffffff';
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }
}
