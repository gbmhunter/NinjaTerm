import { describe, expect, test, beforeEach } from 'vitest';
import { autorun } from 'mobx';

import { App } from 'src/model/App';
import { RxSettingsData } from 'src/model/AppDataManager/DataClasses/RxSettingsData';
import { WhatToNameTheFile } from 'src/model/Logging/Logging';
import { CharacterEncoding, DataType } from './RxSettings/RxSettings';

/**
 * Guards for the settings façade built on `SettingsBranch`, exercised through
 * `RxSettings` and `PortSettings` as representative users.
 *
 * The design has two specific things that could go quietly wrong, and each
 * has a test here that would fail if it did:
 *
 *  - `SettingsBranch.data` is a cached reference, not re-resolved per read
 *    (per-byte settings reads in the parser make the walk too expensive).
 *    Undoing a preset replaces the whole branch object via `setAtPath`, so if
 *    the cache were not refreshed on reload, getters would keep reading — and
 *    setters keep writing — a detached object. The undo test covers exactly
 *    that: observe through the getter across an undo, then write through a
 *    setter and check the *live* tree received it.
 *
 *  - Applyable fields hold a display-string copy of their value, which is the
 *    one thing that still has to be re-seeded when a preset arrives. The
 *    applyable-reseed test covers that.
 */
describe('settings façade', () => {
  let app: App;

  beforeEach(() => {
    window.localStorage.clear();
    app = new App();
  });

  test('a setter is observed through the getter', () => {
    const rx = app.settings.rxSettings;
    const seen: DataType[] = [];
    const dispose = autorun(() => {
      seen.push(rx.dataType);
    });

    rx.setDataType(DataType.NUMBER);
    dispose();

    expect(seen).toEqual([DataType.ASCII, DataType.NUMBER]);
  });

  test('a setter writes the persisted object and localStorage — there is no second copy', () => {
    app.settings.rxSettings.setDataType(DataType.NUMBER);

    expect(app.profileManager.appData.currentAppConfig.settings.rxSettings.dataType).toBe(DataType.NUMBER);
    const stored = JSON.parse(window.localStorage.getItem('appData')!);
    expect(stored.currentAppConfig.settings.rxSettings.dataType).toBe(DataType.NUMBER);
  });

  test('defaults come from the data class alone', () => {
    // The settings class no longer declares any defaults of its own, so the
    // only way this can pass is by reading the data class's value.
    const defaults = new RxSettingsData();
    const rx = app.settings.rxSettings;
    expect(rx.maxEscapeCodeLengthChars.appliedValue).toBe(defaults.maxEscapeCodeLengthChars);
    expect(rx.dataType).toBe(defaults.dataType);
    expect(rx.numberSeparator.appliedValue).toBe(defaults.numberSeparator);
  });

  test('applying a preset is observed through the getter with no reload plumbing', async () => {
    const rx = app.settings.rxSettings;
    rx.setCharacterEncoding(CharacterEncoding.CP437);
    const presetIdx = app.profileManager.newPreset('Saved');
    rx.setCharacterEncoding(CharacterEncoding.ASCII);

    const seen: CharacterEncoding[] = [];
    const dispose = autorun(() => {
      seen.push(rx.characterEncoding);
    });
    await app.profileManager.applyStoredPreset(presetIdx);
    dispose();

    expect(seen).toEqual([CharacterEncoding.ASCII, CharacterEncoding.CP437]);
  });

  test('an applyable field is re-seeded when a preset is applied', async () => {
    const field = app.settings.rxSettings.maxEscapeCodeLengthChars;
    field.setDispValue('40');
    field.apply();
    const presetIdx = app.profileManager.newPreset('Saved');
    field.setDispValue('25');
    field.apply();
    expect(field.appliedValue).toBe(25);

    await app.profileManager.applyStoredPreset(presetIdx);

    expect(field.dispValue).toBe('40');
    expect(field.appliedValue).toBe(40);
  });

  test('undoing a preset, which replaces the branch object, is observed and leaves setters writing the live tree', async () => {
    const rx = app.settings.rxSettings;
    rx.setCharacterEncoding(CharacterEncoding.CP437);
    const presetIdx = app.profileManager.newPreset('Saved');
    rx.setCharacterEncoding(CharacterEncoding.ASCII);
    await app.profileManager.applyStoredPreset(presetIdx);
    expect(rx.characterEncoding).toBe(CharacterEncoding.CP437);

    const seen: CharacterEncoding[] = [];
    const dispose = autorun(() => {
      seen.push(rx.characterEncoding);
    });
    app.presetController.undoLastPreset();
    dispose();

    // Undo swapped `settings.rxSettings` for a snapshot object. The getter
    // must have followed it...
    expect(seen).toEqual([CharacterEncoding.CP437, CharacterEncoding.ASCII]);

    // ...and so must the setter: a write now has to land in the object that
    // is actually in the tree, not the one that was there before the undo.
    rx.setCharacterEncoding(CharacterEncoding.UTF8);
    expect(app.profileManager.appData.currentAppConfig.settings.rxSettings.characterEncoding).toBe(
      CharacterEncoding.UTF8,
    );
  });

  test('a converted PortSettings applyable persists, validates, and keeps its last good value on bad input', () => {
    const port = app.settings.portConfiguration;

    port.baudRate.setDispValue('9600');
    port.baudRate.apply();
    expect(port.baudRate.appliedValue).toBe(9600);
    expect(app.profileManager.appData.currentAppConfig.settings.portSettings.baudRate).toBe(9600);

    // The old hand-rolled version only validated on apply; ApplyableField
    // validates as you type, like every other applyable in the app.
    port.baudRate.setDispValue('fast');
    expect(port.baudRate.isValid).toBe(false);
    expect(port.baudRate.errorMsg).not.toBe('');
    port.baudRate.apply();
    expect(port.baudRate.appliedValue).toBe(9600);
    expect(app.profileManager.appData.currentAppConfig.settings.portSettings.baudRate).toBe(9600);
  });

  test('a settings class constructed against a second manager sees the persisted values', () => {
    // This is what DisplaySettings.spec relies on for its "survives a reload"
    // test: build a fresh manager from localStorage and read through it.
    app.settings.txSettings.setUseCtrlFForFind(false);
    const again = new App();
    expect(again.settings.txSettings.useCtrlFForFind).toBe(false);
  });

  test('Graphing stores its numeric applyables as numbers and re-validates max against min', () => {
    const graphing = app.graphing;
    const persisted = () => app.profileManager.appData.currentAppConfig.settings.graphingSettings;

    graphing.maxBufferSize.setDispValue('2000');
    graphing.maxBufferSize.apply();
    // Was persisted as the string '2000' before app data v25.
    expect(persisted().maxBufferSize).toBe(2000);

    // xAxisRangeMax's schema refines against the applied xAxisRangeMin, so
    // raising the min past the max must flag the max as invalid.
    graphing.xAxisRangeMax.setDispValue('50');
    graphing.xAxisRangeMax.apply();
    expect(persisted().xAxisRangeMax).toBe(50);
    graphing.xAxisRangeMin.setDispValue('60');
    graphing.xAxisRangeMin.apply();
    expect(persisted().xAxisRangeMin).toBe(60);
    expect(graphing.xAxisRangeMax.isValid).toBe(false);
  });

  test('applying a preset re-seeds Graphing min before max, so a valid saved range stays valid', async () => {
    const graphing = app.graphing;
    // Save a preset with the range [200, 300], then move the live range down
    // to [0, 100] so applying the preset has to raise both bounds.
    graphing.xAxisRangeMax.setDispValue('300');
    graphing.xAxisRangeMax.apply();
    graphing.xAxisRangeMin.setDispValue('200');
    graphing.xAxisRangeMin.apply();
    const presetIdx = app.profileManager.newPreset('Wide');
    graphing.xAxisRangeMin.setDispValue('0');
    graphing.xAxisRangeMin.apply();
    graphing.xAxisRangeMax.setDispValue('100');
    graphing.xAxisRangeMax.apply();

    await app.profileManager.applyStoredPreset(presetIdx);

    expect(graphing.xAxisRangeMin.appliedValue).toBe(200);
    expect(graphing.xAxisRangeMax.appliedValue).toBe(300);
    expect(graphing.xAxisRangeMax.isValid).toBe(true);
  });

  test('Logging setters write the persisted object; a preset re-seeds the file name field', async () => {
    const logging = app.logging;
    logging.setLogRawTxData(true);
    logging.setWhatToNameTheFile(WhatToNameTheFile.CUSTOM);
    const stored = JSON.parse(window.localStorage.getItem('appData')!);
    expect(stored.currentAppConfig.settings.logSettings.logRawTxData).toBe(true);
    expect(stored.currentAppConfig.settings.logSettings.whatToNameTheFile).toBe(WhatToNameTheFile.CUSTOM);

    logging.customFileName.setDispValue('preset.log');
    logging.customFileName.apply();
    const presetIdx = app.profileManager.newPreset('Saved');
    logging.customFileName.setDispValue('other.log');
    logging.customFileName.apply();

    await app.profileManager.applyStoredPreset(presetIdx);

    expect(logging.customFileName.dispValue).toBe('preset.log');
    expect(logging.customFileName.appliedValue).toBe('preset.log');
  });

  test('Terminals.showRightDrawer and RightDrawer share the one persisted branch', () => {
    const terminals = app.terminals;
    const persisted = () => app.profileManager.appData.currentAppConfig.terminal.rightDrawer;

    terminals.setShowRightDrawer(false);
    expect(terminals.rightDrawer.showRightDrawer).toBe(false);
    expect(persisted().showRightDrawer).toBe(false);

    // Runtime name differs from the persisted one; both must move together.
    terminals.rightDrawer.setDrawerWidth(300);
    expect(terminals.rightDrawer.drawerWidth_px).toBe(300);
    expect(persisted().rightDrawerWidth_px).toBe(300);

    const again = new App();
    expect(again.terminals.showRightDrawer).toBe(false);
    expect(again.terminals.rightDrawer.drawerWidth_px).toBe(300);
  });
});
