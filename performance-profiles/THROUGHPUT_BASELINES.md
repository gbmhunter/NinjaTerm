# Parser throughput baselines

History of measured throughput for the SingleTerminal byte-parsing hot path.
Numbers come from `src/renderer/src/model/Terminals/SingleTerminal/SingleTerminal.perf.spec.ts`,
which prints `MB/s` for each scenario at the end of every `npm run test:unit` run.

## How to reproduce

```bash
npm run test:unit -- SingleTerminal.perf
```

Look for `[perf]` log lines in the output. Each scenario warms the JIT (3 runs)
and then averages over the iteration count printed in the line.

## What each scenario stresses

| Scenario | What it stresses |
|---|---|
| `plain-ASCII` | Common case. 80-char lines + LF, ANSI parsing on, no escape codes in payload. |
| `large-single-chunk-256KB` | One large chunk with no newlines. Worst case for `Array.shift()` based loops, which are O(n²) in chunk size. |
| `ansi-heavy` | Color-log style payload (SGR set + text + SGR reset per line). Stresses the per-byte `partialEscapeCode +=` string concat. |

## Recording rules

When adding a row:
- Run the perf test 3× and record the median (numbers vary ±20% run-to-run).
- Note the commit, branch, and what changed.
- Note the host — these tests are CPU-bound and not portable across machines.

---

## Baseline — 2026-04-27 (pre-optimisation)

- Commit: `f3fba09` (v5.11.1, `main`)
- Host: AMD Ryzen 9 4900HS, 16 logical cores, Windows 11 Pro
- Node: v24.10.0, vitest 3.2.4

| Scenario | Throughput |
|---|---|
| plain-ASCII (150 KB chunk × 4 iter) | **0.055 MB/s** |
| large-single-chunk-256KB (× 2 iter) | **0.010 MB/s** |
| ansi-heavy (150 KB chunk × 4 iter) | **0.061 MB/s** |

Context: 115200-baud serial is ~11.5 KB/s; 921600-baud is ~92 KB/s. The
single-chunk number (10 KB/s) means the parser cannot keep up with one
sustained 115200-baud stream that delivers in chunks of 256 KB or larger
without back-pressure.

Suspected dominant costs:
- `_parseAsciiData()` consumes via `remainingData.shift()` — O(n²) on chunk
  size (`SingleTerminal.ts:401`).
- `partialEscapeCode += String.fromCharCode(b)` allocates a new string per
  byte while inside an ANSI escape (`SingleTerminal.ts:519`).
- `moment(new Date())` per visible byte when timestamps are enabled
  (`SingleTerminal.ts:1327`). Not exercised by these tests yet (timestamps off
  by default) — add a scenario when measuring the moment fix.

## 2026-04-27 — replace `Array.shift()` loop with index walk

- Branch: `feature/parser-perf` (off `main` @ `f3fba09`)
- Host: same as baseline (Ryzen 9 4900HS, Win 11, Node v24.10.0, vitest 3.2.4)
- Change: `_parseAsciiData()` now walks the input `Uint8Array` with an index
  instead of building a `number[]` and calling `Array.shift()` per byte. The
  rare max-escape-length rewind uses a small `prependedBytes` buffer instead
  of `unshift`-ing back onto the main queue.
- Notes: medians of 3 runs (variance ±15%).

| Scenario | Throughput | Δ vs baseline |
|---|---|---|
| plain-ASCII | 0.13 MB/s | ~2.4× |
| large-single-chunk-256KB | 0.14 MB/s | **~14×** |
| ansi-heavy | 0.14 MB/s | ~2.3× |

The `large-single-chunk` jump (~14×) confirms the diagnosis — that scenario
is the canary for `Array.shift()` and went from 10 KB/s to 140 KB/s with no
other changes.

The remaining bottleneck is per-byte work in `_maybeAddVisibleByteAndTimestamp`
and the MobX-observable `terminalRows[i].terminalChars` push. Plain-ASCII and
ANSI scenarios sit around the same ~0.14 MB/s ceiling because the body byte
path is identical between them.

## 2026-04-27 — buffer escape codes as char codes; cache formatted timestamp

- Branch: `feature/parser-perf-round-2` (off `main` @ `145a8cf`)
- Host: same as baseline (Ryzen 9 4900HS, Win 11, Node v24.10.0, vitest 3.2.4)
- Changes:
  - `partialEscapeCode` is now a `number[]` of char codes; the per-byte
    `+= String.fromCharCode(...)` string concat is gone. The string form is
    materialised only when handing a complete sequence to `_parseCSISequence`.
  - `_maybeAddVisibleByteAndTimestamp` caches the formatted timestamp at
    millisecond granularity, so a multi-line chunk reformats `moment()` at
    most once per ms instead of once per line.
  - Adds a new `timestamps-many-short-lines` scenario so the timestamp path
    has a regression target.
- Notes: medians of 3 runs (variance ±15%). "Before" column is on the same
  branch / commit, just before the two fixes were applied — so improvements
  reflect just these two changes, not host or JIT noise.

| Scenario | Before | After | Δ |
|---|---|---|---|
| plain-ASCII | 0.125 MB/s | 0.155 MB/s | ~1.24× |
| large-single-chunk-256KB | 0.134 MB/s | 0.170 MB/s | ~1.27× |
| ansi-heavy | 0.134 MB/s | 0.160 MB/s | ~1.19× |
| timestamps-many-short-lines | 0.020 MB/s | 0.025 MB/s | ~1.25× |

The cache hits roughly 99% of the time within a chunk — every line in a
single `parseData` call almost always falls in the same ms — so the
remaining timestamp cost is just the per-char `addVisibleChar` overhead of
emitting the ~24-char timestamp string into the row. The ANSI improvement
is modest because escape-code char-buffer accumulation is bounded by
`maxEscapeCodeLengthChars` (default 10), so the ceiling on this fix is
around one allocation saved per escape rather than per byte.

## 2026-09-03 — flat row storage; row contents off MobX

- Commit: `d88dd93` (`main`), change on top of it
- Host: same as baseline (Ryzen 9 4900HS, Win 11, Node v24.10.0, vitest 3.2.4)
- Changes:
  - `TerminalRow` stores a flat `chars: string[]` plus a run-length
    `styleRuns: {start, className}[]`, instead of one `TerminalChar` object per
    column. Removes ~5 allocations per received byte (the object, its dead
    `style: {}`, a class-list array, up to four template strings and a joined
    class string). `TerminalChar` survives only as a cached compatibility view
    (`row.terminalChars`) for tests, clipboard extraction and selection
    clamping.
  - `SingleTerminal._classNameForCurrentStyle` memoises the class string on the
    direction + SGR state it derives from, so it is rebuilt once per escape
    sequence rather than once per byte.
  - `terminalCharsHash` is gone. It rebuilt a `char:className|...` string over
    the whole row on every `getSpans` call — including cache *hits* — purely to
    answer "did this row change?". Replaced by a `revision` counter.
  - `TerminalRow` holds no MobX state at all. Change notification moved up to
    `SingleTerminal.renderVersion`, bumped once per received chunk instead of
    once per byte.
  - `SingleTerminalView`'s `Row` renderer hoisted to module scope. It was
    declared inside the parent component body, so every parent render created a
    new component *type* and React unmounted/remounted every visible row's DOM
    on every chunk.
- Adds four `render-*` scenarios covering the work the view does per repaint,
  which was previously unmeasured — and is where most of this change lands.
- Notes: medians of 3 runs. **Both columns measured back-to-back in the same
  session on the same machine**, by reverting just the four source files and
  re-running, because run-to-run variance between sessions (±20%) is larger
  than the parse-path effect being measured.

| Scenario | Before | After | Δ |
|---|---|---|---|
| plain-ASCII | 0.110 MB/s | 0.171 MB/s | ~1.55× |
| large-single-chunk-256KB | 0.123 MB/s | 0.192 MB/s | ~1.56× |
| ansi-heavy | 0.109 MB/s | 0.169 MB/s | ~1.55× |
| timestamps-many-short-lines | 0.018 MB/s | 0.034 MB/s | ~1.89× |
| render-getSpans-cache-hit | 91k rows/s | 684k rows/s | **~7.5×** |
| render-getSpans-streaming | 54k rows/s | 132k rows/s | ~2.5× |
| render-highlight-scan | 155k rows/s | 1446k rows/s | **~9.3×** |
| render-row-text | 241k rows/s | 3009k rows/s | **~12.5×** |

### What actually mattered, and what didn't

Worth recording because the intuition was wrong. The flat storage alone —
removing those ~5 allocations per byte — bought **nothing** on parse throughput
(0.110 → 0.110 MB/s). Two experiments isolated why:

1. Making the row mutators plain methods instead of MobX actions: no change
   (0.104 MB/s). The action wrapper is not the cost.
2. Making the row's `revision` counter non-observable: 0.110 → 0.179 MB/s.

So the parse-path bottleneck was never the allocations; it was the **one MobX
change notification per received byte**. The original model paid it on an
`observable.shallow` char array, and a naive port pays exactly the same price
on a `revision` counter. Only moving the signal up to a per-chunk counter on
`SingleTerminal` removes it — which is what the final numbers above reflect.

The flat storage is still what delivers the render-path gains (7-12×), since
`row.text` and the old per-render hash were both O(row length) walks over the
object array. The two changes are complementary: neither alone would have moved
both columns.

### CI reference numbers (for setting assertion floors)

From the `Build and Test` run on PR #412, all three runners. Useful because the
assertion floors in the perf spec have to pass on the slowest of these, and the
intuition about which runner that is turns out to be wrong.

| Scenario | ubuntu-latest | windows-2022 | macos-15 |
|---|---|---|---|
| plain-ASCII | **0.128** | 0.133 | 0.256 MB/s |
| large-single-chunk-256KB | **0.122** | 0.139 | 0.291 MB/s |
| ansi-heavy | **0.133** | 0.144 | 0.275 MB/s |
| timestamps-many-short-lines | **0.027** | 0.034 | 0.059 MB/s |
| render-getSpans-cache-hit | 945k | **408k** | 957k rows/s |
| render-getSpans-streaming | 200k | **130k** | 213k rows/s |
| render-highlight-scan | 2119k | **1855k** | 2317k rows/s |
| render-row-text | 7304k | **5016k** | 7833k rows/s |

Notes:
- **ubuntu-latest is the slowest runner for the parse scenarios**, not windows —
  the older floor comments assume windows.
- macOS is roughly 2x faster than either on parse, which is why this file's
  per-host caveat matters.
- Perf spec wall time: 23.3s (ubuntu), 22.8s (windows), 11.4s (macOS) — about
  23s of a ~33s unit-test run. The four parse scenarios are 87% of that; the
  four render scenarios add ~3s.
- Floors are set ~3x below the lowest value seen across these runners *and* a
  loaded dev machine, which reads lower than CI on the render scenarios.

Remaining hot spots for a future pass, in rough order:
- `String.fromCharCode` + `chars.push` per byte in `TerminalRow.appendChar`.
  A preallocated `Uint16Array` of code points with a lazily-joined `text` would
  cut the last per-byte allocation.
- Row creation cost on every wrap / newline (`new TerminalRow` +
  `_addOrRemoveRowFromFilteredRows`).
- The timestamp path is still 5× slower than plain ASCII: each timestamp is
  emitted through `addVisibleChar` one character at a time.

<!--
## YYYY-MM-DD — <change description>

- Commit: `<sha>` (`<branch>`)
- Host: <if different from baseline>
- Notes: <what changed>

| Scenario | Throughput | Δ vs prev |
|---|---|---|
| plain-ASCII | x.xx MB/s | +N× |
| large-single-chunk-256KB | x.xx MB/s | +N× |
| ansi-heavy | x.xx MB/s | +N× |
-->
