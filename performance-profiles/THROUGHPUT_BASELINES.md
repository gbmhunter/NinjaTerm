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
