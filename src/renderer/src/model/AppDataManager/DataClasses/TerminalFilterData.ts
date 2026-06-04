/**
 * Persisted shape of a single terminal filter. Plain old data — must be
 * JSON-serialisable. See `TerminalFilter` (runtime MobX class) for the
 * behavior layered on top.
 *
 * Filters are applied with match-any (OR) semantics: a terminal row is shown
 * if it matches at least one enabled filter (see
 * `SingleTerminal.filteredTerminalRows`). An empty filter list means no
 * filtering — all rows are shown.
 */
export class TerminalFilterData {
  version = 1;
  enabled = true;
  /**
   * Match string. Treated as a plain substring unless `useRegex` is true, in
   * which case it is compiled as a regex (lazily, by `TerminalFilter`).
   */
  pattern = '';
  /** When true, `pattern` is interpreted as a regular expression. */
  useRegex = false;
  caseSensitive = false;
}
