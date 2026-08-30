import { PortSettingsData } from 'src/model/AppDataManager/DataClasses/PortSettingsData';
import { ConnectionType, PortSettings } from 'src/model/Settings/PortSettings/PortSettings';
import { Preset } from './Preset';
import { ALL_PRESET_CATEGORIES, PRESET_CATEGORIES, PresetCategory, getAtPath } from './PresetScope';

/**
 * One row of the preset list, whether built in or saved by the user.
 *
 * The view renders rows without caring which kind it has, so that the two really
 * do read as one concept rather than two lists that happen to sit together.
 */
export interface PresetRow {
  /** Stable within a render. Built-ins use their id; saved ones their index. */
  key: string;
  /** Index into `appData.presets`, or null for a built-in. */
  storedIndex: number | null;
  preset: Preset;
  /** e.g. 'COM7 · 115200 8n1', or null when the connection isn't covered. */
  connectionSummary: string | null;
}

/**
 * A short human description of what a preset's connection settings amount to,
 * for the connection scope chip. Returns null when the preset doesn't cover the
 * connection at all.
 */
export function computeConnectionSummary(preset: Preset): string | null {
  if (!preset.scope.includes(PresetCategory.CONNECTION)) {
    return null;
  }
  const portSettings = getAtPath(preset.patch, 'settings.portSettings') as
    | PortSettingsData
    | undefined;
  if (portSettings === undefined) {
    return null;
  }

  const parts: string[] = [];
  if (portSettings.connectionType === ConnectionType.SERIAL_PORT) {
    const path = portSettings.lastUsedSerialPortPath;
    parts.push(path !== undefined && path !== '' ? path : 'no port');
    parts.push(
      PortSettings.computeShortSerialConfigName(
        portSettings.baudRate,
        portSettings.numDataBits,
        portSettings.parity,
        portSettings.stopBits,
      ),
    );
  } else if (portSettings.connectionType === ConnectionType.SOCKET) {
    parts.push(`${portSettings.socketHost}:${portSettings.socketPort}`);
  } else if (portSettings.connectionType === ConnectionType.RTT) {
    parts.push(`RTT ${portSettings.rttDevice}`);
  } else {
    parts.push('Bluetooth LE');
  }

  return parts.join(' · ');
}

/**
 * The chip labels for a preset's scope: what it covers, always stated
 * positively.
 *
 * Every included category is listed, with no cap — the chips wrap onto a second
 * line rather than hiding some behind a "+N", since a preset's scope is the one
 * thing on the row worth reading in full.
 *
 * The single exception is a preset that covers everything, which reads as one
 * word instead of twelve chips. That is still saying what is included, and it is
 * what every profile carried over from an older version looks like.
 *
 * Listed in display order rather than scope order, so two presets covering the
 * same categories always read the same way.
 *
 * @param preset The preset to describe.
 */
export function computeScopeChips(preset: Preset): { labels: string[] } {
  if (preset.scope.length >= ALL_PRESET_CATEGORIES.length) {
    return { labels: ['Everything'] };
  }
  return {
    labels: PRESET_CATEGORIES.filter((def) => preset.scope.includes(def.category)).map(
      (def) => def.label,
    ),
  };
}
