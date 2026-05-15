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
