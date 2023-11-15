import { z } from 'zod';

import { App } from 'src/App';
import Terminal from './SingleTerminal/SingleTerminal';
import { ApplyableTextField } from 'src/Components/ApplyableTextField';
import { makeAutoObservable } from 'mobx';

export default class Terminals {

  txRxTerminal: Terminal;

  rxTerminal: Terminal;

  txTerminal: Terminal;

  filterText: ApplyableTextField

  constructor(app: App) {
    this.txRxTerminal = new Terminal(app, true);
    this.rxTerminal = new Terminal(app, false); // Not focusable
    this.txTerminal = new Terminal(app, true);

    this.filterText = new ApplyableTextField('', z.string());
    this.filterText.setOnApplyChanged(this.onFilterTextApply);

    makeAutoObservable(this); // Make sure this near the end
  }

  onFilterTextApply() {
    console.log('onFilterTextApply() called');
  }
}
