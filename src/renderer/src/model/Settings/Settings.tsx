import { makeAutoObservable } from 'mobx';

import TxSettings from './TxSettings/TxSettings';
import RxSettings from './RxSettings/RxSettings';
import DisplaySettings from './DisplaySettings/DisplaySettings';
import { PortSettings } from './PortSettings/PortSettings';
import GeneralSettings from './GeneralSettings/GeneralSettings';
import RulesSettings from './RulesSettings/RulesSettings';
import type { Session } from '../Session/Session';

export enum SettingsCategories {
  CONNECTION_CONFIGURATION,
  TX_SETTINGS,
  RX_SETTINGS,
  DISPLAY,
  GENERAL,
  PROFILES,
  RULES,
}

/**
 * One session's settings, grouped by pane. Each member is a façade over the
 * matching branch of the session's persisted config (see `SettingsBranch`).
 */
export class Settings {

  session: Session;

  activeSettingsCategory: SettingsCategories =
    SettingsCategories.CONNECTION_CONFIGURATION;

  portConfiguration: PortSettings;

  txSettings: TxSettings;

  rxSettings: RxSettings;

  displaySettings: DisplaySettings;

  generalSettings: GeneralSettings;

  rulesSettings: RulesSettings;

  constructor(session: Session) {
    this.session = session;

    this.portConfiguration = new PortSettings(session);
    this.txSettings = new TxSettings(session);
    this.rxSettings = new RxSettings(session);
    this.displaySettings = new DisplaySettings(session);
    this.generalSettings = new GeneralSettings(session);
    this.rulesSettings = new RulesSettings(session);
    makeAutoObservable(this, { session: false }); // Make sure this is at the end of the constructor
  }

  /** The application these settings belong to, via their session. */
  get app() {
    return this.session.app;
  }

  setActiveSettingsCategory(settingsCategory: SettingsCategories) {
    this.activeSettingsCategory = settingsCategory;
  }

  onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'f') {
      this.session.fakePortController.setIsDialogOpen(true);
    }
  }
}
