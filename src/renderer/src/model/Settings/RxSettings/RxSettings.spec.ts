import { expect, test, describe, beforeEach } from 'vitest';

import { App } from 'src/model/App';
import { CharacterEncoding } from './RxSettings';

describe('RX settings persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  //================================================================================
  // Regression tests for applying a preset losing settings.
  //
  // These were written against the old two-copy design, where `_loadConfig` read
  // the stored config field by field while applyable fields' on-apply callbacks
  // could fire `_saveConfig` part-way through and overwrite the fields not yet
  // read. That code no longer exists: the persisted object is the only copy
  // (see `SettingsBranch`), so there is nothing to clobber. The tests stay
  // because what they assert — that applying a saved preset restores every RX
  // setting and leaves the stored config exactly as the preset had it — is the
  // behaviour that matters, however it is implemented.
  //================================================================================

  test('loading a profile restores every RX setting, not just the ones before the first apply', () => {
    // `maxEscapeCodeLengthChars` is applied near the top of `_loadConfig`. Once the
    // profile's value differs from the running one, the save it triggers writes the
    // current runtime values — still the defaults at that point in the load — over
    // roughly thirty RX fields further down the profile's config.
    const app = new App();
    const rxSettings = app.settings.rxSettings;

    rxSettings.maxEscapeCodeLengthChars.setDispValue('40');
    rxSettings.maxEscapeCodeLengthChars.apply();
    rxSettings.setCharacterEncoding(CharacterEncoding.CP437);
    rxSettings.setAddTimestamps(true);
    rxSettings.numberSeparator.setDispValue('-');
    rxSettings.numberSeparator.apply();
    rxSettings.setShowWarningOnRxBreakSignal(false);

    // Snapshot that state into a profile, then move everything back to defaults.
    const savedProfileIdx = app.profileManager.newPreset('Saved');

    rxSettings.maxEscapeCodeLengthChars.setDispValue('25');
    rxSettings.maxEscapeCodeLengthChars.apply();
    rxSettings.setCharacterEncoding(CharacterEncoding.ASCII);
    rxSettings.setAddTimestamps(false);
    rxSettings.numberSeparator.setDispValue(' ');
    rxSettings.numberSeparator.apply();
    rxSettings.setShowWarningOnRxBreakSignal(true);

    return app.profileManager.applyStoredPreset(savedProfileIdx).then(() => {
      expect(rxSettings.maxEscapeCodeLengthChars.appliedValue).toBe(40);
      // These four are all read *after* the maxEscapeCodeLengthChars apply.
      expect(rxSettings.characterEncoding).toBe(CharacterEncoding.CP437);
      expect(rxSettings.addTimestamps).toBe(true);
      expect(rxSettings.numberSeparator.appliedValue).toBe('-');
      expect(rxSettings.showWarningOnRxBreakSignal).toBe(false);
    });
  });

  test('a reload does not overwrite the stored config with runtime defaults', () => {
    // Tighter version of the above, asserting on the stored config rather than the
    // runtime objects, so a regression is obvious even if the runtime happens to
    // agree by coincidence.
    const app = new App();
    const rxSettings = app.settings.rxSettings;

    rxSettings.maxEscapeCodeLengthChars.setDispValue('40');
    rxSettings.maxEscapeCodeLengthChars.apply();
    rxSettings.setCharacterEncoding(CharacterEncoding.CP437);

    const savedProfileIdx = app.profileManager.newPreset('Saved');
    const savedRxConfig = JSON.stringify(
      app.profileManager.appData.presets[savedProfileIdx].config.settings!.rxSettings,
    );

    rxSettings.maxEscapeCodeLengthChars.setDispValue('25');
    rxSettings.maxEscapeCodeLengthChars.apply();
    rxSettings.setCharacterEncoding(CharacterEncoding.ASCII);

    return app.profileManager.applyStoredPreset(savedProfileIdx).then(() => {
      expect(
        JSON.stringify(app.activeSession.config.settings.rxSettings),
      ).toBe(savedRxConfig);
    });
  });
});
