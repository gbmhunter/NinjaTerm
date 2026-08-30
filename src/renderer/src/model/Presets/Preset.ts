import { ProfileConfig } from 'src/model/AppDataManager/DataClasses/ProfileConfig';
import { PresetCategory } from './PresetScope';

/**
 * Recursively optional. Arrays are all-or-nothing — a patch either replaces a
 * whole list or leaves it alone, since patching an array by index is never what
 * a preset wants.
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

/**
 * A sparse patch over the config tree.
 *
 * The same shape covers all three kinds of preset, which is the point: a
 * built-in is sparse in both branches and fields; one the user saved is sparse
 * in branches but complete within them; a profile carried over from an older
 * version is complete in both. Applying the last of those by merging leaves is
 * equivalent to the wholesale config replacement that loading a profile used to
 * do — which is what makes carried-over profiles behave exactly as they did.
 *
 * Typed against `ProfileConfig` rather than accepting arbitrary keys, so a
 * renamed or deleted field is a TypeScript error instead of a silent no-op.
 */
export type ConfigPatch = DeepPartial<ProfileConfig>;

/**
 * A named bundle of settings for a particular use case.
 *
 * Built-in presets are defined in code rather than stored in app data on
 * purpose. Every migration in `appDataMigrations.ts` runs over stored config and
 * most of them blanket-assign defaults, so a built-in stored as data would have
 * the very settings it exists to set overwritten by a later migration. Keeping
 * them in code means they are always current and need no migration.
 */
export interface Preset {
  /**
   * Stable, kebab-case. Used for `data-testid`s, so treat it as part of the
   * public surface and don't reuse an id for a different preset.
   */
  id: string;

  name: string;

  /** One line, shown in the list and matched against the search box. */
  description: string;

  /** Why you'd reach for this. Shown in the confirmation dialog. */
  details: string;

  /** Extra search terms that don't appear in the name or description. */
  keywords?: string;

  /** Where it came from. Built-ins can't be renamed, edited or deleted. */
  source: 'built-in' | 'user';

  /**
   * What the preset covers. Derived from the patch for built-ins; stored for
   * user presets, because the user's intent needs to round-trip through the save
   * dialog even when a branch happens to hold nothing but defaults.
   */
  scope: PresetCategory[];

  patch: ConfigPatch;
}

/**
 * A built-in preset as authored in `presets.ts`. `source` and `scope` are filled
 * in by `toBuiltInPreset`, so a built-in's advertised scope can never disagree
 * with what its patch actually sets.
 */
export type BuiltInPresetDef = Omit<Preset, 'source' | 'scope'>;

/**
 * Branches no *built-in* preset may touch.
 *
 * This restriction is deliberately not applied to presets the user saves. Someone
 * who ticks "Display" on their own preset does want their colours in it, and a
 * profile carried over from an older version has to keep everything to behave as
 * it did. It only constrains what ships in the box.
 *
 * Enforced by `presets.spec.ts`.
 */
export const BUILT_IN_FORBIDDEN_BRANCHES: string[] = [
  // Baud rate, parity, transport — all device-specific.
  'settings.portSettings',
  // The log directory is an absolute path on this machine.
  'settings.logSettings',
  'settings.generalSettings',
  'settings.rulesSettings',
  'settings.graphingSettings',
  // A built-in has no business rewriting your macros, filters or drawer layout.
  'terminal.macroController',
  'terminal.filters',
  'terminal.rightDrawer',
];

/**
 * Individual paths no *built-in* preset may touch, where the branch as a whole is
 * fair game but specific fields aren't.
 *
 * Enforced by `presets.spec.ts`.
 */
export const BUILT_IN_FORBIDDEN_PATHS: string[] = [
  // The user's colour scheme is aesthetic, nothing to do with the task.
  'settings.displaySettings.defaultBackgroundColor',
  'settings.displaySettings.defaultTxTextColor',
  'settings.displaySettings.defaultRxTextColor',
  // Tooltip preferences are an accessibility choice.
  'settings.displaySettings.tooltipsEnabled',
  'settings.displaySettings.tooltipDelayMs',
];
