import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { configure } from 'mobx';

import { App } from 'src/model/App';
import { CharacterEncoding, DataType, NumberType } from 'src/model/Settings/RxSettings/RxSettings';
import { TerminalFont } from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { BUILT_IN_PRESETS } from './presets';
import { Preset } from './Preset';
import { flattenPatch } from './PresetController';
import { getAtPath } from './PresetScope';

const presetById = (id: string): Preset => {
  const preset = BUILT_IN_PRESETS.find((candidate) => candidate.id === id);
  if (preset === undefined) {
    throw new Error(`No preset with id "${id}".`);
  }
  return preset;
};

describe('preset controller', () => {
  let app: App;
  beforeEach(() => {
    window.localStorage.clear();
    app = new App();
  });

  const currentSettings = () => app.activeSession.config.settings;

  describe('mobx strict mode', () => {
    // `applyPreset` is async, and `makeAutoObservable` only wraps a method in an
    // action up to its first `await` -- the continuation after one runs outside
    // it. In the running app that meant every patched field logged a strict-mode
    // warning as soon as the settings were on screen and therefore observed.
    //
    // The default is `enforceActions: 'observed'`, which stays quiet in a test
    // where nothing observes the values, so this raises it to 'always' to make
    // the violation detectable at all.
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      configure({ enforceActions: 'always' });
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
      configure({ enforceActions: 'observed' });
    });

    const mobxWarnings = () =>
      warnSpy.mock.calls
        .map((args) => args.join(' '))
        .filter((message) => message.includes('[MobX]'));

    test('applying a preset does not modify observables outside an action', async () => {
      await app.presetController.applyPreset(presetById('zephyr-shell'));
      expect(mobxWarnings()).toEqual([]);
    });

    test('applying the defaults preset does not modify observables outside an action', async () => {
      // The widest patch there is, so it touches the most observables.
      await app.presetController.applyPreset(presetById('ninjaterm-default'));
      expect(mobxWarnings()).toEqual([]);
    });

    test('undoing a preset does not modify observables outside an action', async () => {
      await app.presetController.applyPreset(presetById('hex-dump'));
      warnSpy.mockClear();
      app.presetController.undoLastPreset();
      expect(mobxWarnings()).toEqual([]);
    });
  });

  test('applying a preset updates the live settings objects', async () => {
    await app.presetController.applyPreset(presetById('dos-cp437'));

    expect(app.settings.rxSettings.characterEncoding).toBe(CharacterEncoding.CP437);
    expect(app.settings.rxSettings.ansiEscapeCodeParsingEnabled).toBe(true);
    expect(app.settings.displaySettings.terminalFont).toBe(TerminalFont.IBM_VGA);
  });

  test('applying a preset updates applyable fields, not just plain ones', async () => {
    // The important one. Applyable fields need a setDispValue()/apply() pair,
    // and apply() silently does nothing if the value fails its zod schema — so a
    // bad preset value would leave the old value in place with no error anywhere.
    await app.presetController.applyPreset(presetById('dos-cp437'));

    expect(app.settings.displaySettings.charSizePx.appliedValue).toBe(16);
    expect(app.settings.displaySettings.terminalWidthChars.appliedValue).toBe(80);
    expect(app.settings.displaySettings.terminalHeightChars.appliedValue).toBe(25);
  });

  test('every preset round-trips through the applyable-field path', async () => {
    // Same guard as above, but across all presets and every field they set, so a
    // new preset with a value its zod schema rejects fails here rather than
    // silently leaving the old value in place.
    for (const preset of BUILT_IN_PRESETS) {
      window.localStorage.clear();
      const freshApp = new App();
      await freshApp.presetController.applyPreset(preset);
      const config = freshApp.activeSession.config;
      for (const [path, value] of flattenPatch(preset.patch)) {
        expect(getAtPath(config, path), `${preset.id}: ${path} did not stick`).toEqual(value);
      }
    }
  });

  test('the hex dump preset switches the terminal to numbers', async () => {
    await app.presetController.applyPreset(presetById('hex-dump'));

    expect(app.settings.rxSettings.dataType).toBe(DataType.NUMBER);
    expect(app.settings.rxSettings.numberType).toBe(NumberType.HEX);
    expect(app.settings.rxSettings.numBytesPerHexNumber.appliedValue).toBe(1);
  });

  test('applying a preset leaves port and log settings untouched', async () => {
    // Baud rate and log directory are machine- and device-specific; a preset
    // clobbering them would be a very bad first impression.
    const portBefore = JSON.stringify(currentSettings().portSettings);
    const logBefore = JSON.stringify(currentSettings().logSettings);

    await app.presetController.applyPreset(presetById('dos-cp437'));

    expect(JSON.stringify(currentSettings().portSettings)).toBe(portBefore);
    expect(JSON.stringify(currentSettings().logSettings)).toBe(logBefore);
  });

  test('applying a preset leaves the user colours untouched', async () => {
    app.settings.displaySettings.defaultBackgroundColor.setDispValue('#123456');
    app.settings.displaySettings.defaultBackgroundColor.apply();

    await app.presetController.applyPreset(presetById('dos-cp437'));

    expect(app.settings.displaySettings.defaultBackgroundColor.appliedValue).toBe('#123456');
  });

  //================================================================================
  // Change computation (what the confirmation dialog shows)
  //================================================================================
  describe('computeChanges', () => {
    test('lists only settings that actually differ, with readable values', async () => {
      const changes = app.presetController.computeChanges(presetById('dos-cp437'));

      const encodingChange = changes.find((change) => change.path === 'settings.rxSettings.characterEncoding');
      expect(encodingChange).toBeDefined();
      expect(encodingChange!.label).toBe('RX › Character encoding');
      // Numeric enums must be named, not shown as integers.
      expect(encodingChange!.oldValue).toBe('Ascii');
      expect(encodingChange!.newValue).toBe('Cp437');

      // ANSI parsing is already on by default, so it is not a change.
      expect(changes.map((change) => change.path)).not.toContain(
        'settings.rxSettings.ansiEscapeCodeParsingEnabled',
      );
    });

    test('formats booleans as On/Off', async () => {
      const changes = app.presetController.computeChanges(presetById('plain-text-log'));

      const timestamps = changes.find((change) => change.path === 'settings.rxSettings.addTimestamps');
      expect(timestamps!.oldValue).toBe('Off');
      expect(timestamps!.newValue).toBe('On');
    });

    test('returns nothing once the preset has been applied', async () => {
      // Drives the "this preset matches your current settings" state.
      const preset = presetById('dos-cp437');
      expect(app.presetController.computeChanges(preset).length).toBeGreaterThan(0);

      await app.presetController.applyPreset(preset);

      expect(app.presetController.computeChanges(preset)).toEqual([]);
    });
  });

  //================================================================================
  // Undo
  //================================================================================
  describe('undo', () => {
    test('restores every setting the preset changed', async () => {
      const before = JSON.stringify(currentSettings());

      await app.presetController.applyPreset(presetById('dos-cp437'));
      expect(JSON.stringify(currentSettings())).not.toBe(before);

      app.presetController.undoLastPreset();

      expect(JSON.stringify(currentSettings())).toBe(before);
      expect(app.settings.rxSettings.characterEncoding).toBe(CharacterEncoding.ASCII);
      expect(app.settings.displaySettings.charSizePx.appliedValue).toBe(14);
    });

    test('is unavailable until a preset has been applied', async () => {
      expect(app.presetController.canUndo).toBe(false);

      await app.presetController.applyPreset(presetById('hex-dump'));

      expect(app.presetController.canUndo).toBe(true);
    });

    test('is a no-op when there is nothing to undo', async () => {
      const before = JSON.stringify(currentSettings());

      app.presetController.undoLastPreset();

      expect(JSON.stringify(currentSettings())).toBe(before);
    });

    test('only one level of undo is kept', async () => {
      await app.presetController.applyPreset(presetById('hex-dump'));
      await app.presetController.applyPreset(presetById('dos-cp437'));

      app.presetController.undoLastPreset();

      // Back to the hex dump state, not all the way to the defaults.
      expect(app.settings.rxSettings.dataType).toBe(DataType.NUMBER);
      expect(app.presetController.canUndo).toBe(false);
    });
  });

  //================================================================================
  // Search
  //================================================================================
  describe('search', () => {
    test('an empty search returns every preset, saved and built in', async () => {
      // The saved ones come first, so a user's own presets are what they see.
      const savedCount = app.profileManager.appData.presets.length;
      expect(app.presetController.filteredRows.length).toBe(BUILT_IN_PRESETS.length + savedCount);
      expect(app.presetController.filteredRows[0].preset.source).toBe('user');
    });

    test('matches on name, description and keywords', async () => {
      app.presetController.setSearchText('CP437');
      expect(app.presetController.filteredRows.map((row) => row.preset.id)).toEqual(['dos-cp437']);

      // "menuconfig" appears only in the keywords, not the visible text.
      app.presetController.setSearchText('zephyr');
      expect(app.presetController.filteredRows.map((row) => row.preset.id)).toEqual([
        'zephyr-shell',
      ]);
    });

    test('is case-insensitive and ignores surrounding whitespace', async () => {
      app.presetController.setSearchText('  hEx  ');
      expect(app.presetController.filteredRows.map((row) => row.preset.id)).toContain('hex-dump');
    });
  });
});
