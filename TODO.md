# TODO

Findings from a whole-codebase review (2026-09-03), recorded so they don't get
lost. Ordered roughly by leverage, not by effort. Nothing here is a regression —
at the time of writing `npx tsc` is clean, `npm run test:unit` is 373/373, and
`npm run lint` is 0 errors / 121 warnings.

Items are grouped: **[perf]**, **[arch]**, **[bug]**, **[security]**,
**[chore]**, **[feature]**.

---

## Suggested order

1. ~~Hoist `Row` out of the component body~~ — **done 2026-09-03**
2. ~~Fix the Logging bugs~~ — **done 2026-09-03**
3. ~~Cache the per-char className + delete `TerminalChar.style`~~ — **done 2026-09-03**
4. ~~DevTools install + window-open guard~~ — **done 2026-09-04**. CSP and the
   `openExternal` allowlist deliberately not done; see §5.
5. `dependencies`/`devDependencies` split, check installer size
6. ~~`Transport` interface~~ — **done 2026-09-04**. Unblocks tabs and file transfer.
7. ~~Row data model rewrite~~ — **done 2026-09-03**
8. ~~Declarative settings schema~~ — **done 2026-09-04**, as a single-source-of-truth façade rather than a schema; see §3.

Items 1, 3 and 7 landed together — they are all in the terminal hot path and
share `SingleTerminal.perf.spec.ts` as their verification. Item 2 followed.
Next up is item 4 (Electron hardening).

---

## 1. Terminal data model — the throughput ceiling  [perf] — DONE 2026-09-03

**Status: done.** Parse throughput ~1.55x, render path 2.5-12.5x. See
`performance-profiles/THROUGHPUT_BASELINES.md` for the numbers, the A/B method
and — more useful — the record of which parts of the theory below turned out to
be wrong. Short version: the allocations were *not* the parse-path bottleneck;
one MobX change notification per received byte was. The flat storage is what
delivered the render-path gains. Original analysis kept below for context.

Follow-on work identified while doing it:

- [ ] `TerminalRow.appendChar` still does `String.fromCharCode` + `chars.push`
      per byte. A preallocated `Uint16Array` of code points with a lazily-joined
      `text` would remove the last per-byte allocation.
- [ ] Row creation on every wrap / newline (`new TerminalRow` +
      `_addOrRemoveRowFromFilteredRows`) is now a visible share of parse cost.
- [ ] The timestamp scenario is still ~5x slower than plain ASCII — each
      timestamp is pushed through `addVisibleChar` one character at a time.
- [ ] `_addToFilteredRows` / `_addOrRemoveRowFromFilteredRows` look vestigial now
      that `filteredTerminalRows` is computed; several call sites are already
      commented out. Worth confirming they can go.

<details>
<summary>Original analysis (kept for context)</summary>

## 1. Terminal data model — the throughput ceiling  [perf]

`performance-profiles/THROUGHPUT_BASELINES.md` and a run on 2026-09-03 both put
the parser at **~0.09-0.17 MB/s** (0.018 MB/s with timestamps on). That means
921600 baud (~92 kB/s) sits at the ceiling and 1 Mbaud is over it. Every
optimisation so far has shaved the outside of a hot path whose *shape* is the
cost.

Per visible byte, `SingleTerminal.addVisibleChar` (`SingleTerminal.ts:2200-2285`)
does ~5 allocations plus one MobX notification:

- `new TerminalChar()`, including a `style = {}` object
- a `classList` array
- `f${n}` / `b${n}` template strings, not interned
- `classList.join(' ')` (`SingleTerminal.ts:2262`) — a fresh string per char
- a write into an `observable.shallow` array — one change notification per char
- often a *second* `TerminalChar` for the trailing cursor space

### Cheap wins (do first — probably 2-3x)

- [ ] Delete `TerminalChar.style` (`SingleTerminalChar.tsx:23`). It is never read
      anywhere in the codebase. One object allocation per byte, for nothing.
- [ ] Cache the className on the terminal as `_currentClassName`, recomputed only
      in the SGR handler rather than per char, and assign the same string
      *reference* to every char. The class list only changes when direction /
      colour / bold changes — once per escape sequence, not once per byte. Kills
      the array, the templates and the join.

### The real fix

- [ ] Change `TerminalRow` from `TerminalChar[]` to a flat model:

      ```ts
      class TerminalRow {
        text: string;   // or a preallocated Uint16Array of code points
        styleRuns: { start: number; className: string }[];  // one entry per style change
      }
      ```

      Appending a char becomes a string append and usually nothing else. Three
      currently-expensive things become free:

      - `TerminalRow.text` (`TerminalRow.tsx:52`) stops being an O(n)
        `map().join()` **per row per render**
      - `terminalCharsHash` (`TerminalRow.tsx:59`) — currently builds a
        `char:className|...` string for every row on every render purely to key a
        cache; replace with a monotonic `revision` counter
      - `getSpans` iterates runs instead of chars

      Contained blast radius: `TerminalRow`, `SingleTerminalChar`,
      `addVisibleChar`, `getSpans`, and the CSI cursor code that indexes
      `terminalChars`. Covered by `SingleTerminal.spec.ts` (89 tests) plus the
      perf spec. Plausibly gets to multi-MB/s.

- [ ] Record the before/after in `performance-profiles/THROUGHPUT_BASELINES.md`
      following the existing template.

### Render bug undoing most of the memoization work

- [ ] `SingleTerminalView.tsx:36` — `const Row = React.memo(observer(...))` is
      declared **inside** the component body. A new component *type* every parent
      render means React unmounts and remounts every visible row's DOM on every
      RX chunk, and `React.memo` does nothing. Hoist to module scope (pass what it
      needs via `itemData`, which react-window already threads) or at minimum
      wrap in `useMemo`.

      Line 337 of the same file carries the identical warning for
      `outerElementType`: *"WARNING: Must use memoized component here, if not, it
      gets recreated on each render of the terminal and the scroll gets messed
      up."*

</details>

---

## 2. `ConnController.openConnection` is a 370-line if/else over transports  [arch] — DONE 2026-09-04

**Status: done** in #418 (`Transport` interface; `ConnController` 1082 → 653 lines). Original analysis kept below.

`ConnController.ts:165-535`. Five branches (serial / fake / socket / RTT / BLE),
each repeating near-identical structure: show modal, IPC connect, register
onData/onError/onClosed disposers, `runInAction` set state, snackbar, analytics,
hide modal. `closeConnection`, `handlePortClosed` and the reconnection poller each
repeat the same fan-out.

- [ ] Extract the abstraction that is already implicit in the code:

      ```ts
      interface Transport {
        readonly kind: PortType;
        open(config): Promise<Result>;
        close(): Promise<void>;
        write(bytes: Uint8Array): Promise<void>;
        onData(cb): Disposer;
        onError(cb): Disposer;
        onClosed(cb): Disposer;
        readonly reconnectIntervalMs: number;
      }
      ```

      `ConnController` becomes a generic state machine (~150 lines) over
      `Transport`; `SerialTransport` / `SocketTransport` / `RttTransport` /
      `BleTransport` / `FakeTransport` become small and independently testable.

      `BluetoothLEController` is already a separate class doing its own connect —
      that's the shape, it just isn't a shared interface yet.

- [x] Add unit tests for the connection lifecycle. (done 2026-09-04)
      `ConnController.characterisation.spec.ts` pins open/close/write/dispose
      for serial, socket and RTT as a safety net for the refactor. It found a
      live bug on the way in: `setSelectedPort` wrote a field nothing read.

Prerequisite for multiple simultaneous connections (see features).

---

## 3. Six settings classes hand-rolling identical load/save plumbing  [arch] — DONE 2026-09-04

**Status: done, but not as sketched below.** The descriptor-list idea would have
generated the load/save code while keeping both copies of every setting. The
actual root cause was the *copies*: they existed because the persisted config
tree was only observable on the second launch (MobX deep conversion skips class
instances, and `new AppData()` is one). With that fixed in `AppDataManager`,
each settings class is a thin typed façade over the persisted object
(`SettingsBranch`) — `get x() { return this.branch.data.x }` plus
`setX = this.branch.setter('x')` — and there is nothing to load, save, or guard.
Net −485 lines; `SettingsReactivity.spec.ts` and `SettingsBranch.spec.ts` pin
the observability and the undo/subtree-replacement case.

Found on the way:

- [ ] **`socketConnTimeoutMs` is a dead setting.** It has a UI field, validation
      and persistence, and nothing reads it — the socket connect never passes a
      timeout. Either wire it into `socket:connect` or remove it (needs a
      migration + UI change, so not done here).
- [ ] **`RxSettingsView` reaches `displaySettings` via
      `rxSettings.profileManager.app.settings.displaySettings`** (5 sites) to get
      tooltip config. It has `app` in scope; use it. `profileManager` was kept
      public on the settings classes only so this didn't break.
- [x] Seven direct writes to `rxSettings.ansiEscapeCodeParsingEnabled` in
      `FakePortsController` bypassed the setter and never persisted. Caught by
      the getter-based façade at compile time; fixed.
- [x] `Graphing`, `Logging`, `RightDrawer` and `Terminals` were flat settings
      too and are converted the same way. Graphing's numeric fields were the
      only ones persisted as strings; app data v25 makes them numbers.
- [ ] **`RulesSettings`, `MacroController` and `FilterController`** still
      hand-roll load/save. They hold *collections* (arrays of rules, macros,
      filters), so `SettingsBranch` doesn't apply as-is; a collection-shaped
      equivalent is the natural follow-up.

<details>
<summary>Original analysis (kept for context)</summary>

## 3. Six settings classes hand-rolling identical load/save plumbing  [arch]

`RxSettings`, `TxSettings`, `DisplaySettings`, `PortSettings`, `GeneralSettings`,
`RulesSettings` each implement `_loadConfig` / `_loadConfigInner` / `_saveConfig`,
an `_isLoading` guard, and a `registerOnConfigReload` call by hand. Each
enumerates every field **twice** — see `RxSettings.ts:274-400`, ~45 fields listed
for load and again for save.

The CHANGELOG shows this is a bug factory:

- 5.17.0 — *"RX settings no longer reset themselves when a preset is applied"*
  (missing `_isLoading`)
- 5.17.0 — *"Macros are restored when a preset is applied"* (`MacroController`
  never called `registerOnConfigReload`)
- 5.17.0 — *"The last-used serial port moved into the connection settings"*
  (schema drift)

- [ ] Replace with a declarative field descriptor:

      ```ts
      const RX_FIELDS = defineSettings('settings.rxSettings', {
        dataType:                 plain<DataType>(),
        maxEscapeCodeLengthChars: applyable(z.number().int().min(1)),
        localTxEcho:              plain<boolean>(),
        // ...
      });
      ```

      One generic `load()`/`save()` walks the descriptor, handles the
      `setDispValue()/apply()` two-step for applyable fields, registers the
      reload hook, and owns the `_isLoading` guard. Adding a setting becomes one
      line instead of four edits across three files.

- [ ] Once that lands, derive `appDataMigrations.ts` (829 lines) and the
      "NinjaTerm defaults" preset from the same source of truth. The defaults
      preset is already built from the data classes, so this is half done.

</details>

---

## 4. Concrete bugs  [bug]

- [x] **Log data loss + wrong byte count.** (done 2026-09-03) `Logging.ts:256-280`.
      `writeBufferedDataToDisk` snapshots the buffer, `await`s the IPC write, then
      does `this.numBytesWritten += this.bufferedData.length` and
      `this.bufferedData = []`. Anything appended during the await is counted but
      never written. Splice the buffer *before* the await:

      ```ts
      const toWrite = this.bufferedData;
      this.bufferedData = [];
      const result = await window.electronAPI.fs.writeFile(path, toWrite, true);
      // on failure, prepend toWrite back
      ```

- [x] **Logging can blow the stack on a fast burst.** (done 2026-09-03) `Logging.ts:245,253`.
      `this.bufferedData.push(...rxData)` spreads a `Uint8Array` into function
      arguments; V8 throws `RangeError: Maximum call stack size exceeded` around
      65k-125k elements. A single large RTT or socket chunk gets there. Also
      `bufferedData` is a MobX observable `number[]` — at 50 kB/s that is 50,000
      observable pushes/sec, plus a `toJS()` full copy every second, plus
      IPC-serialising a JS number array. Store `Uint8Array` chunks in a **plain**
      (non-observable) array and concat once at write time.

- [x] **MCP `rxBuffer` grows without bound.** (done 2026-09-05, `RxStreamBuffer`) `mcpService.ts:170`.
      `session.rxBuffer.text += text` on every RX chunk, cleared only when a
      client *reads* the resource. A client that subscribes and never reads (or
      disconnects without closing the session) leaks the entire stream into
      main-process memory. Cap with a ring buffer, drop-oldest.

- [x] **React DevTools installs in production.** (done 2026-09-04) Guarded with
      `if (!app.isPackaged)`.

- [x] **`stopCpuMonitoring()` is a no-op.** (done 2026-09-05) `App.tsx:437-440`. The
      `requestAnimationFrame` loop it claims to stop keeps running. Capture the
      rAF handle and cancel it.

- [x] **Find is substring-only** (done 2026-09-05) while Filters and Highlight Rules both support
      regex. `SingleTerminal.ts:180-199` uses `indexOf`; compare
      `TerminalFilter.ts:45-76`. Inconsistent, and regex-in-find is what you
      actually want in a 100k-line scrollback.

---

## 5. Electron hardening  [security]

Foundation is solid — `contextIsolation: true`, `nodeIntegration: false`, a real
preload bridge with per-listener disposers. Gaps:

- [ ] **No CSP.** The block is commented out at `index.ts:186-196`. Deliberately
      deferred: the renderer loads only local files and there is no reachable
      injection sink (the one `dangerouslySetInnerHTML` is inside `kofi-button`
      and was fed hardcoded constants — and it went away with `kofi-button` on
      2026-09-04), so a CSP guards against a future mistake rather than a
      present hole. The runtime fetches that were the best argument for one
      (Google Fonts, Ko-fi CDN) are gone, so a strict policy should now be a
      much closer fit if it is ever wanted.
- [x] **No `setWindowOpenHandler`.** (done 2026-09-04) The two `target="_blank"`
      links opened an Electron window inheriting the preload. The handler now
      denies in-app windows and routes http(s) to the OS browser.
- [ ] **No `will-navigate` guard.** Lower value than the above: there is no
      in-place navigation vector today (every link either goes through
      `shell.openExternal` or carries `target="_blank"`). Worth adding if a
      plain `<a href>` ever appears.
- [ ] **`shell:open-external` takes any URL** (`index.ts`) with no scheme
      allowlist. Deliberately deferred: all four call sites pass hardcoded HTTPS
      URLs, so this only matters once something else is already compromised. The
      `setWindowOpenHandler` added 2026-09-04 does scheme-check its own URLs.
- [ ] **`fs:write-file` writes anywhere** (`index.ts:302`) with no path
      validation. Constrain to the log directory the renderer already picked via
      `fs:select-directory`.
- [ ] **`executeJavaScript` to read localStorage** (`index.ts:236` and
      `index.ts:378`). Main reaching into the renderer to read a setting is
      backwards, and it is racy at the 5s startup check.

### Settings should not live in localStorage  [arch]

`AppDataManager` stores the entire app config in Chromium localStorage: subject
to quota, invisible to the user, not backup-able, not shareable, wiped if the
partition changes, and only readable by main through `executeJavaScript`.

- [ ] Move to a JSON file in `app.getPath('userData')` behind an IPC API. That
      makes `appData` diffable, gives preset import/export for free, and turns the
      migration snapshots in `local-storage-data/` into real fixtures rather than
      clipboard-copied artifacts (the README's release checklist step 3 is
      currently a manual DevTools ritual).

---

## 6. Smaller things  [chore]

- [ ] **`dependencies` vs `devDependencies` is badly mixed.** `typescript`,
      `vite`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `@testing-library/*`,
      all the `@types/*`, `serve` and `@types/jest` are in `dependencies`.
      Combined with `"files": ["node_modules/**/*"]` in the electron-builder
      config, there is real risk of shipping the toolchain in the installer. Move
      them and compare packaged size before/after.
- [x] **IPC sends bytes as `number[]`.** (done 2026-09-03) All write channels
      now take `Uint8Array`: `fs:write-file` alongside the logging fix, then
      `serial:write-data`, `socket:write-data` and `rtt:write-data` together
      (they shared the one `Array.from` site in `ConnController.writeData`).
      Bluetooth already did. RX was always a Buffer.
- [ ] **1646 lines of test fixtures ship in the renderer bundle.**
      `FakePortsController.tsx` builds ~25 fake ports eagerly in a field
      initializer on `App`. Make it a dynamic `import()` when the dialog opens —
      removes it from the main chunk and from startup cost.
- [ ] **No unit tests for any main-process code.** `serialService`,
      `socketService`, `rttService`, `mcpService`, `MainBluetoothService` — zero
      coverage, and they hold the port lifecycle and batching logic. `Logging` is
      also uncovered, and has two of the bugs above.
- [x] **`App.spec.ts` rate-tracking tests are flaky under load.** (done
      2026-09-04) Not a timer problem — the tests were doing real work. Fixed at
      the source: recording a data point spliced one entry off the front of a
      2048-element array on every push once at the cap (O(n) per push), and the
      arrays were MobX-observable despite nothing observing them reactively.
      1681ms/1584ms -> 107ms/60ms.
- [ ] **README says `tests/`, the directory is `e2e-tests/`.**
- [ ] **`web/`** (180 tracked files, maintenance-mode) would be cleaner as an
      archived branch or a separate repo.

---

## 7. Feature ideas  [feature]

Ranked by what an embedded developer would most likely notice.

- [ ] **File transfer.** XMODEM/YMODEM/ZMODEM, plus plain "send file with
      configurable inter-byte / inter-line delay". The single most common reason
      people still open TeraTerm or Minicom. Fits naturally as a `Transport`-level
      concern once §2 lands.
- [x] **Multiple simultaneous connections / session tabs.** (done 2026-09-05)
      `App` is split into `App` + `Session`; sessions are tabs, each with its own
      connection and config (`appData.sessions`), and the MCP tools take a
      `session`. Follow-ups: split view (two sessions side by side), cross-session
      triggers (an RTT line sends a serial command), and pruning MCP stream
      buffers for closed sessions.
- [ ] **Protocol framing / decoding layer.** Currently ASCII and Number data
      types. A pluggable framer — delimiter, length-prefixed, COBS, SLIP, Modbus
      RTU, NMEA — that splits the stream into frames and renders them as
      structured rows would differentiate NinjaTerm sharply from every "dumb pipe"
      terminal. Also feeds Graphing much better than the current extraction.
- [ ] **Scrollback export / session save & replay.** Save the buffer (with
      timestamps and colour) to a file and reload it later for offline analysis.
      Pairs with a "replay at original timing" mode — excellent for demos and for
      reproducing parser bugs. Cheap once rows are strings + style runs (§1).
- [ ] **Trigger to action engine.** Regex rules can already play a sound.
      Generalise the action: start/stop logging, send a macro, insert a bookmark,
      flash the window, run a shell command, stop on match. Turns highlight rules
      into an automation system with almost no new UI.
- [ ] **Graph data export + more extraction modes.** CSV/clipboard export of
      plotted series, multiple named series from one line
      (`temp=21.5 hum=40`), cursor readout. Graphing is a strong feature that
      currently dead-ends.
- [ ] **Telnet option negotiation (RFC 2217).** Raw TCP sockets already exist;
      adding IAC negotiation lets NinjaTerm drive `ser2net` and networked serial
      adapters with real baud-rate control. Small amount of code, genuinely useful.
- [ ] **Command palette (Ctrl+Shift+P)** over settings, presets, macros and
      actions. There are a lot of settings across 6 categories plus a preset
      system; discoverability is the limiting factor now.
- [ ] **Bookmarks / markers in scrollback** (Ctrl+M drops a marker, jump between
      them).
- [ ] **Copy as C array / hex / base64.** Small, and something embedded people do
      by hand constantly.
