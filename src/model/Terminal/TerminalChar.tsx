import { makeAutoObservable } from 'mobx';

/**
 * Represents a single character in the terminal
 */
export default class TerminalChar {
  char: string;

  style: {};

  constructor() {
    this.char = '';
    this.style = {};
    makeAutoObservable(this);
  }
}
