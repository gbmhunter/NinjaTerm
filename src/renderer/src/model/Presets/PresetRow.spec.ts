import { expect, test, describe } from 'vitest';

import { computeScopeChips } from './PresetRow';
import { ALL_PRESET_CATEGORIES, PresetCategory } from './PresetScope';
import { Preset } from './Preset';

const presetCovering = (scope: PresetCategory[]): Preset => ({
  id: 'test',
  name: 'Test',
  description: '',
  details: '',
  source: 'user',
  scope,
  patch: {},
});

describe('scope chips', () => {
  test('covering everything reads as one word', () => {
    // What every profile carried over from an older version looks like, so it
    // matters that it isn't twelve chips.
    const chips = computeScopeChips(presetCovering(ALL_PRESET_CATEGORIES));

    expect(chips.labels).toEqual(['Everything']);
  });

  test('covering all but one lists the eleven it does cover', () => {
    // Stated positively: what a preset covers, never what it leaves out.
    const scope = ALL_PRESET_CATEGORIES.filter((c) => c !== PresetCategory.MACROS);

    const chips = computeScopeChips(presetCovering(scope));

    expect(chips.labels.length).toBe(ALL_PRESET_CATEGORIES.length - 1);
    expect(chips.labels).not.toContain('Macros');
    expect(chips.labels.some((label) => label.includes('except'))).toBe(false);
  });

  test('nothing is hidden behind a "+N"', () => {
    // Every included category is listed; the chips wrap onto a second line
    // rather than collapsing, since a preset's scope is worth reading in full.
    const scope = ALL_PRESET_CATEGORIES.slice(0, 9);

    const chips = computeScopeChips(presetCovering(scope));

    expect(chips.labels.length).toBe(9);
    expect(chips.labels.some((label) => label.startsWith('+'))).toBe(false);
  });

  test('a middling scope is listed out in display order', () => {
    const chips = computeScopeChips(
      presetCovering([PresetCategory.RX, PresetCategory.CONNECTION, PresetCategory.DISPLAY]),
    );

    // Display order, not the order the scope happened to be built in, so two
    // presets covering the same categories always read the same way.
    expect(chips.labels).toEqual(['Connection settings', 'RX data handling', 'Display']);
  });
});
