import { expect, test, describe } from 'vitest';

import { ProfileConfig } from 'src/model/AppDataManager/DataClasses/ProfileConfig';
import { BUILT_IN_FORBIDDEN_BRANCHES, BUILT_IN_FORBIDDEN_PATHS } from './Preset';
import { BUILT_IN_PRESETS } from './presets';
import { flattenPatch } from './PresetController';
import { branchesInPatch, deriveScope, getAtPath, normalizeScope } from './PresetScope';
import { PRESET_FIELD_LABELS } from './presetFieldLabels';

describe('built-in presets', () => {
  test('ids are unique, stable-looking and kebab-case', () => {
    // Ids end up in data-testids, so treat them as public surface.
    const ids = BUILT_IN_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  test('every preset has a name, description and details', () => {
    for (const preset of BUILT_IN_PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
      expect(preset.details.length).toBeGreaterThan(0);
    }
  });

  test('every preset is marked built-in with a scope derived from its patch', () => {
    // Scope is derived rather than authored so it can't drift from the patch.
    for (const preset of BUILT_IN_PRESETS) {
      expect(preset.source).toBe('built-in');
      expect(preset.scope).toEqual(normalizeScope(deriveScope(preset.patch)));
      expect(preset.scope.length).toBeGreaterThan(0);
    }
  });

  test('every patched path exists on the config', () => {
    // Guards against a preset silently setting a field that was renamed or
    // removed. The DeepPartial type catches most of this at compile time; this
    // also covers the runtime shape.
    const defaults = new ProfileConfig();
    for (const preset of BUILT_IN_PRESETS) {
      for (const [path] of flattenPatch(preset.patch)) {
        expect(
          getAtPath(defaults, path),
          `${preset.id} patches unknown path "${path}"`,
        ).not.toBeUndefined();
      }
    }
  });

  test('no built-in touches a forbidden branch or path', () => {
    // Built-ins must not carry anything machine-, device- or taste-specific:
    // baud rate, the serial port, log directory, colours, tooltip preferences.
    // This restriction is deliberately not applied to presets the user saves.
    for (const preset of BUILT_IN_PRESETS) {
      for (const branch of branchesInPatch(preset.patch)) {
        expect(
          BUILT_IN_FORBIDDEN_BRANCHES,
          `${preset.id} patches forbidden branch "${branch}"`,
        ).not.toContain(branch);
      }
      for (const [path] of flattenPatch(preset.patch)) {
        expect(
          BUILT_IN_FORBIDDEN_PATHS,
          `${preset.id} patches forbidden path "${path}"`,
        ).not.toContain(path);
      }
    }
  });

  test('every patched path has a human-readable label', () => {
    // Otherwise the confirmation dialog shows a raw path like
    // "settings.rxSettings.characterEncoding" to the user.
    for (const preset of BUILT_IN_PRESETS) {
      for (const [path] of flattenPatch(preset.patch)) {
        expect(
          PRESET_FIELD_LABELS[path],
          `no label for "${path}" (used by ${preset.id})`,
        ).toBeDefined();
      }
    }
  });

  test('every preset changes something relative to the defaults', () => {
    // A preset that matches the defaults exactly is dead weight, and almost
    // certainly a mistake.
    const defaults = new ProfileConfig();
    for (const preset of BUILT_IN_PRESETS) {
      const differing = flattenPatch(preset.patch).filter(
        ([path, value]) => getAtPath(defaults, path) !== value,
      );
      expect(differing.length, `${preset.id} matches the defaults exactly`).toBeGreaterThan(0);
    }
  });

  test('the DOS preset removes the row padding so frames join up', () => {
    // Reported on issue #411: the bundled DOS fonts are bitmap fonts whose
    // glyphs fill their cell exactly (ascent - descent == 1 em), so any vertical
    // row padding leaves a gap and the vertical strokes of a box-drawing frame
    // stop meeting. NinjaTerm's own font has built-in leading and wants some.
    const dosPreset = BUILT_IN_PRESETS.find((preset) => preset.id === 'dos-cp437');
    const padding = flattenPatch(dosPreset!.patch).find(
      ([path]) => path === 'settings.displaySettings.verticalRowPaddingPx',
    );
    expect(padding, 'the DOS preset must set the row padding').toBeDefined();
    expect(padding![1]).toBe(0);
  });

  test('the DOS preset sets what is needed for CP437 box drawing', () => {
    // Locks in the settings issue #411 actually needs, so a future edit can't
    // quietly drop one and leave the preset not working.
    const dosPreset = BUILT_IN_PRESETS.find((preset) => preset.id === 'dos-cp437');
    expect(dosPreset).toBeDefined();
    const paths = flattenPatch(dosPreset!.patch).map(([path]) => path);
    expect(paths).toContain('settings.rxSettings.characterEncoding');
    expect(paths).toContain('settings.rxSettings.ansiEscapeCodeParsingEnabled');
    expect(paths).toContain('settings.displaySettings.terminalFont');
  });
});
