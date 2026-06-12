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

/**
 * How wide the painted background extends when a rule matches.
 *
 * - `MATCH` paints only the characters the regex matched (the historic
 *   behavior — first version of the feature).
 * - `LINE` paints every row that belongs to the matched logical line,
 *   including wrap segments. This is useful for rules like
 *   `(?i)\berror\b` where the user wants the whole line to read as red.
 */
export enum HighlightScope {
  MATCH = 'match',
  LINE = 'line',
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
  /**
   * Whether the background extends only over the matched characters or
   * across the whole logical line (covering wrap segments). See
   * `HighlightScope`. Defaults to `LINE` because that's what most users
   * reach for (e.g. `\berror\b` paints the whole error row).
   */
  scope: HighlightScope = HighlightScope.LINE;
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
 *
 * Both ship DISABLED by default — they're handy templates, but few users
 * want their logs auto-highlighted out of the box. Existing users get them
 * switched off too via `migrateV20toV21`.
 */
export function makeDefaultHighlightRules(): HighlightRuleData[] {
  // Both default rules use LINE scope (inherited from the POD field
  // initializer) so a matching log line lights up across wrap segments.
  const warning = new HighlightRuleData();
  warning.name = 'Warning';
  warning.enabled = false;
  warning.pattern = 'warning';
  // Material deep-orange 900. Contrast vs white text ≈ 6.7:1 —
  // comfortably above WCAG AA (4.5:1). The vivid #ff9800 we started
  // with was ~2:1 and washed out white text.
  warning.backgroundColor = '#df8004';
  // sound stays NONE — warnings shouldn't nag

  const error = new HighlightRuleData();
  error.name = 'Error';
  error.enabled = false;
  error.pattern = 'error';
  // Material red 900. Contrast vs white text ≈ 7.9:1, clearly red.
  error.backgroundColor = '#b71c1c';
  error.sound = HighlightRuleSound.BUZZER;

  return [warning, error];
}
