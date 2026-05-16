import { HighlightRuleData, makeDefaultHighlightRules } from './HighlightRuleData';

/**
 * Persisted shape of the Rules settings pane (formerly Sounds). Holds the
 * ordered list of user-defined highlight rules. Each rule can paint matched
 * characters with a background color and optionally play a sound when the
 * matching line finalises — see `RulesSettings` for the runtime behavior.
 *
 * Fresh installs ship with two starter rules (Warning, Error) — see
 * `makeDefaultHighlightRules`. The v17→v18 migration seeds the same set
 * for upgrading users.
 */
export class RulesSettingsData {
  rules: HighlightRuleData[] = makeDefaultHighlightRules();
}
