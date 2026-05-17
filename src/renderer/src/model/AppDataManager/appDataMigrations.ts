/**
 * Versioned migrations for the AppData blob stored in localStorage.
 *
 * Each migration is a small pure-ish function that mutates a deep-cloned copy
 * of the input. The chain is `migrate(unknown) -> AppData at LATEST_VERSION`.
 *
 * Why the types aren't full zod-per-version schemas:
 *
 * Migrations only ever touch a tiny slice of the full settings tree. What we
 * actually need is for `rootConfig.settings.foobar = ...` to be a compile
 * error when `foobar` is a typo, so the type system catches the bug class
 * the previous `(any) => any` chain hid.
 *
 * `MigrationAppData` (and its nested types) is therefore the *union of every
 * field name any migration has ever needed to read or write*, with everything
 * marked optional (a v3 blob doesn't carry the v8 fields, etc.). A typo on
 * the LHS of an assignment becomes a TS error because the field name isn't
 * in the type at all.
 *
 * For correctness past type-checking, the existing snapshot tests in
 * `local-storage-data/appData-vN-app-vX.Y.Z-default.json` drive each old
 * version through the chain and assert the result matches a fresh
 * `new AppData()`.
 */

import { ConnState, ConnectionType, PortSettings } from '../Settings/PortSettings/PortSettings';
import DisplaySettings, { TerminalHeightMode } from '../Settings/DisplaySettings/DisplaySettings';
import { TimestampFormat } from '../Settings/RxSettings/RxSettings';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_TX_COLOR, DEFAULT_RX_COLOR } from './DataClasses/DisplaySettingsData';
import { LATEST_VERSION } from './DataClasses/AppData';
import { makeDefaultHighlightRules } from './DataClasses/HighlightRuleData';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/** Last-used serial-port info embedded in a profile. Whole shape is replaced
 *  in v3->v4, kept loose. */
type MigrationLastUsedSerialPort = {
  path: string;
  portState: ConnState;
};

type MigrationPortSettings = {
  // v1->v2
  allowSettingsChangesWhenOpen?: boolean;
  // v7->v8 (removed)
  flowControl?: unknown;
  // v7->v8 (added)
  rtscts?: boolean;
  xon?: boolean;
  xoff?: boolean;
  xany?: boolean;
  hupcl?: boolean;
  // v9->v10
  connectionType?: ConnectionType;
  socketHost?: string;
  socketPort?: number;
  socketConnTimeoutMs?: number;
  // v14->v15
  rttDevice?: string;
  rttInterface?: string;
  rttSpeedKHz?: number;
  rttServerExePath?: string;
  rttJLinkSerialNumber?: string;
  rttChannel?: number;
  rttRecentDevices?: string[];
  // v15->v16
  rttServerExePathUserModified?: boolean;
};

type MigrationDisplaySettings = {
  // v1->v2
  terminalHeightMode?: TerminalHeightMode;
  terminalHeightChars?: number;
  // v2->v3
  defaultBackgroundColor?: string;
  defaultTxTextColor?: string;
  defaultRxTextColor?: string;
  tabStopWidth?: number;
  autoScrollLockOnTx?: boolean;
  // pre-v3 nested version field — deleted in v2->v3
  version?: number;
  // v10->v11
  tooltipsEnabled?: boolean;
  tooltipDelayMs?: number;
};

type MigrationRxSettings = {
  // v2->v3 (added)
  addTimestamps?: boolean;
  timestampFormat?: TimestampFormat;
  customTimestampFormatString?: string;
  // pre-v3 nested version — deleted in v2->v3
  version?: number;
};

type MigrationTxSettings = {
  // pre-v3 nested version — deleted in v2->v3
  version?: number;
  // v12->v13
  useCtrlCVForCopyPaste?: boolean;
  // v16->v17
  useCtrlFForFind?: boolean;
};

type MigrationGraphingSettings = {
  // v3->v4 (added wholesale)
  graphingEnabled?: boolean;
  processingTrigger?: string;
  maxBufferSize?: string;
  maxNumDataPoints?: string;
  xVarSource?: string;
  xVarPrefix?: string;
  yVarPrefix?: string;
  multipleValuesPerBuffer?: boolean;
  valueSeparator?: string;
  customValueSeparator?: string;
  clearPlotOnNewValues?: boolean;
  xAxisRangeMode?: string;
  xAxisRangeMin?: string;
  xAxisRangeMax?: string;
  yAxisRangeMode?: string;
  yAxisRangeMin?: string;
  yAxisRangeMax?: string;
  xVarUnit?: string;
  detectionMode?: string;
  // v5->v6 (renamed to processingTrigger)
  bufferDelimiter?: string;
};

type MigrationLogSettings = {
  // v8->v9 (added wholesale, fields below are added at the same time)
  logDirectory?: string | null;
  whatToNameTheFile?: number;
  customFileName?: string;
  existingFileBehavior?: number;
  logRawTxData?: boolean;
  logRawRxData?: boolean;
};

type MigrationSoundsSettings = {
  // v11->v12 (added wholesale)
  // Removed in v17->v18 when sounds were folded into highlight rules.
  playSoundsOnPassFail?: boolean;
};

type MigrationHighlightRule = {
  version?: number;
  name?: string;
  enabled?: boolean;
  pattern?: string;
  caseSensitive?: boolean;
  backgroundColor?: string;
  sound?: string;
  // Added in v17->v18 alongside the rest of the rule shape.
  scope?: string;
};

type MigrationRulesSettings = {
  // v17->v18 (added wholesale)
  rules?: MigrationHighlightRule[];
};

type MigrationSettings = {
  portSettings?: MigrationPortSettings;
  displaySettings?: MigrationDisplaySettings;
  rxSettings?: MigrationRxSettings;
  txSettings?: MigrationTxSettings;
  graphingSettings?: MigrationGraphingSettings;
  logSettings?: MigrationLogSettings;
  // Legacy field; removed in v17->v18. Kept in the migration type so the
  // delete step in `migrateV17toV18` is well-typed.
  soundsSettings?: MigrationSoundsSettings;
  rulesSettings?: MigrationRulesSettings;
};

type MigrationMacro = {
  // Auto-response triggers introduced in the unreleased v18 migration.
  // Optional because pre-v18 snapshots don't carry them.
  sendOnConnect?: boolean;
  sendOnRxMatch?: boolean;
  rxMatchPattern?: string;
  rxMatchCaseSensitive?: boolean;
  sendOnInterval?: boolean;
  intervalMs?: string;
  // Other macro fields exist on the runtime shape but the migration only
  // touches the auto-response fields, so they're not declared here.
};

type MigrationMacroController = {
  version?: number;
  macroConfigs?: MigrationMacro[];
};

type MigrationTerminal = {
  macroController?: MigrationMacroController;
  rightDrawer?: {
    flowControlIsExpanded?: boolean;
  };
};

/** Shape of a per-profile "rootConfig" (and equivalently of `currentAppConfig`)
 *  during migration. Every field is optional because old snapshots may not
 *  carry it and migrations may add it. */
export type MigrationRootConfig = {
  settings?: MigrationSettings;
  terminal?: MigrationTerminal;
  lastUsedSerialPort?: MigrationLastUsedSerialPort;
};

type MigrationProfile = {
  name?: string;
  rootConfig: MigrationRootConfig;
};

/** Top-level shape during migration. Same structure as the runtime `AppData`
 *  but every field optional, and migrations are written against this loose
 *  type. The exit-condition validation in `migrateAppData` checks the result
 *  is at the latest version before handing it back. */
export type MigrationAppData = {
  version: number;
  profiles: MigrationProfile[];
  currentAppConfig: MigrationRootConfig;
  // v3->v4
  autoUpdatesEnabled?: boolean;
  // v13->v14
  mcpEnabled?: boolean;
  mcpPort?: number;
};

// --------------------------------------------------------------------------
// Per-version migrations
//
// Each one mutates `appData` in place and is responsible for bumping the
// version field. They run in version order from `migrateAppData`. Every
// migration that touches per-profile fields applies the same change to both
// each `profiles[i].rootConfig` and `currentAppConfig` — the helper
// `forEachRootConfig` below avoids spelling that out 30 times.
// --------------------------------------------------------------------------

function forEachRootConfig(
  appData: MigrationAppData,
  apply: (rootConfig: MigrationRootConfig) => void,
): void {
  for (const profile of appData.profiles) {
    apply(profile.rootConfig);
  }
  apply(appData.currentAppConfig);
}

function migrateV1toV2(appData: MigrationAppData): void {
  // Port settings got a new field, display settings got two new fields
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.settings = rootConfig.settings ?? {};
    rootConfig.settings.portSettings = rootConfig.settings.portSettings ?? {};
    rootConfig.settings.portSettings.allowSettingsChangesWhenOpen = false;
    rootConfig.settings.displaySettings = rootConfig.settings.displaySettings ?? {};
    rootConfig.settings.displaySettings.terminalHeightMode = TerminalHeightMode.AUTO_HEIGHT;
    rootConfig.settings.displaySettings.terminalHeightChars = 25;
  });
  appData.version = 2;
}

function migrateV2toV3(appData: MigrationAppData): void {
  forEachRootConfig(appData, (rootConfig) => {
    const settings = (rootConfig.settings = rootConfig.settings ?? {});
    // Add timestamp settings
    settings.rxSettings = settings.rxSettings ?? {};
    settings.rxSettings.addTimestamps = false;
    settings.rxSettings.timestampFormat = TimestampFormat.ISO8601_WITHOUT_TIMEZONE;
    settings.rxSettings.customTimestampFormatString = 'YYYY-MM-DD HH:mm:ss.SSS ';
    // Display settings got new color fields
    settings.displaySettings = settings.displaySettings ?? {};
    settings.displaySettings.defaultBackgroundColor = DEFAULT_BACKGROUND_COLOR;
    settings.displaySettings.defaultTxTextColor = DEFAULT_TX_COLOR;
    settings.displaySettings.defaultRxTextColor = DEFAULT_RX_COLOR;
    // Tab stop width
    settings.displaySettings.tabStopWidth = 8;
    // autoScrollLockOnTx
    settings.displaySettings.autoScrollLockOnTx = true;

    // Drop now-redundant nested version fields — moved to a single
    // root-level version in v2.
    delete settings.rxSettings.version;
    delete settings.displaySettings.version;
    settings.txSettings = settings.txSettings ?? {};
    delete settings.txSettings.version;
    rootConfig.terminal = rootConfig.terminal ?? {};
    rootConfig.terminal.macroController = rootConfig.terminal.macroController ?? {};
    delete rootConfig.terminal.macroController.version;
  });
  appData.version = 3;
}

function migrateV3toV4(appData: MigrationAppData): void {
  // Add auto-updates setting at the app level (not per profile)
  appData.autoUpdatesEnabled = true;

  // We switched from Web Serial to node-serialport here. Path-as-id is the
  // new identity; reset any stored last-used port info (fine to lose).
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.lastUsedSerialPort = { path: '', portState: ConnState.CLOSED };
    // Add graphing settings to each profile (whole sub-object).
    rootConfig.settings = rootConfig.settings ?? {};
    rootConfig.settings.graphingSettings = {
      graphingEnabled: false,
      processingTrigger: 'LF (\\n)',
      maxBufferSize: '1000',
      maxNumDataPoints: '500',
      xVarSource: 'Received Time',
      xVarPrefix: 'x=',
      yVarPrefix: 'y=',
      multipleValuesPerBuffer: false,
      valueSeparator: 'Comma (,)',
      customValueSeparator: ',',
      clearPlotOnNewValues: true,
      xAxisRangeMode: 'Auto',
      xAxisRangeMin: '0',
      xAxisRangeMax: '100',
      yAxisRangeMode: 'Auto',
      yAxisRangeMin: '0',
      yAxisRangeMax: '100',
      xVarUnit: 's',
      detectionMode: 'Basic Prefix Mode',
    };
  });
  appData.version = 4;
}

function migrateV4toV5(appData: MigrationAppData): void {
  // Backfill detectionMode if a v3 blob landed here without it. Only walks
  // profiles (matches the original migration's behaviour, which omitted
  // currentAppConfig).
  for (const profile of appData.profiles) {
    const graphingSettings = profile.rootConfig.settings?.graphingSettings;
    if (graphingSettings && !graphingSettings.detectionMode) {
      graphingSettings.detectionMode = 'Basic Prefix Mode';
    }
  }
  appData.version = 5;
}

function migrateV5toV6(appData: MigrationAppData): void {
  // Rename `bufferDelimiter` -> `processingTrigger` in graphing settings.
  const renameOnRoot = (rootConfig: MigrationRootConfig) => {
    const graphingSettings = rootConfig.settings?.graphingSettings;
    if (graphingSettings && graphingSettings.bufferDelimiter !== undefined) {
      graphingSettings.processingTrigger = graphingSettings.bufferDelimiter;
      delete graphingSettings.bufferDelimiter;
    }
  };
  forEachRootConfig(appData, renameOnRoot);
  appData.version = 6;
}

function migrateV6toV7(appData: MigrationAppData): void {
  // Default the right-drawer flow-control accordion to expanded.
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.terminal = rootConfig.terminal ?? {};
    rootConfig.terminal.rightDrawer = rootConfig.terminal.rightDrawer ?? {};
    rootConfig.terminal.rightDrawer.flowControlIsExpanded = true;
  });
  appData.version = 7;
}

function migrateV7toV8(appData: MigrationAppData): void {
  // Replace single `flowControl` flag with the five granular options the
  // node-serialport API exposes.
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.settings = rootConfig.settings ?? {};
    rootConfig.settings.portSettings = rootConfig.settings.portSettings ?? {};
    const portSettings = rootConfig.settings.portSettings;
    if (portSettings.flowControl !== undefined) {
      delete portSettings.flowControl;
    }
    if (portSettings.rtscts === undefined) portSettings.rtscts = false;
    if (portSettings.xon === undefined) portSettings.xon = false;
    if (portSettings.xoff === undefined) portSettings.xoff = false;
    if (portSettings.xany === undefined) portSettings.xany = false;
    if (portSettings.hupcl === undefined) portSettings.hupcl = true;
  });
  appData.version = 8;
}

function migrateV8toV9(appData: MigrationAppData): void {
  // Add logSettings (whole sub-object).
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.settings = rootConfig.settings ?? {};
    rootConfig.settings.logSettings = {
      logDirectory: null, // No existing logDirectory to migrate from v8
      whatToNameTheFile: 0, // WhatToNameTheFile.CURRENT_DATETIME
      customFileName: 'custom-file-name.log',
      existingFileBehavior: 0, // ExistingFileBehaviors.APPEND
      logRawTxData: false,
      logRawRxData: true,
    };
  });
  appData.version = 9;
}

function migrateV9toV10(appData: MigrationAppData): void {
  // Add socket connection settings to portSettings.
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.settings = rootConfig.settings ?? {};
    rootConfig.settings.portSettings = rootConfig.settings.portSettings ?? {};
    rootConfig.settings.portSettings.connectionType = ConnectionType.SERIAL_PORT;
    rootConfig.settings.portSettings.socketHost = '127.0.0.1';
    rootConfig.settings.portSettings.socketPort = 5000;
    rootConfig.settings.portSettings.socketConnTimeoutMs = PortSettings.SOCKET_CONN_TIMEOUT_DEFAULT_MS;
  });
  appData.version = 10;
}

function migrateV10toV11(appData: MigrationAppData): void {
  // Add tooltip settings to displaySettings.
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.settings = rootConfig.settings ?? {};
    rootConfig.settings.displaySettings = rootConfig.settings.displaySettings ?? {};
    rootConfig.settings.displaySettings.tooltipsEnabled = DisplaySettings.DEFAULT_TOOLTIPS_ENABLED;
    rootConfig.settings.displaySettings.tooltipDelayMs = DisplaySettings.DEFAULT_TOOLTIP_DELAY_MS;
  });
  appData.version = 11;
}

function migrateV11toV12(appData: MigrationAppData): void {
  // Sound settings — first version, whole sub-object.
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.settings = rootConfig.settings ?? {};
    rootConfig.settings.soundsSettings = {
      playSoundsOnPassFail: false,
    };
  });
  appData.version = 12;
}

function migrateV12toV13(appData: MigrationAppData): void {
  // Add useCtrlCVForCopyPaste to txSettings.
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.settings = rootConfig.settings ?? {};
    rootConfig.settings.txSettings = rootConfig.settings.txSettings ?? {};
    rootConfig.settings.txSettings.useCtrlCVForCopyPaste = true;
  });
  appData.version = 13;
}

function migrateV13toV14(appData: MigrationAppData): void {
  // MCP server settings at the app level.
  appData.mcpEnabled = false;
  appData.mcpPort = 3579;
  appData.version = 14;
}

function migrateV14toV15(appData: MigrationAppData): void {
  // Segger RTT settings to portSettings.
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.settings = rootConfig.settings ?? {};
    rootConfig.settings.portSettings = rootConfig.settings.portSettings ?? {};
    rootConfig.settings.portSettings.rttDevice = '';
    rootConfig.settings.portSettings.rttInterface = 'SWD';
    rootConfig.settings.portSettings.rttSpeedKHz = 4000;
    rootConfig.settings.portSettings.rttServerExePath = '';
    rootConfig.settings.portSettings.rttJLinkSerialNumber = '';
    rootConfig.settings.portSettings.rttChannel = 0;
    rootConfig.settings.portSettings.rttRecentDevices = [];
  });
  appData.version = 15;
}

function migrateV15toV16(appData: MigrationAppData): void {
  // Track whether the user has explicitly modified the J-Link Commander path
  // so the RTT pane's auto-detect on first navigation never overwrites a
  // deliberate change.
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.settings = rootConfig.settings ?? {};
    rootConfig.settings.portSettings = rootConfig.settings.portSettings ?? {};
    rootConfig.settings.portSettings.rttServerExePathUserModified = false;
  });
  appData.version = 16;
}

function migrateV16toV17(appData: MigrationAppData): void {
  // Default the new Ctrl+F → Find toggle to true so existing users get the
  // Find shortcut. Users who want raw Ctrl+F passthrough (sends 0x06 / ACK)
  // can opt out in TX Settings.
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.settings = rootConfig.settings ?? {};
    rootConfig.settings.txSettings = rootConfig.settings.txSettings ?? {};
    rootConfig.settings.txSettings.useCtrlFForFind = true;
  });
  appData.version = 17;
}

function migrateV17toV18(appData: MigrationAppData): void {
  // (1) Replace the legacy `soundsSettings` (a single `playSoundsOnPassFail`
  // toggle hardcoded to literal "pass" / "fail" matches) with the new
  // `rulesSettings` highlight-rules system. Per design we do NOT carry the
  // old toggle forward, but we DO seed two starter rules
  // (Warning / Error — see `makeDefaultHighlightRules`) so existing users
  // get useful highlighting out of the box. Fresh installs get the same
  // defaults via `RulesSettingsData`'s field initializer.
  //
  // (2) Seed defaults for the auto-response macro fields (issue #364) on
  // every existing macro config. `MacroData.loadConfig` also has `??`
  // fallbacks, but explicit seeding keeps the on-disk shape uniform.
  forEachRootConfig(appData, (rootConfig) => {
    rootConfig.settings = rootConfig.settings ?? {};
    delete rootConfig.settings.soundsSettings;
    rootConfig.settings.rulesSettings = { rules: makeDefaultHighlightRules() };

    const macroConfigs = rootConfig.terminal?.macroController?.macroConfigs;
    if (macroConfigs !== undefined) {
      for (const macroConfig of macroConfigs) {
        macroConfig.sendOnConnect = macroConfig.sendOnConnect ?? false;
        macroConfig.sendOnRxMatch = macroConfig.sendOnRxMatch ?? false;
        macroConfig.rxMatchPattern = macroConfig.rxMatchPattern ?? '';
        macroConfig.rxMatchCaseSensitive = macroConfig.rxMatchCaseSensitive ?? false;
        macroConfig.sendOnInterval = macroConfig.sendOnInterval ?? false;
        macroConfig.intervalMs = macroConfig.intervalMs ?? '1000';
      }
    }
  });
  appData.version = 18;
}

/**
 * Ordered table of migrations. Each entry knows the version it consumes; the
 * loop in `migrateAppData` runs them in order while the data's version is
 * less than the latest. Adding a new migration is one row here plus its
 * function definition above.
 */
const MIGRATIONS: ReadonlyArray<{ from: number; apply: (appData: MigrationAppData) => void }> = [
  { from: 1, apply: migrateV1toV2 },
  { from: 2, apply: migrateV2toV3 },
  { from: 3, apply: migrateV3toV4 },
  { from: 4, apply: migrateV4toV5 },
  { from: 5, apply: migrateV5toV6 },
  { from: 6, apply: migrateV6toV7 },
  { from: 7, apply: migrateV7toV8 },
  { from: 8, apply: migrateV8toV9 },
  { from: 9, apply: migrateV9toV10 },
  { from: 10, apply: migrateV10toV11 },
  { from: 11, apply: migrateV11toV12 },
  { from: 12, apply: migrateV12toV13 },
  { from: 13, apply: migrateV13toV14 },
  { from: 14, apply: migrateV14toV15 },
  { from: 15, apply: migrateV15toV16 },
  { from: 16, apply: migrateV16toV17 },
  { from: 17, apply: migrateV17toV18 },
];

// --------------------------------------------------------------------------
// Public entry point
// --------------------------------------------------------------------------

/**
 * Drive `input` through every applicable migration step. The input is
 * deep-cloned first; the original is not mutated.
 *
 * Returns `unknownVersion: true` if the input's version is something we
 * don't know how to migrate — caller decides whether to fall back to a
 * default `AppData()`.
 */
export function migrateAppData(input: unknown): {
  appData: MigrationAppData;
  wasChanged: boolean;
  unknownVersion: boolean;
} {
  // Deep-clone via JSON to detach from any class/observable wrappers in the
  // input and from external mutation while migration runs.
  const appData = JSON.parse(JSON.stringify(input)) as MigrationAppData;
  const startVersion = appData.version;

  for (const migration of MIGRATIONS) {
    if (appData.version === migration.from) {
      migration.apply(appData);
    }
  }

  const unknownVersion = appData.version !== LATEST_VERSION;
  return {
    appData,
    wasChanged: !unknownVersion && startVersion !== LATEST_VERSION,
    unknownVersion,
  };
}
