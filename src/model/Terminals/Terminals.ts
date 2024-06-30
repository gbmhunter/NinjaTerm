import { z } from 'zod';
import { makeAutoObservable } from 'mobx';

import { App } from 'src/model/App';
import SingleTerminal from './SingleTerminal/SingleTerminal';
import { ApplyableTextField } from 'src/view/Components/ApplyableTextField';
import RightDrawer from './RightDrawer/RightDrawer';

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

    this.txRxTerminal = new SingleTerminal('tx-rx-terminal', true, app.settings.rxSettings, app.settings.displaySettings, app.snackbar, app.handleTerminalKeyDown);
    this.rxTerminal = new SingleTerminal('rx-terminal', false, app.settings.rxSettings, app.settings.displaySettings, app.snackbar, app.handleTerminalKeyDown); // Not focusable
    this.txTerminal = new SingleTerminal('tx-terminal', true, app.settings.rxSettings, app.settings.displaySettings, app.snackbar, app.handleTerminalKeyDown);
    this.rightDrawer = new RightDrawer(app);

    this.filterText = new ApplyableTextField('', z.string());
    this.filterText.setOnApplyChanged(this.onFilterTextApply);

    this._loadConfig();
    this.app.profileManager.registerOnProfileLoad(() => {
      this._loadConfig();
    });

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

  setShowRightDrawer(show: boolean) {
    this.showRightDrawer = show;
    this._saveConfig();
  }

  _saveConfig = () => {
    let config = this.app.profileManager.appData.currentAppConfig.terminal.rightDrawer;
    config.showRightDrawer = this.showRightDrawer;
    this.app.profileManager.saveAppData();
  };

  _loadConfig = () => {
    let configToLoad = this.app.profileManager.appData.currentAppConfig.terminal.rightDrawer;
    this.showRightDrawer = configToLoad.showRightDrawer;
  };
}
