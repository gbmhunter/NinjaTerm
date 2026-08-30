import {
  BackspaceBehavior,
  CarriageReturnCursorBehavior,
  CharacterEncoding,
  DataType,
  FormFeedBehavior,
  HexCase,
  NewLineCursorBehavior,
  NonVisibleCharDisplayBehaviors,
  NumberType,
  PaddingCharacter,
  TimestampFormat,
} from 'src/model/Settings/RxSettings/RxSettings';
import {
  BackspaceKeyPressBehavior,
  DeleteKeyPressBehavior,
  EnterKeyPressBehavior,
} from 'src/model/Settings/TxSettings/TxSettings';
import { TerminalFont, TerminalHeightMode } from 'src/model/Settings/DisplaySettings/DisplaySettings';
import { PRESET_CATEGORIES } from './PresetScope';

/**
 * Human-readable labels for the settings a preset can change, keyed by dotted
 * path into the settings data.
 *
 * Only paths some preset actually touches need an entry. `presets.spec.ts`
 * asserts that every path used by every preset is listed here, so a new preset
 * setting a new field fails the build rather than showing a raw path like
 * "rxSettings.characterEncoding" in the confirmation dialog.
 */
export const PRESET_FIELD_LABELS: Record<string, string> = {
  'settings.rxSettings.dataType': 'RX › Data type',
  'settings.rxSettings.characterEncoding': 'RX › Character encoding',
  'settings.rxSettings.ansiEscapeCodeParsingEnabled': 'RX › ANSI escape code parsing',
  'settings.rxSettings.nonVisibleCharDisplayBehavior': 'RX › Non-visible characters',
  'settings.rxSettings.formFeedBehavior': 'RX › Form feed',
  'settings.rxSettings.localTxEcho': 'RX › Local TX echo',
  'settings.rxSettings.newLineCursorBehavior': 'RX › On new line byte',
  'settings.rxSettings.swallowNewLine': 'RX › Swallow new line bytes',
  'settings.rxSettings.carriageReturnCursorBehavior': 'RX › On carriage return byte',
  'settings.rxSettings.swallowCarriageReturn': 'RX › Swallow carriage return bytes',
  'settings.rxSettings.backspaceBehavior': 'RX › Backspace',
  'settings.rxSettings.addTimestamps': 'RX › Add timestamps',
  'settings.rxSettings.timestampFormat': 'RX › Timestamp format',
  'settings.rxSettings.numberType': 'RX › Number type',
  'settings.rxSettings.numBytesPerHexNumber': 'RX › Bytes per hex number',
  'settings.rxSettings.hexCase': 'RX › Hex case',
  'settings.rxSettings.prefixHexValuesWith0x': 'RX › Prefix hex with 0x',
  'settings.rxSettings.padValues': 'RX › Pad values',
  'settings.rxSettings.paddingCharacter': 'RX › Padding character',
  'settings.rxSettings.numPaddingChars': 'RX › Number of padding characters',
  'settings.rxSettings.numberSeparator': 'RX › Separator between values',
  'settings.rxSettings.preventValuesWrappingAcrossRows': 'RX › Prevent values wrapping across rows',
  'settings.rxSettings.insertNewLineOnMatchedValue': 'RX › Insert new line on value',

  'settings.txSettings.enterKeyPressBehavior': 'TX › Enter key',
  'settings.txSettings.backspaceKeyPressBehavior': 'TX › Backspace key',
  'settings.txSettings.deleteKeyPressBehavior': 'TX › Delete key',
  'settings.txSettings.send0x01Thru0x1AWhenCtrlAThruZPressed': 'TX › Send 0x01-0x1A for Ctrl+A-Z',

  'settings.displaySettings.terminalFont': 'Display › Terminal font',
  'settings.displaySettings.charSizePx': 'Display › Character size',
  'settings.displaySettings.verticalRowPaddingPx': 'Display › Vertical row padding',
  'settings.displaySettings.terminalWidthChars': 'Display › Terminal width',
  'settings.displaySettings.terminalHeightMode': 'Display › Terminal height mode',
  'settings.displaySettings.terminalHeightChars': 'Display › Terminal height',
  'settings.displaySettings.scrollbackBufferSizeRows': 'Display › Scrollback buffer size',
};

/**
 * The enum backing each settings path, for paths whose values are enums.
 *
 * Needed because TypeScript's numeric enums store integers, so a diff would
 * otherwise show "Non-visible characters: 1 → 0" instead of naming the values.
 */
const PRESET_FIELD_ENUMS: Record<string, object> = {
  'settings.rxSettings.dataType': DataType,
  'settings.rxSettings.characterEncoding': CharacterEncoding,
  'settings.rxSettings.nonVisibleCharDisplayBehavior': NonVisibleCharDisplayBehaviors,
  'settings.rxSettings.formFeedBehavior': FormFeedBehavior,
  'settings.rxSettings.newLineCursorBehavior': NewLineCursorBehavior,
  'settings.rxSettings.carriageReturnCursorBehavior': CarriageReturnCursorBehavior,
  'settings.rxSettings.backspaceBehavior': BackspaceBehavior,
  'settings.rxSettings.timestampFormat': TimestampFormat,
  'settings.rxSettings.numberType': NumberType,
  'settings.rxSettings.hexCase': HexCase,
  'settings.rxSettings.paddingCharacter': PaddingCharacter,
  'settings.txSettings.enterKeyPressBehavior': EnterKeyPressBehavior,
  'settings.txSettings.backspaceKeyPressBehavior': BackspaceKeyPressBehavior,
  'settings.txSettings.deleteKeyPressBehavior': DeleteKeyPressBehavior,
  'settings.displaySettings.terminalFont': TerminalFont,
  'settings.displaySettings.terminalHeightMode': TerminalHeightMode,
};

/** "ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS" -> "Ascii control glyphs and hex glyphs" */
function humaniseEnumMemberName(name: string): string {
  const withSpaces = name.toLowerCase().replace(/_/g, ' ');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

/** "logDirectory" -> "Log directory", "rttRecentDevices" -> "Rtt recent devices" */
function humaniseFieldName(name: string): string {
  const withSpaces = name.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

/**
 * A readable label for any settings path.
 *
 * Explicit entries in `PRESET_FIELD_LABELS` win. Everything else falls back to
 * the owning category's name plus a humanised field name, because a preset the
 * user saved can cover any branch at all — showing a raw path like
 * "terminal.macroController.macroConfigs" in the confirmation dialog is no use
 * to anybody.
 */
export function labelForPath(path: string): string {
  const explicit = PRESET_FIELD_LABELS[path];
  if (explicit !== undefined) {
    return explicit;
  }

  const segments = path.split('.');
  const branch = segments.slice(0, 2).join('.');
  const categoryDefinition = PRESET_CATEGORIES.find((def) =>
    (def.branches as string[]).includes(branch),
  );
  const remainder = segments.slice(2);
  const fieldLabel =
    remainder.length === 0 ? 'All settings' : humaniseFieldName(remainder[remainder.length - 1]);

  if (categoryDefinition === undefined) {
    return fieldLabel;
  }
  return `${categoryDefinition.label} › ${fieldLabel}`;
}

/**
 * Formats a settings value for the confirmation dialog's before/after columns.
 *
 * @param path Dotted path into the config, used to find the value's enum.
 * @param value The value to format.
 */
export function formatSettingValue(path: string, value: unknown): string {
  if (value === undefined || value === null) {
    return 'Not set';
  }

  if (typeof value === 'boolean') {
    return value ? 'On' : 'Off';
  }

  // A whole list or sub-object, which is what a preset covering macros, filters
  // or highlight rules carries. Stringifying these gives "[object Object]", so
  // describe them by size instead.
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'None';
    }
    return value.length === 1 ? '1 item' : `${value.length} items`;
  }
  if (typeof value === 'object') {
    const numKeys = Object.keys(value as object).length;
    return numKeys === 1 ? '1 setting' : `${numKeys} settings`;
  }

  const enumObj = PRESET_FIELD_ENUMS[path];
  if (enumObj !== undefined) {
    // Numeric enums support reverse lookup (member name from value); string
    // enums don't, and their values are already human-readable.
    const memberName = (enumObj as Record<string, unknown>)[String(value)];
    if (typeof memberName === 'string') {
      return humaniseEnumMemberName(memberName);
    }
    return String(value);
  }

  if (typeof value === 'string') {
    if (value === '') {
      return 'Empty';
    }
    // Quote strings so a meaningful space (e.g. the number separator) is visible.
    return `"${value}"`;
  }

  return String(value);
}
