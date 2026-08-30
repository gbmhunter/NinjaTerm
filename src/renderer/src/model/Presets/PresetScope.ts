import { ProfileConfig } from 'src/model/AppDataManager/DataClasses/ProfileConfig';
import { ConfigPatch } from './Preset';

/**
 * A top-level branch of the config tree. This is the unit that scope is defined
 * in, and the unit a settings class declares when it registers for reloads.
 */
export type ConfigBranch =
  | 'settings.portSettings'
  | 'settings.txSettings'
  | 'settings.rxSettings'
  | 'settings.displaySettings'
  | 'settings.generalSettings'
  | 'settings.graphingSettings'
  | 'settings.logSettings'
  | 'settings.rulesSettings'
  | 'terminal.macroController'
  | 'terminal.rightDrawer'
  | 'terminal.filters';

/**
 * What a preset covers, as shown to the user. Mostly one category per branch,
 * but kept separate from `ConfigBranch` so the two can diverge — the serial port
 * is its own category despite living under one branch, because whether a preset
 * pins you to COM7 is a different question from what baud rate it uses.
 */
export enum PresetCategory {
  CONNECTION = 'connection',
  RX = 'rx',
  TX = 'tx',
  DISPLAY = 'display',
  LOGGING = 'logging',
  RULES = 'rules',
  MACROS = 'macros',
  FILTERS = 'filters',
  GRAPHING = 'graphing',
  GENERAL = 'general',
  LAYOUT = 'layout',
}

export interface CategoryDef {
  category: PresetCategory;
  /** Checkbox label and chip text. */
  label: string;
  /** Helper text under the checkbox. */
  description: string;
  branches: ConfigBranch[];
  /**
   * Dotted paths never captured into a user preset, because they are incidental
   * state rather than a setting the user chose — an MRU list, say. Settings are
   * captured even when they name something local like a directory or a probe
   * serial number, since reapplying a preset for a particular board should put
   * those back.
   *
   * Applied at capture time only: a preset that somehow contains an excluded
   * path still applies it, so profiles carried over from older versions keep
   * working.
   */
  excludedPaths?: string[];
  /** Hidden behind "show advanced" in the save dialog. */
  advanced?: boolean;
}

/**
 * Every category, in the order they are shown to the user.
 *
 * Saving a preset starts with all of them ticked — the common case is "capture
 * how things are right now", and it is easier to untick the one or two you don't
 * want than to hunt for the ones you do.
 */
export const PRESET_CATEGORIES: CategoryDef[] = [
  {
    category: PresetCategory.CONNECTION,
    label: 'Connection settings',
    description:
      'The connection type, address (e.g. serial port ID, BLE device or socket address), and ' +
      'connection parameters.',
    // Everything about connecting is one branch and one category: the type, the
    // address, and the parameters. The serial port path used to sit outside
    // `portSettings` in its own top-level branch, a leftover from when serial
    // was the only connection type.
    branches: ['settings.portSettings'],
    // The debug probe path and serial number are settings the user chose, and a
    // preset for a particular board may well want to name a particular probe, so
    // they travel. The recent-devices list is not a setting at all — it is a
    // most-recently-used history, and applying a preset should not rewrite it.
    excludedPaths: ['settings.portSettings.rttRecentDevices'],
  },
  {
    category: PresetCategory.RX,
    label: 'RX data handling',
    description: 'How received bytes are decoded and displayed.',
    branches: ['settings.rxSettings'],
  },
  {
    category: PresetCategory.TX,
    label: 'TX / key behaviour',
    description: 'What the Enter, Backspace and Delete keys send.',
    branches: ['settings.txSettings'],
  },
  {
    category: PresetCategory.DISPLAY,
    label: 'Display',
    description: 'Font, terminal size, colours and scrollback.',
    branches: ['settings.displaySettings'],
  },
  {
    category: PresetCategory.LOGGING,
    label: 'Logging',
    description: 'What gets logged and how files are named.',
    branches: ['settings.logSettings'],
    // The log directory travels with the preset. If you have set up logging for a
    // particular board, reapplying its preset should put the logs back in the same
    // place — that is the whole point of saving it.
  },
  {
    category: PresetCategory.RULES,
    label: 'Highlight rules',
    description: 'Patterns that colour matching text or play a sound.',
    branches: ['settings.rulesSettings'],
  },
  {
    category: PresetCategory.MACROS,
    label: 'Macros',
    description: 'The macros in the right drawer.',
    branches: ['terminal.macroController'],
  },
  {
    category: PresetCategory.FILTERS,
    label: 'Filters',
    description: 'Filters applied to the terminal view.',
    branches: ['terminal.filters'],
  },
  {
    category: PresetCategory.GRAPHING,
    label: 'Graphing',
    description: 'How values are parsed out of the data stream and plotted.',
    branches: ['settings.graphingSettings'],
  },
  {
    category: PresetCategory.GENERAL,
    label: 'General',
    description: 'Copy and paste behaviour.',
    branches: ['settings.generalSettings'],
  },
  {
    category: PresetCategory.LAYOUT,
    label: 'Drawer layout',
    description: 'Right drawer width and which sections are expanded.',
    branches: ['terminal.rightDrawer'],
    advanced: true,
  },
];

/**
 * Every category, sorted.
 *
 * Sorted rather than in display order because scope arrays are compared and
 * serialised — the app data snapshot tests stringify them, and array order is
 * significant there.
 */
export const ALL_PRESET_CATEGORIES: PresetCategory[] = PRESET_CATEGORIES.map(
  (def) => def.category,
).sort();

const CATEGORY_DEF_BY_ID = new Map<PresetCategory, CategoryDef>(
  PRESET_CATEGORIES.map((def) => [def.category, def]),
);

export function categoryDef(category: PresetCategory): CategoryDef {
  const def = CATEGORY_DEF_BY_ID.get(category);
  if (def === undefined) {
    throw new Error(`Unknown preset category "${category}".`);
  }
  return def;
}

/** Deduplicated and sorted, so two equivalent scopes always compare equal. */
export function normalizeScope(scope: PresetCategory[]): PresetCategory[] {
  return [...new Set(scope)].sort();
}

/** The config branches covered by a scope. */
export function branchesForScope(scope: PresetCategory[]): ConfigBranch[] {
  const branches = new Set<ConfigBranch>();
  for (const category of scope) {
    for (const branch of categoryDef(category).branches) {
      branches.add(branch);
    }
  }
  return [...branches];
}

const CATEGORY_BY_BRANCH = new Map<ConfigBranch, PresetCategory>(
  PRESET_CATEGORIES.flatMap((def) => def.branches.map((branch) => [branch, def.category] as const)),
);

/**
 * The scope implied by a patch, i.e. every category whose branch the patch
 * touches.
 *
 * Built-in presets use this rather than declaring a scope, so a built-in's
 * advertised scope can never disagree with what it actually sets.
 */
export function deriveScope(patch: ConfigPatch): PresetCategory[] {
  const categories: PresetCategory[] = [];
  for (const branch of branchesInPatch(patch)) {
    const category = CATEGORY_BY_BRANCH.get(branch);
    if (category !== undefined) {
      categories.push(category);
    }
  }
  return normalizeScope(categories);
}

/** The branches a patch has any content under. */
export function branchesInPatch(patch: ConfigPatch): ConfigBranch[] {
  const branches: ConfigBranch[] = [];
  const patchRecord = patch as Record<string, unknown>;
  for (const [topKey, topValue] of Object.entries(patchRecord)) {
    if (topValue === undefined || topValue === null) {
      continue;
    }
    // 'settings' and 'terminal' are containers; their children are the branches.
    for (const childKey of Object.keys(topValue as object)) {
      const branch = `${topKey}.${childKey}` as ConfigBranch;
      if (CATEGORY_BY_BRANCH.has(branch)) {
        branches.push(branch);
      }
    }
  }
  return branches;
}

/** Reads a dotted path out of an object, or undefined if any parent is missing. */
export function getAtPath(root: unknown, path: string): unknown {
  let current: unknown = root;
  for (const segment of path.split('.')) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Writes a dotted path into an object. Silently does nothing if a parent along
 * the way is missing — that tolerance is what lets a patch name a branch the
 * running config doesn't have, rather than throwing.
 */
export function setAtPath(root: unknown, path: string, value: unknown): void {
  const segments = path.split('.');
  let current: unknown = root;
  for (const segment of segments.slice(0, -1)) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  if (current === undefined || current === null || typeof current !== 'object') {
    return;
  }
  (current as Record<string, unknown>)[segments[segments.length - 1]] = value;
}

/** Deletes a dotted path, if it is there. */
function deleteAtPath(root: unknown, path: string): void {
  const segments = path.split('.');
  let current: unknown = root;
  for (const segment of segments.slice(0, -1)) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  if (current !== undefined && current !== null && typeof current === 'object') {
    delete (current as Record<string, unknown>)[segments[segments.length - 1]];
  }
}

/**
 * Snapshots the branches a scope covers out of a config, dropping anything
 * specific to this machine.
 *
 * @param config The config to capture from, normally `currentAppConfig`.
 * @param scope The categories the user ticked.
 */
export function capturePatch(config: ProfileConfig, scope: PresetCategory[]): ConfigPatch {
  const patch: Record<string, unknown> = {};
  for (const branch of branchesForScope(scope)) {
    const value = getAtPath(config, branch);
    if (value === undefined) {
      continue;
    }
    setAtPathCreating(patch, branch, JSON.parse(JSON.stringify(value)));
  }
  for (const category of scope) {
    for (const excludedPath of categoryDef(category).excludedPaths ?? []) {
      deleteAtPath(patch, excludedPath);
    }
  }
  return patch as ConfigPatch;
}

/** Like `setAtPath`, but creates missing intermediate objects. */
function setAtPathCreating(root: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split('.');
  let current = root;
  for (const segment of segments.slice(0, -1)) {
    if (current[segment] === undefined) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = value;
}
