import { makeAutoObservable } from 'mobx';
import { VariantType } from 'notistack';
import { PortInfo } from '@serialport/bindings-interface';

import { ConnState } from '../Settings/PortSettings/PortSettings';
import { App } from '../App';
import { AppData, LATEST_VERSION } from './DataClasses/AppData';
import { StoredPreset } from './DataClasses/StoredPreset';
import { migrateAppData } from './appDataMigrations';
import { log } from '@/model/Util/Log';
import { ConfigBranch, ALL_PRESET_CATEGORIES, PresetCategory, capturePatch } from '@/model/Presets/PresetScope';

/**
 * Alias to the up-to-date version of the app data class.
 */
// export const AppData = AppData;

const APP_DATA_STORAGE_KEY = 'appData';

export class AppDataManager {
  app: App;

  appData: AppData;

  _configReloadCallbacks: { branches: ConfigBranch[]; callback: () => void }[] = [];

  /**
   * Represents the name of the last profile that was applied to the app. Used for displaying
   * in various places such as the toolbar.
   */
  lastAppliedPresetName: string = 'No preset';

  constructor(app: App) {
    this.app = app;
    this.appData = new AppData();

    window.addEventListener('storage', this.onStorageEvent);

    // Load app data from storage
    this._loadAppDataFromStorage();

    makeAutoObservable(this);
  }

  /**
   * Removes listeners that this manager registered on the global window.
   * Called from App.cleanup() so a recreated App (e.g. hot reload during dev)
   * does not leave stale `storage`-event handlers attached to the previous
   * instance.
   */
  cleanup = () => {
    window.removeEventListener('storage', this.onStorageEvent);
  };

  /**
   * Function should be registered as a listener for the 'storage' event. It will check
   * to see if the profile data in storage has changed and if so, reload the profiles.
   * @param event The storage event.
   * @returns
   */
  onStorageEvent = (event: StorageEvent) => {
    log.info('Caught storage event. event.key: ', event.key, ' event.newValue: ', event.newValue);

    if (event.key === APP_DATA_STORAGE_KEY) {
      log.info('App data changed from another process. Checking if profiles changed...');
      // Check if the profiles changed
      const appDataAsJson = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
      if (appDataAsJson === null) {
        log.error('App data not found in local storage.');
        return;
      }
      let appDataInStorage: any;
      try {
        appDataInStorage = JSON.parse(appDataAsJson);
      } catch (err) {
        // Another tab/process wrote unparseable data. Skip the cross-tab
        // sync rather than crashing the renderer.
        log.error('Failed to parse app data from storage event. err=', err);
        return;
      }
      // Compare the JSON strings of the profiles to work out if they are different
      // This path bypasses migration, so ignore anything not already at the
      // current version rather than letting an older window blank the list.
      if (!Array.isArray(appDataInStorage.presets) || appDataInStorage.version !== LATEST_VERSION) {
        return;
      }
      if (JSON.stringify(appDataInStorage.presets) !== JSON.stringify(this.appData.presets)) {
        log.info('Presets changed. Reloading presets...');
        // Reload just the presets, we don't want to overwrite the current app config
        this.appData.presets = appDataInStorage.presets;
      }
    }
  }

  /**
   * Ask to be told when the config is reloaded.
   *
   * @param branches The config branches this callback cares about. It is only
   *    invoked when one of them is among those that changed, so a preset that
   *    only touches RX settings doesn't make the rules pane rebuild its list and
   *    close its edit modal, or make the logger do an IPC round-trip.
   * @param callback Normally a settings class's `_loadConfig`.
   */
  registerOnConfigReload = (branches: ConfigBranch[], callback: () => void) => {
    this._configReloadCallbacks.push({ branches, callback });
  };

  /**
   * Tell every registered part of the app to re-read `currentAppConfig`.
   *
   * Called after the config tree is replaced wholesale (loading a profile) or
   * patched in place (applying a preset). Each registered callback is a
   * settings class's `_loadConfig()`, which re-reads its own slice — including
   * doing the setDispValue()/apply() two-step for applyable fields.
   */
  notifyConfigReloaded = (changedBranches?: ConfigBranch[]) => {
    for (const { branches, callback } of this._configReloadCallbacks) {
      // Undefined means "everything changed", which is what a wholesale config
      // replacement does.
      if (changedBranches === undefined || branches.some((b) => changedBranches.includes(b))) {
        callback();
      }
    }
  };

  _loadAppDataFromStorage = () => {
    const appDataAsJson = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
    // let profileManagerData: ProfileManagerData;
    let appData: AppData;
    if (appDataAsJson === null) {
      // No config key found in users store, create one!
      log.info('App data not found in local storage. Creating default app data...');
      appData = new AppData();
      // Save just-created config back to store.
      window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData));
    } else {
      // A version of app data was found in local storage. Load it.
      let appDataUnknownVersion: any;
      try {
        appDataUnknownVersion = JSON.parse(appDataAsJson);
      } catch (err) {
        // Corrupt / truncated localStorage entry. Without this guard, an
        // unparseable value crashes the App constructor and leaves the
        // renderer dead on launch with no way to recover. Fall back to a
        // fresh default and overwrite the bad value.
        log.error('Failed to parse app data from local storage. Falling back to defaults. err=', err);
        appData = new AppData();
        window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData));
        this.appData = appData;
        return;
      }
      let wasChanged;
      ({ appData, wasChanged } = this._updateAppData(appDataUnknownVersion));

      if (wasChanged) {
        window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData));
      }
    }

    // Load data into class
    this.appData = appData;
  };

  /**
   * Use this to update an app data object read from local storage to the latest version.
   *
   * Does not modify the input object, instead returns a new object with the updated version.
   *
   * The actual per-version migration steps live in `./appDataMigrations.ts` —
   * each one is a small typed function so a typo in a settings-tree field name
   * is a TS error rather than the silent runtime no-op the previous
   * `(any) => any` chain produced.
   *
   * @param appData The app data object to update.
   * @returns An object containing the updated app data and a boolean
   *   indicating if the app data was changed.
   */
  _updateAppData = (appData: unknown): { appData: AppData, wasChanged: boolean } => {
    const result = migrateAppData(appData);
    if (result.unknownVersion) {
      log.error('Unknown app data version found. Falling back to a fresh AppData. version=', (appData as any)?.version);
      return { appData: new AppData(), wasChanged: true };
    }
    // The migrated object has the right shape but is a plain object — the
    // class methods on `AppData` / `Profile` aren't reattached. Existing
    // callers treat it as plain JSON anyway (the manager re-saves the whole
    // tree via JSON.stringify), so the cast is safe.
    return { appData: result.appData as unknown as AppData, wasChanged: result.wasChanged };
  }


  /**
   * Save the current app configuration to local storage.
   */
  saveAppData = () => {
    window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(this.appData));
  };

  /**
   * Create a preset capturing the current app state, and add it to the list.
   *
   * @param name What to call it.
   * @param scope Which categories it covers. Defaults to everything, which is
   *    what a profile always was.
   */
  newPreset = (name: string, scope: PresetCategory[] = ALL_PRESET_CATEGORIES) => {
    const preset = new StoredPreset(name, scope, capturePatch(this.appData.currentAppConfig, scope));
    this.appData.presets.push(preset);
    this.saveAppData();
    return this.appData.presets.length - 1;
  };

  /**
   * A name not already taken by a saved preset, in the form "New preset N".
   */
  nextUnusedPresetName = () => {
    let nextNum = 1;
    let candidate = 'New preset 1';
    while (this.appData.presets.find((preset) => preset.name === candidate) !== undefined) {
      nextNum += 1;
      candidate = `New preset ${nextNum}`;
    }
    return candidate;
  };

  /**
   * Delete the preset at the provided index.
   * @param presetIdx The index of the preset to delete.
   */
  deletePreset = (presetIdx: number) => {
    this.appData.presets.splice(presetIdx, 1);
    this.saveAppData();
  };

  /**
   * Re-capture the current app state into an existing preset, keeping its scope.
   *
   * @param presetIdx The index of the preset to overwrite.
   * @param scope Optionally change what it covers at the same time.
   */
  savePreset = (presetIdx: number, scope?: PresetCategory[], noSnackbar = false) => {
    const preset = this.appData.presets[presetIdx];
    if (scope !== undefined) {
      preset.scope = [...scope];
    }
    preset.config = capturePatch(this.appData.currentAppConfig, preset.scope);
    this.saveAppData();

    // Saving the current state into a preset leaves the app matching that
    // preset, same as applying it, so the window title follows.
    this.lastAppliedPresetName = preset.name;

    if (!noSnackbar) {
      this.app.snackbar.sendToSnackbar(`Preset "${preset.name}" saved.`, 'success');
    }
  };

  /**
   * Apply the stored preset at the provided index.
   *
   * @param presetIdx The index of the preset to apply.
   */
  applyStoredPreset = async (presetIdx: number) => {
    const stored = this.appData.presets[presetIdx];
    await this.app.presetController.applyPreset({
      id: `user-${presetIdx}`,
      name: stored.name,
      description: '',
      details: '',
      source: 'user',
      scope: stored.scope,
      patch: JSON.parse(JSON.stringify(stored.config)),
    });
  };
}
