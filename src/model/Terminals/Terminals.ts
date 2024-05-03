import { z } from 'zod';

import { App } from 'src/model/App';
import SingleTerminal from './SingleTerminal/SingleTerminal';
import { ApplyableTextField } from 'src/view/Components/ApplyableTextField';
import { makeAutoObservable } from 'mobx';

export default class Terminals {

  txRxTerminal: SingleTerminal;

  rxTerminal: SingleTerminal;

  txTerminal: SingleTerminal;

  filterText: ApplyableTextField

  constructor(app: App) {
    this.txRxTerminal = new SingleTerminal('tx-rx-terminal', true, app.settings.rxSettings, app.settings.displaySettings, app.handleTerminalKeyDown);
    this.rxTerminal = new SingleTerminal('rx-terminal', false, app.settings.rxSettings, app.settings.displaySettings, app.handleTerminalKeyDown); // Not focusable
    this.txTerminal = new SingleTerminal('tx-terminal', true, app.settings.rxSettings, app.settings.displaySettings, app.handleTerminalKeyDown);

    this.filterText = new ApplyableTextField('', z.string());
    this.filterText.setOnApplyChanged(this.onFilterTextApply);

    makeAutoObservable(this); // Make sure this near the end
  }

  /**
   * Needs to be arrow function, passed around as a callback
   */
  onFilterTextApply = () => {
    // Apply filter text to the two terminals which contain RX data
    this.txRxTerminal.setFilterText(this.filterText.appliedValue);
    this.rxTerminal.setFilterText(this.filterText.appliedValue);
  }
}
