import { describe, beforeEach, expect, test, vi } from 'vitest';

import { stringToUint8Array } from 'src/model/Util/Util';
import { DataDirection, SingleTerminal } from './SingleTerminal';
import RxSettings from 'src/model/Settings/RxSettings/RxSettings';
import DisplaySettings from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { App } from 'src/model/App';
import SnackbarController from 'src/model/SnackbarController/SnackbarController';
import RulesSettings from 'src/model/Settings/RulesSettings/RulesSettings';
import { HighlightRule } from 'src/model/Settings/RulesSettings/HighlightRule';
import { HighlightRuleSound, HighlightScope } from 'src/model/AppDataManager/DataClasses/HighlightRuleData';
import { SoundPlayer } from 'src/model/Util/SoundPlayer';

/**
 * Builds a `SingleTerminal` with a `RulesSettings` instance and a stub
 * `SoundPlayer` whose `playDing` / `playBuzzer` calls are spied on. The
 * harness lets each test push rules through the live `rules` array on
 * `RulesSettings` and feed input via `parseData`.
 */
function buildHarness() {
  window.localStorage.clear();
  const app = new App();
  const profileManager = new AppDataManager(app);
  const rxSettings = new RxSettings(profileManager);
  const displaySettings = new DisplaySettings(profileManager);
  const snackbar = new SnackbarController();
  const rulesSettings = new RulesSettings(profileManager);
  // Strip the two starter rules so each test composes its own clean
  // rule list via `addRule`. `splice(0)` mutates in place — the existing
  // ref captured by `SingleTerminal` stays valid.
  rulesSettings.rules.splice(0);
  const player = new SoundPlayer();
  const playDing = vi.spyOn(player, 'playDing').mockImplementation(() => {});
  const playBuzzer = vi.spyOn(player, 'playBuzzer').mockImplementation(() => {});

  const terminal = new SingleTerminal(
    'highlight-test',
    true,
    rxSettings,
    displaySettings,
    snackbar,
    null,
    rulesSettings,
    player,
  );
  terminal.setTerminalViewHeightPx(100);

  const addRule = (cfg: Partial<HighlightRule>) => {
    const rule = new HighlightRule();
    // The runtime default is LINE scope (matching the product behaviour),
    // but the bulk of these tests target match-only positions. Pin MATCH
    // here so each test focuses on its specific assertion; LINE-scope
    // tests pass `scope: HighlightScope.LINE` explicitly.
    rule.scope = HighlightScope.MATCH;
    Object.assign(rule, cfg);
    rulesSettings.rules.push(rule);
    return rule;
  };

  return { terminal, rulesSettings, displaySettings, playDing, playBuzzer, addRule };
}

describe('SingleTerminal highlight matches', () => {
  let h: ReturnType<typeof buildHarness>;

  beforeEach(() => {
    h = buildHarness();
  });

  test('no rules → no matches', () => {
    h.terminal.parseData(stringToUint8Array('hello world\n'), DataDirection.RX);
    expect(h.terminal.highlightMatches).toEqual([]);
  });

  test('single rule matches a single substring', () => {
    h.addRule({ pattern: 'world', backgroundColor: '#ff0000' });
    h.terminal.parseData(stringToUint8Array('hello world\n'), DataDirection.RX);
    expect(h.terminal.highlightMatches.length).toBe(1);
    expect(h.terminal.highlightMatches[0]).toMatchObject({
      colStart: 6,
      colEnd: 11,
      backgroundColor: '#ff0000',
    });
  });

  test('disabled rules are skipped', () => {
    h.addRule({ pattern: 'world', backgroundColor: '#ff0000', enabled: false });
    h.terminal.parseData(stringToUint8Array('hello world\n'), DataDirection.RX);
    expect(h.terminal.highlightMatches).toEqual([]);
  });

  test('invalid regex produces no matches and surfaces errorMsg on rule', () => {
    const rule = h.addRule({ pattern: '[unclosed', backgroundColor: '#ff0000' });
    h.terminal.parseData(stringToUint8Array('foo\n'), DataDirection.RX);
    expect(h.terminal.highlightMatches).toEqual([]);
    expect(rule.errorMsg).not.toBe('');
  });

  test('case sensitivity flag is honored', () => {
    h.addRule({ pattern: 'ERROR', backgroundColor: '#ff0000', caseSensitive: true });
    h.terminal.parseData(stringToUint8Array('ERROR Error error\n'), DataDirection.RX);
    expect(h.terminal.highlightMatches.length).toBe(1);
    expect(h.terminal.highlightMatches[0].colStart).toBe(0);
  });

  test('multiple matches in the same row', () => {
    h.addRule({ pattern: 'ab', backgroundColor: '#0f0' });
    h.terminal.parseData(stringToUint8Array('abc ab xyz ab\n'), DataDirection.RX);
    const cols = h.terminal.highlightMatches.map((m) => m.colStart);
    expect(cols).toEqual([0, 4, 11]);
  });

  test('multiple rules, last in array wins via highlightMatchesByRow order', () => {
    h.addRule({ pattern: 'foo', backgroundColor: '#aaa' });
    h.addRule({ pattern: 'foo', backgroundColor: '#bbb' });
    h.terminal.parseData(stringToUint8Array('foo\n'), DataDirection.RX);
    // Both rules push matches at colStart=0; `getSpans` later picks the last
    // one. We just assert both are present and order matches rule order.
    const matches = h.terminal.highlightMatches;
    expect(matches.length).toBe(2);
    expect(matches[0].backgroundColor).toBe('#aaa');
    expect(matches[1].backgroundColor).toBe('#bbb');
  });

  test('zero-width regex does not loop forever and yields no matches', () => {
    h.addRule({ pattern: 'x*', backgroundColor: '#0f0' });
    h.terminal.parseData(stringToUint8Array('abc\n'), DataDirection.RX);
    // Zero-width matches are explicitly dropped to avoid an infinite loop
    // and avoid painting nothing-spans.
    expect(h.terminal.highlightMatches).toEqual([]);
  });

  test('highlightMatchesByRow groups by row index', () => {
    h.addRule({ pattern: 'foo', backgroundColor: '#ccc' });
    h.terminal.parseData(stringToUint8Array('foo\nbar foo\nbaz\n'), DataDirection.RX);
    const byRow = h.terminal.highlightMatchesByRow;
    expect(byRow.get(0)?.length).toBe(1);
    expect(byRow.get(1)?.length).toBe(1);
    expect(byRow.has(2)).toBe(false);
  });
});

describe('SingleTerminal LINE-scope highlights', () => {
  let h: ReturnType<typeof buildHarness>;

  beforeEach(() => {
    h = buildHarness();
  });

  test('LINE scope paints the whole row when regex matches anywhere', () => {
    h.addRule({ pattern: 'error', backgroundColor: '#f00', scope: HighlightScope.LINE });
    h.terminal.parseData(stringToUint8Array('hello error world\n'), DataDirection.RX);
    // Row 0 is the only match; expect a single range covering its full width.
    const row0 = h.terminal.filteredTerminalRows[0];
    const matches = h.terminal.highlightMatchesByRow.get(0) ?? [];
    expect(matches.length).toBe(1);
    expect(matches[0].colStart).toBe(0);
    expect(matches[0].colEnd).toBe(row0.length);
  });

  test('LINE scope leaves non-matching rows alone', () => {
    h.addRule({ pattern: 'error', backgroundColor: '#f00', scope: HighlightScope.LINE });
    h.terminal.parseData(stringToUint8Array('hello world\n'), DataDirection.RX);
    expect(h.terminal.highlightMatches).toEqual([]);
  });

  test('LINE scope paints every wrap segment of a matching logical line', () => {
    // Narrow the terminal so a single logical line spans multiple TerminalRow
    // segments. Width 5 against "hello error world" produces several wrapped
    // segments — the first that contains "error" plus the others that don't.
    h.displaySettings.terminalWidthChars.setDispValue('5');
    h.displaySettings.terminalWidthChars.apply();

    h.addRule({ pattern: 'error', backgroundColor: '#f00', scope: HighlightScope.LINE });
    h.terminal.parseData(stringToUint8Array('hello error world\n'), DataDirection.RX);

    const rows = h.terminal.filteredTerminalRows;
    // First wrap segment + every wasCreatedDueToWrapping=true row that
    // belongs to the same logical line must all carry a full-row highlight.
    // Walk until we find the row holding the cursor — it should be the
    // newly-created empty row after the logical line.
    let lineRowsCount = 0;
    for (let i = 0; i < rows.length; i += 1) {
      if (i === 0 || rows[i].wasCreatedDueToWrapping) {
        lineRowsCount += 1;
      } else {
        break;
      }
    }
    expect(lineRowsCount).toBeGreaterThan(1); // confirm wrapping actually happened
    for (let i = 0; i < lineRowsCount; i += 1) {
      const rowMatches = h.terminal.highlightMatchesByRow.get(i) ?? [];
      expect(rowMatches.length).toBe(1);
      expect(rowMatches[0].colStart).toBe(0);
      expect(rowMatches[0].colEnd).toBe(rows[i].length);
    }
  });

  test('MATCH scope still works alongside LINE-scope rules', () => {
    h.addRule({ pattern: 'foo', backgroundColor: '#0a0', scope: HighlightScope.MATCH });
    h.addRule({ pattern: 'bar', backgroundColor: '#a00', scope: HighlightScope.LINE });
    h.terminal.parseData(stringToUint8Array('foo bar baz\n'), DataDirection.RX);
    const row0 = h.terminal.filteredTerminalRows[0];
    const matches = h.terminal.highlightMatchesByRow.get(0) ?? [];
    // One narrow match from "foo" rule + one full-row range from "bar" rule.
    expect(matches.length).toBe(2);
    expect(matches.some((m) => m.backgroundColor === '#0a0' && m.colEnd - m.colStart === 3)).toBe(true);
    expect(matches.some((m) => m.backgroundColor === '#a00' && m.colEnd === row0.length)).toBe(true);
  });
});

describe('SingleTerminal rule-driven sounds', () => {
  let h: ReturnType<typeof buildHarness>;

  beforeEach(() => {
    h = buildHarness();
  });

  test('ding fires for a matching finalised row', () => {
    h.addRule({ pattern: 'pass', sound: HighlightRuleSound.DING });
    h.terminal.parseData(stringToUint8Array('pass\n'), DataDirection.RX);
    expect(h.playDing).toHaveBeenCalledTimes(1);
    expect(h.playBuzzer).not.toHaveBeenCalled();
  });

  test('buzzer fires once per matching finalised row', () => {
    h.addRule({ pattern: 'fail', sound: HighlightRuleSound.BUZZER });
    h.terminal.parseData(stringToUint8Array('fail\nfail\nfail\n'), DataDirection.RX);
    expect(h.playBuzzer).toHaveBeenCalledTimes(3);
  });

  test('row in progress (no newline yet) does NOT fire a sound', () => {
    h.addRule({ pattern: 'pass', sound: HighlightRuleSound.DING });
    h.terminal.parseData(stringToUint8Array('pass'), DataDirection.RX);
    expect(h.playDing).not.toHaveBeenCalled();
    // Now finalise the line — sound fires.
    h.terminal.parseData(stringToUint8Array('\n'), DataDirection.RX);
    expect(h.playDing).toHaveBeenCalledTimes(1);
  });

  test('rules with sound NONE do not fire', () => {
    h.addRule({ pattern: 'pass', sound: HighlightRuleSound.NONE });
    h.terminal.parseData(stringToUint8Array('pass\n'), DataDirection.RX);
    expect(h.playDing).not.toHaveBeenCalled();
    expect(h.playBuzzer).not.toHaveBeenCalled();
  });

  test('disabled rules do not fire sounds', () => {
    h.addRule({ pattern: 'pass', sound: HighlightRuleSound.DING, enabled: false });
    h.terminal.parseData(stringToUint8Array('pass\n'), DataDirection.RX);
    expect(h.playDing).not.toHaveBeenCalled();
  });

  test('clear() resets the watermark so future rows still fire', () => {
    h.addRule({ pattern: 'go', sound: HighlightRuleSound.DING });
    h.terminal.parseData(stringToUint8Array('go\n'), DataDirection.RX);
    expect(h.playDing).toHaveBeenCalledTimes(1);
    h.terminal.clear();
    h.playDing.mockClear();
    h.terminal.parseData(stringToUint8Array('go\n'), DataDirection.RX);
    expect(h.playDing).toHaveBeenCalledTimes(1);
  });
});
