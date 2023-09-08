// import TextDecoder from 'util';
import { makeAutoObservable } from 'mobx';
import { TextEncoder, TextDecoder } from 'util';

import Terminal from './Terminal/Terminal';

// Polyfill because TextDecoder is not bundled with jsdom 16 and breaks Jest, see
// https://stackoverflow.com/questions/68468203/why-am-i-getting-textencoder-is-not-defined-in-jest
Object.assign(global, { TextDecoder, TextEncoder });

export default class RxDataParser {
  txRxTerminal: Terminal;

  count = 0;

  constructor(txRxTerminal: Terminal) {
    this.txRxTerminal = txRxTerminal;
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  parseData(data: Buffer) {
    // Parse each character
    const dataAsStr = new TextDecoder().decode(data);
    for (let idx = 0; idx < data.length; idx += 1) {
      const char = dataAsStr[idx];
      if (char === '\x1B') {
        console.log('Start of escape sequence found!');
      }
      this.txRxTerminal.addChar(char);
    }
  }
}
