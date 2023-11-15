import { App } from 'src/App';
import Terminal from './SingleTerminal/SingleTerminal';

export default class Terminals {

  txRxTerminal: Terminal;

  rxTerminal: Terminal;

  txTerminal: Terminal;

  constructor(app: App) {
    this.txRxTerminal = new Terminal(app, true);
    this.rxTerminal = new Terminal(app, false); // Not focusable
    this.txTerminal = new Terminal(app, true);
  }
}
