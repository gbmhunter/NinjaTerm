import { makeAutoObservable } from 'mobx';

import type { Session } from 'src/model/Session/Session';
import { TerminalFilterData } from 'src/model/AppDataManager/DataClasses/TerminalFilterData';
import { TerminalFilter } from './TerminalFilter';

/**
 * Controller for the multiple-terminal-filters feature. Owns the ordered list
 * of `TerminalFilter` runtime objects and the load/save lifecycle. A single
 * instance is shared by the RX terminals (TX/RX combined + RX-only panes) so
 * the same filter list applies to both — see `Terminals`.
 *
 * Mirrors `RulesSettings`' shape — filters are persisted as POD objects in
 * the session config's `terminal.filters`, and the runtime objects are
 * recreated on every profile load.
 */
export class FilterController {
  session: Session;

  filters: TerminalFilter[] = [];

  constructor(session: Session) {
    this.session = session;
    this._loadConfig();
    this.session.registerOnConfigReload(['terminal.filters'], () => {
      this._loadConfig();
    });
    makeAutoObservable(this, { session: false });
  }

  /** Filters that currently affect the view (enabled, non-empty, and valid). */
  get activeFilters(): TerminalFilter[] {
    return this.filters.filter((f) => f.enabled && f.pattern !== '' && f.isValid);
  }

  /** Append a new empty filter (enabled by default). */
  addFilter = () => {
    const filter = new TerminalFilter(this._saveConfig);
    filter.loadConfig(new TerminalFilterData());
    this.filters.push(filter);
    this._saveConfig();
  };

  deleteFilter = (index: number) => {
    if (index < 0 || index >= this.filters.length) return;
    this.filters.splice(index, 1);
    this._saveConfig();
  };

  _saveConfig = () => {
    const config = this.session.config.terminal;
    config.filters = this.filters.map((filter) => filter.toConfig());
    this.session.saveAppData();
  };

  _loadConfig = () => {
    const configToLoad = this.session.config.terminal;
    this.filters = configToLoad.filters.map((filterCfg) => {
      const filter = new TerminalFilter(this._saveConfig);
      filter.loadConfig(filterCfg);
      return filter;
    });
  };
}
