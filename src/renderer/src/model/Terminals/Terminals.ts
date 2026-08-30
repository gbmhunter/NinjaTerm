import { makeAutoObservable, computed } from 'mobx';

import { App } from 'src/model/App';
import { SingleTerminal } from './SingleTerminal/SingleTerminal';
import { FilterController } from './Filters/FilterController';
import RightDrawer from './RightDrawer/RightDrawer';
import { DataViewConfiguration } from 'src/model/Settings/DisplaySettings/DisplaySettings';

export default class Terminals {

  app: App;

  txRxTerminal: SingleTerminal;

  rxTerminal: SingleTerminal;

  txTerminal: SingleTerminal;

  /**
   * Shared list of view filters. A single instance is passed to both RX
   * terminals so the same filters apply to the combined TX/RX pane and the
   * RX-only pane.
   */
  filterController: FilterController;

  rightDrawer: RightDrawer;

  showRightDrawer = true;

  constructor(app: App) {
    this.app = app;

    this.filterController = new FilterController(app.profileManager);

    this.txRxTerminal = new SingleTerminal('tx-rx-terminal', true, app.settings.rxSettings, app.settings.displaySettings, app.snackbar, app.handleTerminalKeyDown, app.settings.rulesSettings, app.soundPlayer, this.filterController);
    this.rxTerminal = new SingleTerminal('rx-terminal', false, app.settings.rxSettings, app.settings.displaySettings, app.snackbar, app.handleTerminalKeyDown, app.settings.rulesSettings, app.soundPlayer, this.filterController);
    this.txTerminal = new SingleTerminal('tx-terminal', true, app.settings.rxSettings, app.settings.displaySettings, app.snackbar, app.handleTerminalKeyDown, app.settings.rulesSettings, app.soundPlayer);
    this.rightDrawer = new RightDrawer(app);

    this._loadConfig();
    this.app.profileManager.registerOnConfigReload(['terminal.rightDrawer'], () => {
      this._loadConfig();
    });

    makeAutoObservable(this, {
      activeTerminal: computed,
    }); // Make sure this near the end
  }

  /**
   * The terminal that receives keystrokes typed by the user and shows a
   * blinking cursor. In single-pane mode this is the combined TX/RX terminal;
   * in split mode it's the TX pane (the RX pane is output-only). There is no
   * notion of click-focus — the active terminal is fully determined by the
   * current `dataViewConfiguration`.
   */
  get activeTerminal(): SingleTerminal {
    if (this.app.settings.displaySettings.dataViewConfiguration === DataViewConfiguration.SEPARATE_TX_RX_TERMINALS) {
      return this.txTerminal;
    }
    return this.txRxTerminal;
  }

  setShowRightDrawer(show: boolean) {
    this.showRightDrawer = show;
    this._saveConfig();
  }

  _saveConfig = () => {
    const config = this.app.profileManager.appData.currentAppConfig.terminal.rightDrawer;
    config.showRightDrawer = this.showRightDrawer;
    this.app.profileManager.saveAppData();
  };

  _loadConfig = () => {
    const configToLoad = this.app.profileManager.appData.currentAppConfig.terminal.rightDrawer;
    this.showRightDrawer = configToLoad.showRightDrawer;
  };
}
