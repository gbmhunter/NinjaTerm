import { makeAutoObservable } from 'mobx';
import Terminal from './Terminal';

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
      this.txRxTerminal.txRxHtml.push(<span key={this.count}>{char}</span>);
      this.count += 1;
    }
  }
}
