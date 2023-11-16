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
    this.txRxTerminal = new Terminal(true, app.settings.dataProcessingSettings, app.settings.displaySettings, app.handleTerminalKeyDown);
    this.rxTerminal = new Terminal(false, app.settings.dataProcessingSettings, app.settings.displaySettings, app.handleTerminalKeyDown); // Not focusable
    this.txTerminal = new Terminal(true, app.settings.dataProcessingSettings, app.settings.displaySettings, app.handleTerminalKeyDown);

    this.filterText = new ApplyableTextField('', z.string());
    this.filterText.setOnApplyChanged(this.onFilterTextApply);

    makeAutoObservable(this); // Make sure this near the end
  }

  onFilterTextApply() {
    // Apply filter text to the two terminals which contain RX data
    this.txRxTerminal.setFilterText(this.filterText.appliedValue);
    this.rxTerminal.setFilterText(this.filterText.appliedValue);
  }
}
