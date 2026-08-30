import { expect, test, describe } from 'vitest';

import { ProfileConfig } from 'src/model/AppDataManager/DataClasses/ProfileConfig';
import {
  ALL_PRESET_CATEGORIES,
  PRESET_CATEGORIES,
  PresetCategory,
  branchesForScope,
  capturePatch,
  categoryDef,
  deriveScope,
  getAtPath,
  normalizeScope,
  setAtPath,
} from './PresetScope';
import { flattenPatch } from './PresetController';

describe('preset scope', () => {
  test('no branch is claimed by more than one category', () => {
    // Otherwise a branch would be captured twice and, worse, unticking one
    // category would not actually exclude it.
    const seen = new Set<string>();
    for (const def of PRESET_CATEGORIES) {
      for (const branch of def.branches) {
        expect(seen.has(branch), `branch "${branch}" is claimed twice`).toBe(false);
        seen.add(branch);
      }
    }
  });

  test('full scope covers every branch of the config', () => {
    // If a branch has no category then "everything" would not be everything, and
    // a profile carried over from an older version would silently drop it the
    // first time the user re-saved.
    const config = new ProfileConfig() as unknown as Record<string, unknown>;
    const covered = new Set(branchesForScope(ALL_PRESET_CATEGORIES));

    const expectedBranches: string[] = [];
    for (const container of ['settings', 'terminal']) {
      for (const child of Object.keys(config[container] as object)) {
        expectedBranches.push(`${container}.${child}`);
      }
    }

    for (const branch of expectedBranches) {
      expect(covered.has(branch as never), `branch "${branch}" has no category`).toBe(true);
    }
    expect(covered.size).toBe(expectedBranches.length);
  });

  test('scope is normalised to be deduplicated and sorted', () => {
    // Scope arrays get serialised into app data and compared, and the snapshot
    // tests stringify them, so ordering has to be stable.
    const scope = normalizeScope([
      PresetCategory.RX,
      PresetCategory.CONNECTION,
      PresetCategory.RX,
    ]);
    expect(scope).toEqual([PresetCategory.CONNECTION, PresetCategory.RX]);
    expect(ALL_PRESET_CATEGORIES).toEqual([...ALL_PRESET_CATEGORIES].sort());
  });

  test('capture then derive round-trips the scope', () => {
    const config = new ProfileConfig();
    for (const category of ALL_PRESET_CATEGORIES) {
      const patch = capturePatch(config, [category]);
      expect(deriveScope(patch), `${category} did not round-trip`).toEqual([category]);
    }
  });

  test('capturing only takes the branches in scope', () => {
    const config = new ProfileConfig();
    const patch = capturePatch(config, [PresetCategory.RX]);

    expect(Object.keys(patch)).toEqual(['settings']);
    expect(Object.keys(patch.settings!)).toEqual(['rxSettings']);
  });

  test('capturing keeps settings that name something local', () => {
    // The log directory and the debug probe are settings the user chose. If you
    // set up logging for a particular board, reapplying its preset should put the
    // logs back in the same place — so these travel with the preset rather than
    // being stripped for being machine-specific.
    const config = new ProfileConfig();
    config.settings.logSettings.logDirectory = '/home/dev/logs/stm32';
    config.settings.portSettings.rttServerExePath = '/opt/JLink/JLinkExe';
    config.settings.portSettings.rttJLinkSerialNumber = '123456789';

    const patch = capturePatch(config, [PresetCategory.LOGGING, PresetCategory.CONNECTION]);

    expect(getAtPath(patch, 'settings.logSettings.logDirectory')).toBe('/home/dev/logs/stm32');
    expect(getAtPath(patch, 'settings.portSettings.rttServerExePath')).toBe('/opt/JLink/JLinkExe');
    expect(getAtPath(patch, 'settings.portSettings.rttJLinkSerialNumber')).toBe('123456789');
    // The companion flag has to travel too, or auto-detect would fight the
    // restored path on the next visit to the RTT pane.
    expect(getAtPath(patch, 'settings.portSettings.rttServerExePathUserModified')).not.toBeUndefined();
  });

  test('capturing drops incidental state that is not a setting', () => {
    // The recent-devices list is a most-recently-used history. Applying someone's
    // preset should not rewrite it.
    const config = new ProfileConfig();
    config.settings.portSettings.rttRecentDevices = ['STM32F407VG'];

    const patch = capturePatch(config, [PresetCategory.CONNECTION]);
    const capturedPaths = flattenPatch(patch).map(([path]) => path);

    expect(capturedPaths).not.toContain('settings.portSettings.rttRecentDevices');
    // The rest of the branch is still captured.
    expect(capturedPaths).toContain('settings.portSettings.baudRate');
  });

  test('a full-scope capture applied over another config reproduces it exactly', () => {
    // This is the guarantee that profiles carried over from older versions behave
    // exactly as loading them used to: merging the leaves of a complete patch is
    // equivalent to replacing the config wholesale.
    const source = new ProfileConfig();
    source.settings.rxSettings.maxEscapeCodeLengthChars = 40;
    source.settings.displaySettings.charSizePx = 22;
    source.settings.portSettings.baudRate = 9600;
    source.settings.portSettings.lastUsedSerialPortPath = 'COM7';

    const patch = capturePatch(source, ALL_PRESET_CATEGORIES);

    const target = new ProfileConfig();
    for (const [path, value] of flattenPatch(patch)) {
      setAtPath(target, path, value);
    }

    expect(JSON.stringify(target)).toBe(JSON.stringify(source));
  });

  test('every category has a label and a description for the save dialog', () => {
    for (const category of ALL_PRESET_CATEGORIES) {
      const def = categoryDef(category);
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
    }
  });

  test('one connection category covers both how you connect and what you connect to', () => {
    // Deliberately not split into "connection settings" and "this serial port".
    // The address is part of the connection settings whatever the transport —
    // a socket host, RTT device and BLE UUIDs always were, and the serial port
    // path now is too.
    expect(categoryDef(PresetCategory.CONNECTION).branches).toEqual(['settings.portSettings']);

    // And the serial path really is in there, rather than in a branch of its own.
    const patch = capturePatch(new ProfileConfig(), [PresetCategory.CONNECTION]);
    expect(
      getAtPath(patch, 'settings.portSettings.lastUsedSerialPortPath'),
    ).not.toBeUndefined();
  });

  test('getAtPath and setAtPath walk paths of any depth', () => {
    const config = new ProfileConfig();
    setAtPath(config, 'settings.rxSettings.maxEscapeCodeLengthChars', 33);
    expect(getAtPath(config, 'settings.rxSettings.maxEscapeCodeLengthChars')).toBe(33);

    // A missing parent is tolerated rather than throwing, so a patch may name a
    // branch the running config does not have.
    expect(() => setAtPath(config, 'nope.missing.field', 1)).not.toThrow();
    expect(getAtPath(config, 'nope.missing.field')).toBeUndefined();
  });
});
