import { action, makeObservable, observable, runInAction } from 'mobx';
import { ZodType } from 'zod';

import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import { ProfileConfig } from 'src/model/AppDataManager/DataClasses/ProfileConfig';
import { ConfigBranch } from 'src/model/Presets/PresetScope';
import { ApplyableNumberField, ApplyableTextField } from 'src/view/Components/ApplyableTextField';

/** The keys of `T` whose value type is assignable to `V`. */
type KeysOfType<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];

/**
 * Binds a settings class to its branch of the persisted config tree, so the
 * persisted object is the *only* copy of each setting.
 *
 * Every settings class used to hold a runtime copy of each field and sync it
 * with the persisted `*Data` object by hand: a `_loadConfig` copying every
 * field in, a `_saveConfig` copying every field out, an `_isLoading` guard so
 * a save fired mid-load didn't clobber fields not yet read, a
 * `registerOnConfigReload` call, and a two-line setter per field. Three
 * shipped bugs came from that sync code — a missing `_isLoading`, a missing
 * reload registration, and drift between the two copies — and adding a
 * setting meant five or six edits across three files.
 *
 * The copies existed because the persisted tree was only *sometimes*
 * observable (see `AppDataManager._loadAppDataFromStorage`). Now that it
 * always is, a settings class can be a thin typed façade over it:
 *
 *   get dataType() { return this.branch.data.dataType; }
 *   setDataType = this.branch.setter('dataType');
 *
 * Nothing to load, nothing to save back, nothing to guard: a setter writes the
 * one copy and persists. Defaults live only in the `*Data` class. Presets and
 * undo write into the same tree, so they are seen without a reload callback —
 * the only thing that needs re-seeding on reload is the `dispValue` of an
 * applyable text field, and this class does that once for all of them.
 *
 * Used by composition rather than inheritance because MobX's
 * `makeAutoObservable` refuses classes with a superclass. The settings class
 * excludes the `branch` field from its own `makeAutoObservable` call and this
 * class annotates its own members.
 *
 * `attach` is separate from the constructor because this project compiles with
 * native class-field semantics (`target: ESNext`), under which field
 * initialisers run *before* the constructor body — so a field initialiser
 * cannot see a constructor parameter. `branch` is therefore created inline with
 * no dependencies, and everything declared against it is lazy: plain-field
 * getters and setters resolve `data` when called, and an applyable field is
 * built with a placeholder display value and seeded for real when `attach`
 * runs the re-seeders. That is what lets a settings class declare
 *
 *   maxEscapeCodeLengthChars = this.branch.applyableNumber('maxEscapeCodeLengthChars', z.coerce.number().min(2));
 *
 * as a one-line field with its validation right there, and call
 * `this.branch.attach(profileManager)` in the constructor body.
 */
export class SettingsBranch<TData extends object> {
  /**
   * The persisted object for this branch — the single source of truth.
   *
   * Held as a reference rather than re-resolved through the tree on every read.
   * Settings are read per received byte in the terminal parser, and MobX
   * overhead per read is the parser's measured bottleneck, so this keeps a
   * settings read to one observable-ref hop plus the leaf. The reference is
   * refreshed on reload, which is the only time the branch object is replaced
   * (undoing a preset swaps the whole subtree; applying one writes leaves).
   */
  data!: TData;

  private profileManager!: AppDataManager;

  private readonly branchName: ConfigBranch;

  private readonly select: (config: ProfileConfig) => TData;

  /** One thunk per applyable field, re-seeding its display value from `data`. */
  private readonly reseeders: Array<() => void> = [];

  constructor(branchName: ConfigBranch, select: (config: ProfileConfig) => TData) {
    this.branchName = branchName;
    this.select = select;
    makeObservable<SettingsBranch<TData>, 'onReload' | 'isAttached'>(this, {
      data: observable.ref,
      attach: action,
      onReload: action,
      // Plain bookkeeping, not a computed.
      isAttached: false,
    });
  }

  /**
   * Points this branch at the live config and registers for reloads. Must be
   * called once, from the owning settings class's constructor, before any
   * `applyable*` call.
   */
  attach(profileManager: AppDataManager) {
    this.profileManager = profileManager;
    this.data = this.select(profileManager.appData.currentAppConfig);
    profileManager.registerOnConfigReload([this.branchName], () => this.onReload());
    // Applyable fields declared as field initialisers were built before `data`
    // existed; give them their real values now.
    for (const reseed of this.reseeders) {
      reseed();
    }
  }

  private get isAttached(): boolean {
    return this.profileManager !== undefined;
  }

  /** Persists the whole app data. Call after writing to `data` directly. */
  save() {
    this.profileManager.saveAppData();
  }

  /** Writes one field and persists. For setters that then do something else. */
  set<K extends keyof TData>(key: K, value: TData[K]) {
    runInAction(() => {
      this.data[key] = value;
    });
    this.save();
  }

  /**
   * A setter for a plain field: writes it and persists. Typed from the data
   * class, so `setter('dataType')` is `(value: DataType) => void` and a typo in
   * the key is a compile error.
   */
  setter<K extends keyof TData>(key: K): (value: TData[K]) => void {
    return (value: TData[K]) => this.set(key, value);
  }

  /**
   * An applyable number field bound to a numeric key: seeded from the persisted
   * value, writing it back on apply, and re-seeded on reload.
   *
   * @param afterChange Runs after a changed value has been written and saved.
   *    For fields where a change has a side effect, e.g. reopening the port.
   */
  applyableNumber<K extends KeysOfType<TData, number>>(
    key: K,
    schema: ZodType,
    afterChange?: () => void,
  ): ApplyableNumberField {
    const field = new ApplyableNumberField(this.isAttached ? String(this.data[key]) : '', schema);
    field.setOnApplyChanged(() => {
      runInAction(() => {
        (this.data as Record<K, number>)[key] = field.appliedValue;
      });
      this.save();
      afterChange?.();
    });
    this.reseeders.push(() => {
      field.setDispValue(String(this.data[key]));
      // notify: false — this is the persisted value flowing *in*; writing it
      // straight back out would be a wasted save at best.
      field.apply({ notify: false });
    });
    return field;
  }

  /** As `applyableNumber`, for a string key. */
  applyableText<K extends KeysOfType<TData, string>>(
    key: K,
    schema: ZodType,
    afterChange?: () => void,
  ): ApplyableTextField {
    const field = new ApplyableTextField(this.isAttached ? String(this.data[key]) : '', schema);
    field.setOnApplyChanged(() => {
      runInAction(() => {
        (this.data as Record<K, string>)[key] = field.appliedValue;
      });
      this.save();
      afterChange?.();
    });
    this.reseeders.push(() => {
      field.setDispValue(String(this.data[key]));
      field.apply({ notify: false });
    });
    return field;
  }

  /**
   * Called when a preset or profile has rewritten this branch. Re-resolves
   * `data` first — an undo replaces the subtree object — then re-seeds every
   * applyable field's display value from it. Plain fields need nothing: their
   * getters read through `data`.
   */
  private onReload() {
    this.data = this.select(this.profileManager.appData.currentAppConfig);
    for (const reseed of this.reseeders) {
      reseed();
    }
  }
}
