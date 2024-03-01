import { z } from 'zod';

import { App } from 'src/App';
import Terminal from './SingleTerminal/SingleTerminal';
import NativeTerminal from './NativeTerminal/NativeTerminal';
import { ApplyableTextField } from 'src/Components/ApplyableTextField';
import { makeAutoObservable } from 'mobx';

const NATIVE_TERMINAL_TEST = true;

export default class Terminals {

  txRxTerminal: Terminal;

  rxTerminal: Terminal;

  txTerminal: Terminal;

  nativeTerminal: NativeTerminal;

  filterText: ApplyableTextField

  nativeTerminalTest = NATIVE_TERMINAL_TEST;

  constructor(app: App) {
    this.txRxTerminal = new Terminal(true, app.settings.dataProcessingSettings, app.settings.displaySettings, app.handleTerminalKeyDown);
    this.rxTerminal = new Terminal(false, app.settings.dataProcessingSettings, app.settings.displaySettings, app.handleTerminalKeyDown); // Not focusable
    this.txTerminal = new Terminal(true, app.settings.dataProcessingSettings, app.settings.displaySettings, app.handleTerminalKeyDown);

    this.nativeTerminal = new NativeTerminal(true, app.settings.dataProcessingSettings, app.settings.displaySettings, app.handleTerminalKeyDown);

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
