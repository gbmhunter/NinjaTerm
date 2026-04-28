import { expect, test, describe, beforeEach } from 'vitest';

import { DataDirection, SingleTerminal } from './SingleTerminal';
import RxSettings from 'src/model/Settings/RxSettings/RxSettings';
import DisplaySettings from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { App } from 'src/model/App';
import SnackbarController from 'src/model/SnackbarController/SnackbarController';

/**
 * Throughput benchmarks for the SingleTerminal byte-parsing hot path.
 *
 * These tests are intentionally generous on the assertion bound — the *number*
 * printed to stdout (MB/s) is what matters. Run before and after a perf change
 * and compare. The remaining hot spots, in rough order of cost:
 *   - per-char `addVisibleChar` MobX-observable push to terminalRows[i]
 *   - row creation + `_addOrRemoveRowFromFilteredRows` on every wrap
 *   - moment().format() on the first non-cache-hit visible byte of a new ms
 *
 * Past regressions to guard against:
 *   - _parseAsciiData() Array.shift() loop (O(n^2) on chunk size) — fixed
 *   - partialEscapeCode += String.fromCharCode(b) per byte — fixed
 *   - moment() per line regardless of millisecond — fixed (cached at ms)
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
    expect(mbPerSec).toBeGreaterThan(0.1);
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
