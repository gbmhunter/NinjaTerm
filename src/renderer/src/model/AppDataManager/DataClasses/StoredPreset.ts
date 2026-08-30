import { makeAutoObservable } from 'mobx';

import { ConfigPatch } from 'src/model/Presets/Preset';
import { ALL_PRESET_CATEGORIES, PresetCategory } from 'src/model/Presets/PresetScope';
import { ProfileConfig } from './ProfileConfig';

/**
 * A preset the user saved, as stored in app data.
 *
 * This is what profiles became. A profile was always a complete snapshot of the
 * config including the serial port; a stored preset is the same thing but with
 * an explicit record of *which* parts it covers, so it can be narrower. One that
 * covers everything behaves exactly as a profile always did.
 *
 * Built-in presets are not stored here — they live in code, so that migrations
 * (most of which blanket-assign defaults across stored config) can't overwrite
 * the very settings they exist to set.
 *
 * Must stay POD (plain old data) and serialisable to JSON.
 */
export class StoredPreset {
  name: string = '';

  /**
   * Which categories this preset covers. Only the branches these name are
   * present in `config`, and only they are written when it is applied.
   */
  scope: PresetCategory[] = [];

  /**
   * The saved values, sparse: only the branches named by `scope` are present.
   */
  config: ConfigPatch;

  constructor(name: string, scope: PresetCategory[] = ALL_PRESET_CATEGORIES, config?: ConfigPatch) {
    this.name = name;
    this.scope = [...scope];
    this.config = config ?? (JSON.parse(JSON.stringify(new ProfileConfig())) as ConfigPatch);
    makeAutoObservable(this);
  }
}
