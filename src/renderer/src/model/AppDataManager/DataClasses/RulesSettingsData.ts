import { HighlightRuleData } from './HighlightRuleData';

/**
 * Persisted shape of the Rules settings pane (formerly Sounds). Holds the
 * ordered list of user-defined highlight rules. Each rule can paint matched
 * characters with a background color and optionally play a sound when the
 * matching line finalises — see `RulesSettings` for the runtime behavior.
 */
export class RulesSettingsData {
  rules: HighlightRuleData[] = [];
}
