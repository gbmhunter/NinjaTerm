import { expect, test, describe, beforeEach } from 'vitest';

import { App } from 'src/model/App';
import { DataViewConfiguration } from 'src/model/Settings/DisplaySettings/DisplaySettings';

describe('Terminals.activeTerminal', () => {
  let app: App;
  beforeEach(() => {
    window.localStorage.clear();
    app = new App();
  });

  test('returns the combined TX/RX terminal in single-pane mode', () => {
    app.settings.displaySettings.setDataViewConfiguration(DataViewConfiguration.SINGLE_TERMINAL);
    expect(app.terminals.activeTerminal).toBe(app.terminals.txRxTerminal);
  });

  test('returns the TX terminal in split TX/RX mode', () => {
    app.settings.displaySettings.setDataViewConfiguration(DataViewConfiguration.SEPARATE_TX_RX_TERMINALS);
    expect(app.terminals.activeTerminal).toBe(app.terminals.txTerminal);
  });

  test('switches when the user toggles pane mode', () => {
    app.settings.displaySettings.setDataViewConfiguration(DataViewConfiguration.SINGLE_TERMINAL);
    expect(app.terminals.activeTerminal).toBe(app.terminals.txRxTerminal);
    app.settings.displaySettings.setDataViewConfiguration(DataViewConfiguration.SEPARATE_TX_RX_TERMINALS);
    expect(app.terminals.activeTerminal).toBe(app.terminals.txTerminal);
  });
});

describe('Terminals.showCursor flag', () => {
  let app: App;
  beforeEach(() => {
    window.localStorage.clear();
    app = new App();
  });

  test('combined and TX panes show a cursor, RX pane does not', () => {
    expect(app.terminals.txRxTerminal.showCursor).toBe(true);
    expect(app.terminals.txTerminal.showCursor).toBe(true);
    expect(app.terminals.rxTerminal.showCursor).toBe(false);
  });
});
