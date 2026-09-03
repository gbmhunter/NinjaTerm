import { expect, test, describe, beforeEach } from 'vitest';

import { DataDirection, SingleTerminal } from './SingleTerminal';
import RxSettings from 'src/model/Settings/RxSettings/RxSettings';
import DisplaySettings from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { App } from 'src/model/App';
import SnackbarController from 'src/model/SnackbarController/SnackbarController';
import RulesSettings from 'src/model/Settings/RulesSettings/RulesSettings';
import { HighlightScope } from 'src/model/AppDataManager/DataClasses/HighlightRuleData';

/**
 * Throughput benchmarks for the SingleTerminal byte-parsing hot path.
 *
 * The *number* printed to stdout (MB/s) is what matters — run before and after
 * a perf change and compare, and record it in
 * `performance-profiles/THROUGHPUT_BASELINES.md`. The assertion floors are
 * catastrophe guards, not regression detectors: the parse scenarios are only
 * ~1.5x apart between the current and previous row model, so no floor can both
 * pass reliably and detect a regression of that size.
 *
 * The remaining hot spots, in rough order of cost:
 *   - `String.fromCharCode` + `chars.push` per byte in `TerminalRow.appendChar`
 *   - row creation + `_addOrRemoveRowFromFilteredRows` on every wrap
 *   - timestamps are emitted one character at a time through `addVisibleChar`
 *
 * Past regressions to guard against:
 *   - _parseAsciiData() Array.shift() loop (O(n^2) on chunk size) — fixed
 *   - partialEscapeCode += String.fromCharCode(b) per byte — fixed
 *   - moment() per line regardless of millisecond — fixed (cached at ms)
 *   - one MobX change notification per received byte — fixed (rows hold no
 *     MobX state; `SingleTerminal.renderVersion` signals once per chunk)
 */
describe('SingleTerminal parsing throughput', () => {
  let singleTerminal: SingleTerminal;

  beforeEach(() => {
    window.localStorage.clear();
    const app = new App();
    const profileManager = new AppDataManager(app);
    const rxSettings = new RxSettings(profileManager);
    const displaySettings = new DisplaySettings(profileManager);
    const snackbarController = new SnackbarController();
    singleTerminal = new SingleTerminal(
      'perf-terminal',
      true,
      rxSettings,
      displaySettings,
      snackbarController,
      null
    );
    singleTerminal.setTerminalViewHeightPx(100);
  });

  function measure(label: string, payload: Uint8Array, iterations: number): number {
    // One warmup pass to let the JIT settle, then clear so the measured run
    // sees a fresh terminal (matches user-visible behaviour after a clear).
    singleTerminal.parseData(payload, DataDirection.RX);
    singleTerminal.clear();

    const start = performance.now();
    for (let i = 0; i < iterations; i += 1) {
      singleTerminal.parseData(payload, DataDirection.RX);
    }
    const elapsedMs = performance.now() - start;
    const bytes = payload.length * iterations;
    const mbPerSec = bytes / 1024 / 1024 / (elapsedMs / 1000);
    // eslint-disable-next-line no-console
    console.log(
      `[perf] ${label}: ${bytes} bytes in ${elapsedMs.toFixed(1)} ms ` +
      `-> ${mbPerSec.toFixed(3)} MB/s`
    );
    return mbPerSec;
  }

  test('plain-ASCII chunks (no escape codes)', () => {
    // A line of 80 printable ASCII chars + LF, repeated.
    const line = 'The quick brown fox jumps over the lazy dog 1234567890 ABCDEFGHIJKLMNOP\n';
    const text = line.repeat(2048); // ~150 KB per chunk
    const payload = new TextEncoder().encode(text);

    const mbPerSec = measure('plain-ASCII', payload, 4);
    // Loose floor — the printed number is the metric, this just guards
    // against catastrophic regressions (e.g. an O(n^2) loop creeping back in).
    // 0.07 not 0.1: a slow GitHub-hosted windows-latest runner clocked 0.0997
    // MB/s — within noise of a healthy ~0.15 MB/s baseline but enough to flake
    // a 0.1 floor.
    expect(mbPerSec).toBeGreaterThan(0.07);
  }, 30_000);

  test('large single chunk (stresses Array.shift O(n^2))', () => {
    // One 256 KB chunk, no newlines: forces the inner loop to chew all the
    // way through a single large input. Iteration count kept low because the
    // cursor wraps to a new row every 80 chars — 3200 wraps per chunk — and
    // row management itself is O(rows). Throughput is the metric, not total
    // work done.
    const text = 'x'.repeat(256 * 1024);
    const payload = new TextEncoder().encode(text);

    const mbPerSec = measure('large-single-chunk-256KB', payload, 1);
    // This scenario is the canary for an Array.shift O(n^2) regression.
    // Pre-fix throughput was ~0.010 MB/s; current floor ≈0.15 MB/s.
    expect(mbPerSec).toBeGreaterThan(0.08);
  }, 30_000);

  test('ANSI-heavy stream (color escape codes)', () => {
    // A typical colored-log line: SGR set, text, SGR reset, newline.
    const line = '\x1b[31m[ERROR]\x1b[0m something went wrong with the request handler\n';
    const text = line.repeat(2048);
    const payload = new TextEncoder().encode(text);

    const mbPerSec = measure('ansi-heavy', payload, 4);
    // 0.07, matching plain-ASCII, for the same reason: this scenario has been
    // observed as low as 0.083 MB/s on a loaded dev machine, so the old 0.1
    // floor was already failing intermittently. CI's slowest runner
    // (ubuntu-latest, not windows) clocked 0.133.
    expect(mbPerSec).toBeGreaterThan(0.07);
  }, 30_000);

  test('timestamps enabled (per-line moment formatting)', () => {
    // Many short lines so the per-line `moment(new Date()).format(...)` cost
    // dominates. With ~5-byte lines, every 5th byte triggers the timestamp
    // path, vs ~1 in 80 for the other scenarios.
    singleTerminal['rxSettings'].setAddTimestamps(true);
    const line = 'log\n'; // 4 bytes -> short logical lines
    const text = line.repeat(8192); // ~32 KB per chunk
    const payload = new TextEncoder().encode(text);

    const mbPerSec = measure('timestamps-many-short-lines', payload, 4);
    // Pre-cache throughput was ~0.020 MB/s; current floor ≈0.025 MB/s. The
    // floor is loose because variance on this scenario is real (±20%).
    expect(mbPerSec).toBeGreaterThan(0.015);
  }, 30_000);
});

/**
 * Render-path benchmarks.
 *
 * The parsing benchmarks above measure getting bytes *into* the row model.
 * These measure getting them back *out* again — the work the React view does
 * on every re-render, which while data is streaming happens many times a
 * second:
 *
 *   - `SingleTerminalView`'s row renderer calls `TerminalRow.getSpans()` for
 *     every visible row (~50 rows for a maximised window).
 *   - `getSpans` is cache-keyed on the row's `revision` counter. Before the
 *     storage change it hashed every char and class in the row instead, so the
 *     hash was rebuilt for every visible row on every render even on a cache
 *     hit.
 *   - `SingleTerminal.highlightMatches` / `findMatches` read `row.text` for
 *     every row in the *whole* scrollback, not just the visible window.
 *
 * `text` and the old `terminalCharsHash` are both O(row length) walks, so
 * these scenarios are the ones that move when the row storage model changes.
 * Reported as rows/sec rather than MB/s — the unit of render work is a row,
 * not a byte.
 */
describe('SingleTerminal render-path throughput', () => {
  const VISIBLE_ROWS = 50;
  /** Minimal stand-in for the CSS-module object `getSpans` expects. */
  const STYLES = { cursorFocused: 'cursorFocused' };

  function makeTerminal(withRules: boolean): SingleTerminal {
    window.localStorage.clear();
    const app = new App();
    const profileManager = new AppDataManager(app);
    const rxSettings = new RxSettings(profileManager);
    const displaySettings = new DisplaySettings(profileManager);
    const snackbarController = new SnackbarController();

    let rulesSettings: RulesSettings | null = null;
    if (withRules) {
      rulesSettings = new RulesSettings(profileManager);
      rulesSettings.addRule();
      const rule = rulesSettings.rules[0];
      rule.setPattern('ERROR|WARN');
      rule.setScope(HighlightScope.MATCH);
      rule.setEnabled(true);
    }

    const terminal = new SingleTerminal(
      'perf-render-terminal',
      true,
      rxSettings,
      displaySettings,
      snackbarController,
      null,
      rulesSettings,
    );
    terminal.setTerminalViewHeightPx(VISIBLE_ROWS * 20);
    return terminal;
  }

  /** Fills the terminal with `numRows` rows of realistic log-ish text. */
  function fillScrollback(terminal: SingleTerminal, numRows: number) {
    const line = '[INFO ] sensor sample temp=21.5 hum=40 volt=3.302 seq=012345\n';
    const payload = new TextEncoder().encode(line.repeat(numRows));
    terminal.parseData(payload, DataDirection.RX);
  }

  function report(label: string, rows: number, elapsedMs: number): number {
    const rowsPerSec = rows / (elapsedMs / 1000);
    // eslint-disable-next-line no-console
    console.log(
      `[perf] ${label}: ${rows} rows in ${elapsedMs.toFixed(1)} ms ` +
      `-> ${Math.round(rowsPerSec)} rows/s`
    );
    return rowsPerSec;
  }

  test('getSpans over the visible window (simulates one repaint)', () => {
    const terminal = makeTerminal(false);
    fillScrollback(terminal, 2000);

    // Warm up so the JIT and the per-row span caches have both settled — this
    // measures the steady-state repaint cost, which is the cache-*hit* path.
    const warmupRows = terminal.filteredTerminalRows.slice(-VISIBLE_ROWS);
    for (const row of warmupRows) {
      row.getSpans(terminal.id, terminal.cursorPosition, null, STYLES);
    }

    const iterations = 200;
    const start = performance.now();
    for (let i = 0; i < iterations; i += 1) {
      const rows = terminal.filteredTerminalRows;
      const visible = rows.slice(-VISIBLE_ROWS);
      const cursorRow = rows[terminal.cursorPosition[0]] ?? null;
      for (const row of visible) {
        row.getSpans(terminal.id, terminal.cursorPosition, cursorRow, STYLES);
      }
    }
    const elapsedMs = performance.now() - start;

    const rowsPerSec = report(
      'render-getSpans-cache-hit',
      VISIBLE_ROWS * iterations,
      elapsedMs
    );
    // Floors on these render scenarios are set ~3x below the lowest value
    // observed across ~13 runs on a dev machine (including under load) and all
    // three CI runners, which is tight enough to catch a real regression while
    // absorbing the +/-20% run-to-run variance this file documents.
    // Lowest observed here: 331k rows/s (loaded dev machine); CI 408k-957k.
    expect(rowsPerSec).toBeGreaterThan(100_000);
  }, 60_000);

  test('getSpans after new data invalidates the row cache', () => {
    const terminal = makeTerminal(false);
    fillScrollback(terminal, 2000);

    // Each iteration appends a line (as a real RX chunk would) and then
    // repaints the visible window, so the tail rows miss their span cache.
    // This is the true steady-state cost while data is streaming in.
    const chunk = new TextEncoder().encode('[INFO ] another line of streamed output\n');
    const iterations = 200;

    terminal.parseData(chunk, DataDirection.RX); // warmup

    const start = performance.now();
    for (let i = 0; i < iterations; i += 1) {
      terminal.parseData(chunk, DataDirection.RX);
      const rows = terminal.filteredTerminalRows;
      const visible = rows.slice(-VISIBLE_ROWS);
      const cursorRow = rows[terminal.cursorPosition[0]] ?? null;
      for (const row of visible) {
        row.getSpans(terminal.id, terminal.cursorPosition, cursorRow, STYLES);
      }
    }
    const elapsedMs = performance.now() - start;

    const rowsPerSec = report(
      'render-getSpans-streaming',
      VISIBLE_ROWS * iterations,
      elapsedMs
    );
    // Lowest observed: 77k rows/s (loaded dev machine); CI 130k-213k.
    expect(rowsPerSec).toBeGreaterThan(25_000);
  }, 60_000);

  test('highlight rule scan over the whole scrollback', () => {
    const terminal = makeTerminal(true);
    fillScrollback(terminal, 2000);

    // `highlightMatches` is a MobX computed, but it is invalidated every time
    // a row is added — i.e. on every RX chunk. Appending a chunk per iteration
    // reproduces that, so this measures the real recompute cost rather than a
    // cached read.
    const chunk = new TextEncoder().encode('[ERROR] request handler blew up\n');
    const iterations = 100;

    terminal.parseData(chunk, DataDirection.RX);
    void terminal.highlightMatchesByRow; // warmup

    const start = performance.now();
    let matchRowCount = 0;
    for (let i = 0; i < iterations; i += 1) {
      terminal.parseData(chunk, DataDirection.RX);
      matchRowCount += terminal.highlightMatchesByRow.size;
    }
    const elapsedMs = performance.now() - start;

    // Sanity check that the scan actually finds the rule's matches — a
    // benchmark that silently measures a no-op is worse than no benchmark.
    expect(matchRowCount).toBeGreaterThan(0);

    const rowsPerSec = report(
      'render-highlight-scan',
      terminal.terminalRows.length * iterations,
      elapsedMs
    );
    // Lowest observed: 495k rows/s (loaded dev machine); CI 1.9M-2.3M.
    expect(rowsPerSec).toBeGreaterThan(150_000);
  }, 60_000);

  test('row.text materialisation over the whole scrollback', () => {
    const terminal = makeTerminal(false);
    fillScrollback(terminal, 2000);

    // Isolates the `row.text` cost that the highlight/find scans pay. Reading
    // `.text` off every row is the single most repeated per-row operation in
    // the render path.
    const iterations = 100;
    let totalChars = 0;
    for (const row of terminal.terminalRows) totalChars += row.text.length; // warmup

    const start = performance.now();
    for (let i = 0; i < iterations; i += 1) {
      for (const row of terminal.terminalRows) {
        totalChars += row.text.length;
      }
    }
    const elapsedMs = performance.now() - start;

    expect(totalChars).toBeGreaterThan(0);

    const rowsPerSec = report(
      'render-row-text',
      terminal.terminalRows.length * iterations,
      elapsedMs
    );
    // Lowest observed: 897k rows/s (loaded dev machine); CI 5.0M-7.8M.
    expect(rowsPerSec).toBeGreaterThan(250_000);
  }, 60_000);
});
