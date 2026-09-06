import { makeAutoObservable } from 'mobx';

import type { Session } from 'src/model/Session/Session';
import { HighlightRuleData } from 'src/model/AppDataManager/DataClasses/HighlightRuleData';
import { HighlightRule } from './HighlightRule';

/**
 * Settings controller for the regex-based highlight rules feature (formerly
 * the "Sounds" settings pane). Owns the ordered list of `HighlightRule`
 * runtime objects, the add/edit modal state, and the load/save lifecycle.
 *
 * Mirrors `MacroController`'s shape — rules are persisted as POD objects in
 * the session config's `settings.rulesSettings.rules`, runtime objects
 * are recreated on every profile load.
 */
export default class RulesSettings {
  session: Session;

  rules: HighlightRule[] = [];

  /** Rule currently shown in the add/edit modal, or null when the modal is closed. */
  ruleToDisplayInModal: HighlightRule | null = null;

  isModalOpen: boolean = false;

  constructor(session: Session) {
    this.session = session;
    this._loadConfig();
    this.session.registerOnConfigReload(['settings.rulesSettings'], () => {
      this._loadConfig();
    });
    makeAutoObservable(this, { session: false });
  }

  /** Append a new rule with defaults and open it in the edit modal. */
  addRule = () => {
    const rule = new HighlightRule(this._saveConfig);
    rule.loadConfig(new HighlightRuleData());
    // Suggest a name so the row isn't blank in the list.
    rule.name = `Rule ${this.rules.length + 1}`;
    this.rules.push(rule);
    this.ruleToDisplayInModal = rule;
    this.isModalOpen = true;
    this._saveConfig();
  };

  deleteRule = (index: number) => {
    if (index < 0 || index >= this.rules.length) return;
    this.rules.splice(index, 1);
    this._saveConfig();
  };

  setRuleToDisplayInModal = (rule: HighlightRule | null) => {
    this.ruleToDisplayInModal = rule;
  };

  setIsModalOpen = (isOpen: boolean) => {
    this.isModalOpen = isOpen;
    if (!isOpen) this.ruleToDisplayInModal = null;
  };

  _saveConfig = () => {
    const config = this.session.config.settings.rulesSettings;
    config.rules = this.rules.map((rule) => rule.toConfig());
    this.session.saveAppData();
  };

  _loadConfig = () => {
    const configToLoad = this.session.config.settings.rulesSettings;
    this.rules = configToLoad.rules.map((ruleCfg) => {
      const rule = new HighlightRule(this._saveConfig);
      rule.loadConfig(ruleCfg);
      return rule;
    });
    this.ruleToDisplayInModal = null;
    this.isModalOpen = false;
  };
}
