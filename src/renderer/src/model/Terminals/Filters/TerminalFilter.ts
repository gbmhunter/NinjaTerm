import { makeAutoObservable } from 'mobx';

import { TerminalFilterData } from 'src/model/AppDataManager/DataClasses/TerminalFilterData';

/**
 * Runtime MobX wrapper around a single `TerminalFilterData` row. Provides the
 * `matches(text)` primitive used by `SingleTerminal.filteredTerminalRows`,
 * compiles the user's regex source lazily (when `useRegex` is set), caches the
 * result, and exposes a string `errorMsg` so views can show inline validation
 * without going through a snackbar.
 *
 * Mutators take an `onChange` callback (passed by `FilterController`) which
 * triggers persistence — mirrors the pattern used by `HighlightRule`.
 */
export class TerminalFilter {
  enabled: boolean = true;
  pattern: string = '';
  useRegex: boolean = false;
  caseSensitive: boolean = false;

  /** Most recent regex compile error, or '' when compile succeeded / not in regex mode. */
  errorMsg: string = '';

  /** Cached compiled regex. `null` when not in regex mode, pattern is empty, or invalid. */
  private _cachedRegex: RegExp | null = null;

  /** Cache key — invalidates `_cachedRegex` when pattern/regex/case-sensitivity changes. */
  private _cachedRegexKey: string = ' ';

  onChange: (() => void) | null;

  constructor(onChange: (() => void) | null = null) {
    this.onChange = onChange;
    makeAutoObservable(this, {
      // Caches are imperative, not reactive.
      _cachedRegex: false,
      _cachedRegexKey: false,
    } as any);
  }

  /**
   * Lazily compile the regex when in regex mode. Returns `null` (without an
   * error) when not in regex mode or the pattern is empty; returns `null` with
   * `errorMsg` populated when the pattern is an invalid regex. Compiled once
   * per pattern+useRegex+caseSensitive combination so the per-row filter scan
   * doesn't re-parse on every recompute.
   */
  get compiledRegex(): RegExp | null {
    const key = `${this.useRegex ? 're' : 'ss'}:${this.caseSensitive ? 'cs' : 'ci'}:${this.pattern}`;
    if (key === this._cachedRegexKey) {
      return this._cachedRegex;
    }
    this._cachedRegexKey = key;
    if (!this.useRegex || this.pattern.length === 0) {
      this._cachedRegex = null;
      this.errorMsg = '';
      return null;
    }
    try {
      const flags = this.caseSensitive ? '' : 'i';
      this._cachedRegex = new RegExp(this.pattern, flags);
      this.errorMsg = '';
    } catch (e) {
      this._cachedRegex = null;
      this.errorMsg = e instanceof Error ? e.message : 'Invalid regex';
    }
    return this._cachedRegex;
  }

  /**
   * Whether this filter is usable for matching: in regex mode it must compile;
   * in substring mode it's always valid. An empty pattern is "valid" but never
   * matches anything (see `matches`).
   */
  get isValid(): boolean {
    if (this.useRegex && this.pattern.length > 0) {
      return this.compiledRegex !== null;
    }
    return true;
  }

  /**
   * The single matching primitive. Returns false for an empty pattern (so a
   * blank filter never hides rows). Substring mode uses `includes` (lower-cased
   * both sides when not case-sensitive); regex mode uses the compiled regex.
   */
  matches(text: string): boolean {
    if (this.pattern.length === 0) {
      return false;
    }
    if (this.useRegex) {
      const re = this.compiledRegex;
      if (re === null) {
        return false;
      }
      // Reset lastIndex defensively in case flags ever include 'g'.
      re.lastIndex = 0;
      return re.test(text);
    }
    if (this.caseSensitive) {
      return text.includes(this.pattern);
    }
    return text.toLowerCase().includes(this.pattern.toLowerCase());
  }

  setEnabled = (value: boolean) => {
    this.enabled = value;
    this._notify();
  };
  setPattern = (value: string) => {
    this.pattern = value;
    // Touch `compiledRegex` so `errorMsg` is refreshed for views that bind to it.
    void this.compiledRegex;
    this._notify();
  };
  setUseRegex = (value: boolean) => {
    this.useRegex = value;
    void this.compiledRegex;
    this._notify();
  };
  setCaseSensitive = (value: boolean) => {
    this.caseSensitive = value;
    void this.compiledRegex;
    this._notify();
  };

  toConfig(): TerminalFilterData {
    const cfg = new TerminalFilterData();
    cfg.enabled = this.enabled;
    cfg.pattern = this.pattern;
    cfg.useRegex = this.useRegex;
    cfg.caseSensitive = this.caseSensitive;
    return cfg;
  }

  loadConfig(cfg: TerminalFilterData) {
    this.enabled = cfg.enabled;
    this.pattern = cfg.pattern;
    this.useRegex = cfg.useRegex;
    this.caseSensitive = cfg.caseSensitive;
    // Force regex recompile on next access.
    this._cachedRegexKey = ' ';
  }

  private _notify() {
    if (this.onChange) this.onChange();
  }
}
