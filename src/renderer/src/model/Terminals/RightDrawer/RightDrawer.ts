import { makeAutoObservable } from 'mobx';
import { MacroController } from './Macros/MacroController';
import type { Session } from 'src/model/Session/Session';
import { SettingsBranch } from 'src/model/Settings/SettingsBranch';

/**
 * Persisted right-drawer state. Everything in this class must be POD and
 * serializable to JSON.
 */
export class RightDrawerConfig {
  showRightDrawer = true;

  rightDrawerWidth_px = 400;

  /**
   * Expand the quick port settings and macro accordions by default.
   */
  quickPortSettingsIsExpanded = true;
  otherQuickSettingsIsExpanded = false;
  macrosIsExpanded = true;
  flowControlIsExpanded = true;
}

export default class RightDrawer {
  macroController: MacroController;

  /**
   * The persisted drawer state — the only copy of each setting. See
   * `SettingsBranch`. `Terminals.showRightDrawer` reads through to this same
   * branch.
   */
  private readonly branch = new SettingsBranch<RightDrawerConfig>('terminal.rightDrawer', (c) => c.terminal.rightDrawer);

  get showRightDrawer() {
    return this.branch.data.showRightDrawer;
  }
  setShowRightDrawer = this.branch.setter('showRightDrawer');

  get drawerWidth_px() {
    return this.branch.data.rightDrawerWidth_px;
  }
  setDrawerWidth = this.branch.setter('rightDrawerWidth_px');

  get quickPortSettingsIsExpanded() {
    return this.branch.data.quickPortSettingsIsExpanded;
  }
  handleQuickPortSettingsAccordionChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    this.branch.set('quickPortSettingsIsExpanded', isExpanded);
  };

  get otherQuickSettingsIsExpanded() {
    return this.branch.data.otherQuickSettingsIsExpanded;
  }
  handleOtherQuickSettingsAccordionChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    this.branch.set('otherQuickSettingsIsExpanded', isExpanded);
  };

  get macrosIsExpanded() {
    return this.branch.data.macrosIsExpanded;
  }
  handleMacrosAccordionChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    this.branch.set('macrosIsExpanded', isExpanded);
  };

  get flowControlIsExpanded() {
    return this.branch.data.flowControlIsExpanded;
  }
  handleFlowControlAccordionChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    this.branch.set('flowControlIsExpanded', isExpanded);
  };

  constructor(session: Session) {
    this.macroController = new MacroController(session);
    this.branch.attach(session);

    makeAutoObservable<RightDrawer, 'branch'>(this, { branch: false }); // Make sure this near the end
  }
}
