import { makeAutoObservable } from 'mobx';

import { App } from 'src/model/App';
import { ConfigPatch, Preset } from './Preset';
import { BUILT_IN_PRESETS } from './presets';
import { ALL_PRESET_CATEGORIES, ConfigBranch, PresetCategory, branchesForScope, categoryDef, getAtPath, normalizeScope, setAtPath } from './PresetScope';
import { PresetRow, computeConnectionSummary, computeScopeChips } from './PresetRow';
import { PortAction, resolvePortAction } from './resolvePortAction';
import { ConnState } from 'src/model/Settings/PortSettings/PortSettings';
import { formatSettingValue, labelForPath } from './presetFieldLabels';

/** One setting a preset would change, formatted for display. */
export interface SettingChange {
  /** Dotted path into the config, e.g. 'settings.rxSettings.characterEncoding'. */
  path: string;
  /** Human label, e.g. 'RX › Character encoding'. */
  label: string;
  oldValue: string;
  newValue: string;
}

/**
 * Value equality for the plain-old-data the config is made of.
 *
 * Safe to compare via JSON here: the config is documented as POD and
 * serialisable, with no dates, functions or cycles.
 */
export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Every leaf in a patch, as [dotted path, value] pairs.
 *
 * Arrays count as leaves: a patch replaces a whole list or leaves it alone.
 */
export function flattenPatch(patch: ConfigPatch): [string, unknown][] {
  const leaves: [string, unknown][] = [];
  const walk = (value: unknown, pathSoFar: string) => {
    if (value === undefined) {
      return;
    }
    const isPlainObject =
      value !== null && typeof value === 'object' && !Array.isArray(value);
    if (!isPlainObject) {
      leaves.push([pathSoFar, value]);
      return;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      walk(child, pathSoFar === '' ? key : `${pathSoFar}.${key}`);
    }
  };
  walk(patch, '');
  return leaves;
}

export class PresetController {
  app: App;

  builtInPresets = BUILT_IN_PRESETS;

  searchText = '';

  /** The preset the confirmation dialog is asking about, or null if it's closed. */
  presetPendingConfirmation: Preset | null = null;

  /**
   * The config branches captured immediately before the last preset was applied,
   * and their values, or null if there is nothing to undo.
   *
   * Only the branches the preset actually covered are snapshotted, so undoing a
   * display-only preset can't roll back an unrelated setting the user changed by
   * hand in between.
   */
  _undoSnapshot: { branches: ConfigBranch[]; values: Record<string, unknown> } | null = null;

  constructor(app: App) {
    this.app = app;
    makeAutoObservable(this);
  }

  /** Reloads the parts of the app affected by the given branches. */
  _notifyBranchesChanged = (branches: ConfigBranch[]) => {
    this.app.profileManager.notifyConfigReloaded(branches);
  };

  setSearchText = (value: string) => {
    this.searchText = value;
  };

  /**
   * Every preset, built in and saved, as rows for the list.
   *
   * Saved presets come first: they are the ones a user returns to, whereas the
   * built-ins are there to be discovered once.
   */
  get rows(): PresetRow[] {
    const storedRows: PresetRow[] = this.app.profileManager.appData.presets.map(
      (stored, index) => {
        const preset: Preset = {
          id: `user-${index}`,
          name: stored.name,
          description: '',
          details: '',
          source: 'user',
          scope: stored.scope,
          patch: stored.config,
        };
        return {
          key: `user-${index}`,
          storedIndex: index,
          preset,
          connectionSummary: computeConnectionSummary(preset),
        };
      },
    );
    const builtInRows: PresetRow[] = this.builtInPresets.map((preset) => ({
      key: preset.id,
      storedIndex: null,
      preset,
      connectionSummary: computeConnectionSummary(preset),
    }));
    return [...storedRows, ...builtInRows];
  }

  /** Rows matching the search box, by name, description, keywords or scope. */
  get filteredRows(): PresetRow[] {
    const searchText = this.searchText.trim().toLowerCase();
    if (searchText === '') {
      return this.rows;
    }
    return this.rows.filter((row) => {
      const scopeLabels = row.preset.scope.map((category) => categoryDef(category).label).join(' ');
      const haystack =
        `${row.preset.name} ${row.preset.description} ${row.preset.keywords ?? ''} ${scopeLabels}`.toLowerCase();
      return haystack.includes(searchText);
    });
  }

  /** The scope chips shown on a row. */
  scopeChipsFor = (preset: Preset) => computeScopeChips(preset);

  get canUndo(): boolean {
    return this._undoSnapshot !== null;
  }

  /**
   * The settings the given preset would actually change, ignoring any it already
   * matches. Pure — safe to call while rendering.
   */
  computeChanges = (preset: Preset): SettingChange[] => {
    const config = this.app.profileManager.appData.currentAppConfig;
    const changes: SettingChange[] = [];
    for (const [path, newValue] of flattenPatch(preset.patch)) {
      const oldValue = getAtPath(config, path);
      // Compared by value, not by reference. Arrays and objects — macros,
      // filters, highlight rules — are fresh copies every time a preset is
      // captured, so a reference comparison reported every one of them as
      // changed even when they were identical.
      if (isDeepEqual(oldValue, newValue)) {
        continue;
      }
      changes.push({
        path,
        label: labelForPath(path),
        oldValue: formatSettingValue(path, oldValue),
        newValue: formatSettingValue(path, newValue),
      });
    }
    return changes;
  };

  /** Opens the confirmation dialog for a preset. */
  requestApply = (preset: Preset) => {
    this.presetPendingConfirmation = preset;
  };

  closeConfirmation = () => {
    this.presetPendingConfirmation = null;
  };

  /**
   * Applies a preset to the current settings.
   *
   * Patches the plain-old-data config tree and then asks every settings class to
   * re-read it, rather than calling individual setters. That reuses the exact
   * path a profile load already exercises — including the setDispValue()/apply()
   * two-step that applyable fields such as `charSizePx` need — so preset
   * definitions stay declarative.
   */
  applyPreset = async (preset: Preset) => {
    const config = this.app.profileManager.appData.currentAppConfig;
    const branches = branchesForScope(preset.scope);

    // Work out what to do about the serial connection before touching anything.
    // When the port isn't in scope this resolves synchronously and the port list
    // is never even requested, which keeps a narrow apply from disturbing an open
    // connection at all.
    const portAction = await this._resolvePortActionFor(preset, branches);

    if (portAction.kind === 'connect') {
      if (this.app.connController.connState === ConnState.OPENED) {
        await this.app.connController.closeConnection({ silenceSnackbar: true });
      } else if (this.app.connController.connState === ConnState.CLOSED_BUT_WILL_REOPEN) {
        this.app.connController.stopWaitingToReopenPort();
      }
    }

    // Snapshot only what this preset covers, so undoing it can't roll back an
    // unrelated setting the user changed by hand in between.
    const values: Record<string, unknown> = {};
    for (const branch of branches) {
      values[branch] = JSON.parse(JSON.stringify(getAtPath(config, branch) ?? null));
    }
    this._undoSnapshot = { branches, values };

    for (const [path, value] of flattenPatch(preset.patch)) {
      setAtPath(config, path, value);
    }

    this.app.profileManager.saveAppData();
    // Before opening the port, so the preset's baud rate is live by the time it
    // does.
    this._notifyBranchesChanged(branches);

    this.app.profileManager.lastAppliedPresetName = preset.name;
    this.presetPendingConfirmation = null;

    let message = `Applied the "${preset.name}" preset.`;
    let variant: 'success' | 'warning' = 'success';
    if (portAction.kind === 'connect') {
      this.app.connController.setSelectedPort(portAction.port);
      await this.app.connController.openConnection({ silenceSnackbar: true });
      message += `
Connected to ${portAction.port.path}.`;
    } else if (portAction.kind === 'warn') {
      message += `
${portAction.message}`;
      variant = 'warning';
    }
    this.app.snackbar.sendToSnackbar(message, variant);
  };

  /**
   * Decides what applying the given preset should do about the serial port.
   * Only asks the main process for the port list when it actually has to.
   */
  _resolvePortActionFor = async (preset: Preset, branches: ConfigBranch[]): Promise<PortAction> => {
    if (!branches.includes('settings.portSettings')) {
      return { kind: 'none', reason: 'not-in-scope' };
    }
    const desiredPath =
      (getAtPath(preset.patch, 'settings.portSettings.lastUsedSerialPortPath') as string) ?? '';
    const currentPath =
      this.app.profileManager.appData.currentAppConfig.settings.portSettings.lastUsedSerialPortPath;
    if (desiredPath === '' || desiredPath === currentPath) {
      return resolvePortAction(true, desiredPath, currentPath, []);
    }
    const availablePortsResult = await window.electronAPI.serial.listPorts();
    if (!availablePortsResult.success) {
      throw new Error('Failed to list available ports.');
    }
    return resolvePortAction(true, desiredPath, currentPath, availablePortsResult.ports!);
  };

  /** Restores the branches as they were before the last preset was applied. */
  undoLastPreset = () => {
    if (this._undoSnapshot === null) {
      return;
    }
    const config = this.app.profileManager.appData.currentAppConfig;
    const { branches, values } = this._undoSnapshot;
    for (const branch of branches) {
      const value = values[branch];
      if (value !== null) {
        setAtPath(config, branch, JSON.parse(JSON.stringify(value)));
      }
    }
    this._undoSnapshot = null;

    this.app.profileManager.saveAppData();
    this._notifyBranchesChanged(branches);

    this.app.snackbar.sendToSnackbar('Settings restored.', 'info');
  };

  //================================================================================
  // Saving, updating and deleting the user's own presets
  //================================================================================

  /** Non-null while the save dialog is open. */
  saveDialog: { name: string; scope: PresetCategory[] } | null = null;

  openSaveDialog = () => {
    this.saveDialog = {
      name: this.app.profileManager.nextUnusedPresetName(),
      // Everything by default: capturing the current setup whole is the common
      // case, and unticking a category is easier than finding the ones you want.
      scope: [...ALL_PRESET_CATEGORIES],
    };
  };

  closeSaveDialog = () => {
    this.saveDialog = null;
  };

  setSaveDialogName = (name: string) => {
    if (this.saveDialog !== null) {
      this.saveDialog.name = name;
    }
  };

  toggleSaveDialogCategory = (category: PresetCategory) => {
    if (this.saveDialog === null) {
      return;
    }
    const scope = this.saveDialog.scope;
    this.saveDialog.scope = scope.includes(category)
      ? scope.filter((existing) => existing !== category)
      : [...scope, category];
  };

  setSaveDialogScope = (scope: PresetCategory[]) => {
    if (this.saveDialog !== null) {
      this.saveDialog.scope = [...scope];
    }
  };

  /** A preset that covers nothing would do nothing when applied. */
  get canSave(): boolean {
    return (
      this.saveDialog !== null &&
      this.saveDialog.name.trim() !== '' &&
      this.saveDialog.scope.length > 0 &&
      !this.saveDialogNameClashesWithBuiltIn
    );
  }

  /**
   * Built-in names are reserved: two rows reading "Hex dump" with no way to tell
   * them apart is worse than rejecting the name.
   */
  get saveDialogNameClashesWithBuiltIn(): boolean {
    if (this.saveDialog === null) {
      return false;
    }
    const name = this.saveDialog.name.trim().toLowerCase();
    return this.builtInPresets.some((preset) => preset.name.toLowerCase() === name);
  }

  /** The index of the saved preset this name would overwrite, or null. */
  get saveDialogOverwriteIndex(): number | null {
    if (this.saveDialog === null) {
      return null;
    }
    const name = this.saveDialog.name.trim().toLowerCase();
    const index = this.app.profileManager.appData.presets.findIndex(
      (preset) => preset.name.toLowerCase() === name,
    );
    return index === -1 ? null : index;
  }

  confirmSaveDialog = () => {
    if (this.saveDialog === null || !this.canSave) {
      return;
    }
    const { name, scope } = this.saveDialog;
    const overwriteIndex = this.saveDialogOverwriteIndex;
    if (overwriteIndex !== null) {
      this.app.profileManager.savePreset(overwriteIndex, normalizeScope(scope), true);
      this.app.snackbar.sendToSnackbar(`Preset "${name.trim()}" updated.`, 'success');
    } else {
      this.app.profileManager.newPreset(name.trim(), normalizeScope(scope));
      this.app.snackbar.sendToSnackbar(`Preset "${name.trim()}" saved.`, 'success');
    }
    this.saveDialog = null;
  };

  /** Re-captures the current settings into a saved preset, keeping its scope. */
  updateStoredPreset = (row: PresetRow) => {
    if (row.storedIndex === null) {
      return;
    }
    this.app.profileManager.savePreset(row.storedIndex);
  };

  deleteStoredPreset = (row: PresetRow) => {
    if (row.storedIndex === null) {
      return;
    }
    const name = row.preset.name;
    this.app.profileManager.deletePreset(row.storedIndex);
    this.app.snackbar.sendToSnackbar(`Deleted preset "${name}".`, 'info');
  };
}
