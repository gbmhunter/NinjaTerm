import { makeAutoObservable } from 'mobx';

/**
 * Represents a single character in the terminal
 */
export default class TerminalChar {
  char: string;

  constructor() {
    this.char = '';
    makeAutoObservable(this);
  }
}
