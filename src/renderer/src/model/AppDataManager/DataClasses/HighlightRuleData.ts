/**
 * Persisted shape of a single highlight rule. Plain old data — must be
 * JSON-serialisable. See `HighlightRule` (runtime MobX class) for the
 * behavior layered on top.
 */
export enum HighlightRuleSound {
  NONE = 'none',
  DING = 'ding',
  BUZZER = 'buzzer',
}

export class HighlightRuleData {
  version = 1;
  name = '';
  enabled = true;
  /** Regex source string. Compiled lazily by `HighlightRule.compiledRegex`. */
  pattern = '';
  caseSensitive = false;
  /** Hex string e.g. "#ffd54f". Painted as the background of matched chars. */
  backgroundColor = '#ffd54f';
  sound: HighlightRuleSound = HighlightRuleSound.NONE;
}

/**
 * Two starter rules that ship with every fresh install AND every v17→v18
 * upgrade — see `RulesSettingsData` and `migrateV17toV18`. Tuned for the
 * common embedded-dev case of watching for `warning` / `error` keywords in
 * device logs. Users can edit, delete, or extend these from the Rules
 * settings pane.
 *
 * Case-insensitive (the default) so `Warning`, `WARNING`, and `warning`
 * all match without users having to write regex flags themselves.
 */
export function makeDefaultHighlightRules(): HighlightRuleData[] {
  const warning = new HighlightRuleData();
  warning.name = 'Warning';
  warning.pattern = 'warning';
  warning.backgroundColor = '#ff9800'; // vivid orange
  // sound stays NONE — warnings shouldn't nag

  const error = new HighlightRuleData();
  error.name = 'Error';
  error.pattern = 'error';
  error.backgroundColor = '#d32f2f'; // dark red — keeps light terminal text readable
  error.sound = HighlightRuleSound.BUZZER;

  return [warning, error];
}
