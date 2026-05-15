import { makeAutoObservable } from 'mobx';

import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { HighlightRuleData } from 'src/model/AppDataManager/DataClasses/HighlightRuleData';
import { HighlightRule } from './HighlightRule';

/**
 * Settings controller for the regex-based highlight rules feature (formerly
 * the "Sounds" settings pane). Owns the ordered list of `HighlightRule`
 * runtime objects, the add/edit modal state, and the load/save lifecycle.
 *
 * Mirrors `MacroController`'s shape — rules are persisted as POD objects in
 * `appData.currentAppConfig.settings.rulesSettings.rules`, runtime objects
 * are recreated on every profile load.
 */
export default class RulesSettings {
  profileManager: AppDataManager;

  rules: HighlightRule[] = [];

  /** Rule currently shown in the add/edit modal, or null when the modal is closed. */
  ruleToDisplayInModal: HighlightRule | null = null;

  isModalOpen: boolean = false;

  constructor(profileManager: AppDataManager) {
    this.profileManager = profileManager;
    this._loadConfig();
    this.profileManager.registerOnProfileLoad(() => {
      this._loadConfig();
    });
    makeAutoObservable(this);
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
    const config = this.profileManager.appData.currentAppConfig.settings.rulesSettings;
    config.rules = this.rules.map((rule) => rule.toConfig());
    this.profileManager.saveAppData();
  };

  _loadConfig = () => {
    const configToLoad = this.profileManager.appData.currentAppConfig.settings.rulesSettings;
    this.rules = configToLoad.rules.map((ruleCfg) => {
      const rule = new HighlightRule(this._saveConfig);
      rule.loadConfig(ruleCfg);
      return rule;
    });
    this.ruleToDisplayInModal = null;
    this.isModalOpen = false;
  };
}
