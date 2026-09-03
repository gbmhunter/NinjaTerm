import { describe, beforeEach, expect, test } from 'vitest';
import { autorun, reaction, runInAction } from 'mobx';

import { stringToUint8Array } from 'src/model/Util/Util';
import { DataDirection, SingleTerminal } from './SingleTerminal';
import RxSettings from 'src/model/Settings/RxSettings/RxSettings';
import DisplaySettings from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { App } from 'src/model/App';
import SnackbarController from 'src/model/SnackbarController/SnackbarController';
import RulesSettings from 'src/model/Settings/RulesSettings/RulesSettings';
import { HighlightScope } from 'src/model/AppDataManager/DataClasses/HighlightRuleData';

/**
 * Guards the reactivity contract introduced when `TerminalRow` stopped being a
 * MobX observable.
 *
 * Row contents are plain data now; `SingleTerminal.renderVersion` is the single
 * signal that says "row contents changed", bumped once per chunk. Everything
 * that derives from row *text* has to read it, or the UI silently stops
 * updating while the model is perfectly correct — a failure mode no other test
 * in the suite would catch, because the rest of the suite reads the model
 * directly rather than through a MobX reaction.
 *
 * These tests therefore assert through real `autorun`/`reaction` observers,
 * which is what the React `observer` components ultimately are.
 */
describe('SingleTerminal reactivity', () => {
  let terminal: SingleTerminal;
  let rulesSettings: RulesSettings;

  beforeEach(() => {
    window.localStorage.clear();
    const app = new App();
    const profileManager = new AppDataManager(app);
    const rxSettings = new RxSettings(profileManager);
    const displaySettings = new DisplaySettings(profileManager);
    const snackbar = new SnackbarController();
    rulesSettings = new RulesSettings(profileManager);
    rulesSettings.rules.splice(0);

    terminal = new SingleTerminal(
      'reactivity-test',
      true,
      rxSettings,
      displaySettings,
      snackbar,
      null,
      rulesSettings,
    );
    terminal.setTerminalViewHeightPx(500);
  });

  test('parseData bumps renderVersion', () => {
    const before = terminal.renderVersion;
    terminal.parseData(stringToUint8Array('hello'), DataDirection.RX);
    expect(terminal.renderVersion).toBeGreaterThan(before);
  });

  test('clear bumps renderVersion', () => {
    terminal.parseData(stringToUint8Array('hello'), DataDirection.RX);
    const before = terminal.renderVersion;
    runInAction(() => terminal.clear());
    expect(terminal.renderVersion).toBeGreaterThan(before);
  });

  test('an observer of filteredTerminalRows re-runs when text is appended to an existing row', () => {
    // The critical case. Appending to the *current* row does not change the
    // rows array, so `observable.shallow` on `terminalRows` notices nothing —
    // only `renderVersion` carries this change.
    terminal.parseData(stringToUint8Array('abc'), DataDirection.RX);

    let runCount = 0;
    let lastText = '';
    const dispose = autorun(() => {
      const rows = terminal.filteredTerminalRows;
      lastText = rows[0].text;
      runCount += 1;
    });

    expect(runCount).toBe(1);
    expect(lastText).toContain('abc');

    // No new row is created here — 'def' lands on the same first row.
    terminal.parseData(stringToUint8Array('def'), DataDirection.RX);

    expect(runCount).toBe(2);
    expect(lastText).toContain('abcdef');
    dispose();
  });

  test('an observer of highlightMatchesByRow re-runs when matching text arrives', () => {
    rulesSettings.addRule();
    const rule = rulesSettings.rules[0];
    rule.setPattern('ERROR');
    rule.setScope(HighlightScope.MATCH);
    rule.setEnabled(true);

    let matchRowCount = -1;
    const dispose = autorun(() => {
      matchRowCount = terminal.highlightMatchesByRow.size;
    });

    expect(matchRowCount).toBe(0);

    terminal.parseData(stringToUint8Array('ERROR: boom\n'), DataDirection.RX);

    expect(matchRowCount).toBe(1);
    dispose();
  });

  test('an observer of findMatches re-runs when matching text arrives', () => {
    terminal.openFind();
    terminal.setFindQuery('needle');

    let matchCount = -1;
    const dispose = reaction(
      () => terminal.findMatches.length,
      (count) => {
        matchCount = count;
      },
      { fireImmediately: true },
    );

    expect(matchCount).toBe(0);

    terminal.parseData(stringToUint8Array('a needle here\n'), DataDirection.RX);

    expect(matchCount).toBe(1);
    dispose();
  });

  test('row.revision changes so the getSpans cache invalidates', () => {
    // `revision` is deliberately non-reactive, but it must still move on every
    // mutation — it is the cache key the renderer uses to decide whether the
    // row's spans can be reused.
    terminal.parseData(stringToUint8Array('abc'), DataDirection.RX);
    const row = terminal.terminalRows[0];
    const before = row.revision;

    terminal.parseData(stringToUint8Array('def'), DataDirection.RX);

    expect(row.revision).toBeGreaterThan(before);
  });
});
