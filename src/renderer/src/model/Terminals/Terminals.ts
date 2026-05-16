import { z } from 'zod';
import { makeAutoObservable, computed } from 'mobx';

import { App } from 'src/model/App';
import { SingleTerminal } from './SingleTerminal/SingleTerminal';
import { ApplyableTextField } from 'src/view/Components/ApplyableTextField';
import RightDrawer from './RightDrawer/RightDrawer';
import { DataViewConfiguration } from 'src/model/Settings/DisplaySettings/DisplaySettings';

export default class Terminals {

  app: App;

  txRxTerminal: SingleTerminal;

  rxTerminal: SingleTerminal;

  txTerminal: SingleTerminal;

  filterText: ApplyableTextField;

  rightDrawer: RightDrawer;

  showRightDrawer = true;

  constructor(app: App) {
    this.app = app;

    this.txRxTerminal = new SingleTerminal('tx-rx-terminal', true, app.settings.rxSettings, app.settings.displaySettings, app.snackbar, app.handleTerminalKeyDown, app.settings.rulesSettings, app.soundPlayer);
    this.rxTerminal = new SingleTerminal('rx-terminal', false, app.settings.rxSettings, app.settings.displaySettings, app.snackbar, app.handleTerminalKeyDown, app.settings.rulesSettings, app.soundPlayer);
    this.txTerminal = new SingleTerminal('tx-terminal', true, app.settings.rxSettings, app.settings.displaySettings, app.snackbar, app.handleTerminalKeyDown, app.settings.rulesSettings, app.soundPlayer);
    this.rightDrawer = new RightDrawer(app);

    this.filterText = new ApplyableTextField('', z.string());
    this.filterText.setOnApplyChanged(this.onFilterTextApply);

    this._loadConfig();
    this.app.profileManager.registerOnProfileLoad(() => {
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

  /**
   * Needs to be arrow function, passed around as a callback
   */
  onFilterTextApply = () => {
    // Apply filter text to the two terminals which contain RX data
    this.txRxTerminal.setFilterText(this.filterText.appliedValue);
    this.rxTerminal.setFilterText(this.filterText.appliedValue);
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
