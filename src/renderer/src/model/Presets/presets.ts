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
  TxMode,
} from 'src/model/Settings/TxSettings/TxSettings';
import { TerminalFont, TerminalHeightMode } from 'src/model/Settings/DisplaySettings/DisplaySettings';

import { DisplaySettingsData } from 'src/model/AppDataManager/DataClasses/DisplaySettingsData';
import { RxSettingsData } from 'src/model/AppDataManager/DataClasses/RxSettingsData';
import { TxSettingsData } from 'src/model/AppDataManager/DataClasses/TxSettingsData';

import { BUILT_IN_FORBIDDEN_PATHS, BuiltInPresetDef, ConfigPatch, Preset } from './Preset';
import { deriveScope } from './PresetScope';

/**
 * The branches the "NinjaTerm defaults" preset restores, each paired with a
 * freshly-constructed defaults object for that branch.
 *
 * These three data classes are imported rather than the whole `ProfileConfig`
 * on purpose: `ProfileConfig` reaches into the Terminals module graph, which
 * imports back round to here, and the resulting cycle leaves it undefined at
 * the point this module builds its presets. Each of these only imports the
 * settings enums this file already uses.
 */
const DEFAULTS_PRESET_BRANCHES: ReadonlyArray<[string, () => object]> = [
  ['rxSettings', () => new RxSettingsData()],
  ['txSettings', () => new TxSettingsData()],
  ['displaySettings', () => new DisplaySettingsData()],
];

/**
 * Builds the patch for the "NinjaTerm defaults" preset from a fresh
 * `ProfileConfig`, rather than hand-authoring a hundred default values that
 * would silently rot the first time a default changed.
 *
 * Only the RX, TX and display branches are restored. Everything else is either
 * off-limits to a built-in (`BUILT_IN_FORBIDDEN_BRANCHES`) or is the user's own
 * data -- macros, highlight rules, filters, the log directory, the connection
 * settings. A preset that silently deleted those would be a trap, not a reset.
 * Colours and tooltip preferences are skipped for the same reason the other
 * built-ins skip them: they are taste and accessibility choices, not part of the
 * task.
 */
function buildDefaultsPatch(): ConfigPatch {
  const settings: Record<string, Record<string, unknown>> = {};

  for (const [branchName, makeDefaults] of DEFAULTS_PRESET_BRANCHES) {
    const branchPath = `settings.${branchName}`;
    const copied: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(makeDefaults())) {
      // Every field in these branches is a scalar today. A nested object would
      // need its own path handling to stay labelled, so skip rather than emit
      // a path the confirmation dialog can't name.
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        continue;
      }
      if (BUILT_IN_FORBIDDEN_PATHS.includes(`${branchPath}.${key}`)) {
        continue;
      }
      copied[key] = value;
    }

    settings[branchName] = copied;
  }

  return { settings } as ConfigPatch;
}

/**
 * The built-in presets, in the order they are listed in the UI.
 *
 * Each one sets only what its use case actually needs. Anything machine-,
 * device- or taste-specific (baud rate, serial port, log directory, colours) is
 * deliberately left alone — see `BUILT_IN_FORBIDDEN_BRANCHES` and
 * `BUILT_IN_FORBIDDEN_PATHS`, which `presets.spec.ts` enforces.
 */
const BUILT_IN_PRESET_DEFS: BuiltInPresetDef[] = [
  {
    id: 'dos-cp437',
    name: 'DOS text-mode (CP437)',
    description: 'Full-screen text-mode UIs that draw frames with box-drawing characters.',
    details:
      'For devices that render menus, frames and borders using the original IBM PC ' +
      'character set, one byte per character. Decodes received bytes as CP437, turns on ' +
      'ANSI escape code parsing so the device can position the cursor, and switches to a ' +
      'DOS font in an 80x25 terminal.',
    keywords: 'cp437 dos ibm pc box drawing frame border ansi tui menu vga',
    patch: {
      settings: {
        rxSettings: {
          dataType: DataType.ASCII,
          characterEncoding: CharacterEncoding.CP437,
          ansiEscapeCodeParsingEnabled: true,
          // A full-screen TUI is otherwise littered with glyph boxes for every
          // control byte it sends.
          nonVisibleCharDisplayBehavior: NonVisibleCharDisplayBehaviors.SWALLOW,
          // DOS programs commonly send a bare form feed to clear the screen.
          formFeedBehavior: FormFeedBehavior.CLEAR_SCREEN,
          // Timestamps are inserted as ordinary characters at the start of a
          // row, so they occupy columns the device doesn't know about and every
          // absolute cursor position lands that far to the left. A full-screen
          // UI that repaints in place can't work with them on.
          addTimestamps: false,
        },
        displaySettings: {
          terminalFont: TerminalFont.IBM_VGA,
          // IBM VGA is an 8x16 bitmap font, so it scales blurrily at the default 14px.
          charSizePx: 16,
          // Zero, not the default 5. The glyphs of a bitmap font fill their cell
          // exactly, so any row padding puts a gap between them and the vertical
          // strokes of a box-drawing frame stop joining up.
          verticalRowPaddingPx: 0,
          terminalWidthChars: 80,
          terminalHeightMode: TerminalHeightMode.FIXED_HEIGHT,
          terminalHeightChars: 25,
        },
      },
    },
  },
  {
    id: 'hex-dump',
    name: 'Hex dump',
    description: 'Show every received byte as a two-digit hex value.',
    details:
      'For inspecting a binary protocol byte by byte. Switches the terminal from text to ' +
      'numbers, formatted as zero-padded uppercase hex, one byte per value, so columns ' +
      'line up. Leaves your font and colours alone.',
    keywords: 'hex dump binary bytes protocol raw debug inspect',
    patch: {
      settings: {
        rxSettings: {
          dataType: DataType.NUMBER,
          numberType: NumberType.HEX,
          numBytesPerHexNumber: 1,
          hexCase: HexCase.UPPERCASE,
          prefixHexValuesWith0x: false,
          padValues: true,
          paddingCharacter: PaddingCharacter.ZERO,
          numPaddingChars: -1,
          numberSeparator: ' ',
          preventValuesWrappingAcrossRows: true,
          insertNewLineOnMatchedValue: false,
        },
      },
    },
  },
  {
    id: 'zephyr-shell',
    name: 'Zephyr / RTOS shell',
    description: 'Interactive shell over UART, with coloured log levels and line editing.',
    details:
      'For talking to an interactive shell on an embedded target. Turns on ANSI parsing ' +
      'for coloured log levels and cursor movement, decodes UTF-8, and turns local echo ' +
      'off because the shell echoes what you type. Enter sends CR, and the Delete key ' +
      'sends the VT sequence the shell expects.',
    keywords: 'zephyr rtos shell console uart embedded nuttx freertos repl prompt',
    patch: {
      settings: {
        rxSettings: {
          dataType: DataType.ASCII,
          characterEncoding: CharacterEncoding.UTF8,
          ansiEscapeCodeParsingEnabled: true,
          // The shell echoes typed characters back itself; local echo would double them.
          localTxEcho: false,
          newLineCursorBehavior: NewLineCursorBehavior.NEW_LINE,
          swallowNewLine: true,
          carriageReturnCursorBehavior: CarriageReturnCursorBehavior.CARRIAGE_RETURN,
          swallowCarriageReturn: true,
          backspaceBehavior: BackspaceBehavior.DELETE_CHAR,
        },
        txSettings: {
          enterKeyPressBehavior: EnterKeyPressBehavior.SEND_CR,
          backspaceKeyPressBehavior: BackspaceKeyPressBehavior.SEND_BACKSPACE,
          deleteKeyPressBehavior: DeleteKeyPressBehavior.SEND_VT_SEQUENCE,
          send0x01Thru0x1AWhenCtrlAThruZPressed: true,
        },
      },
    },
  },
  {
    id: 'line-mode',
    name: 'Line mode (SCPI instruments)',
    description: 'Compose a whole command and send it as a single write.',
    details:
      'For instruments that expect one complete command per message, SCPI over TCP being ' +
      'the common case. A bar appears below the terminal: type a command, press Enter, and ' +
      'the whole line is sent in one write instead of one write per keystroke. Local ' +
      'echo is turned on so you can see what you sent, since instruments do not echo, and ' +
      'ANSI parsing is turned off.',
    keywords: 'scpi instrument line mode tcp socket visa lxi command query idn one write segment',
    patch: {
      settings: {
        txSettings: {
          txMode: TxMode.LINE,
          // IEEE 488.2 terminates a message with LF; instruments that want CRLF
          // accept it too, but LF alone is the safer default.
          enterKeyPressBehavior: EnterKeyPressBehavior.SEND_LF,
        },
        rxSettings: {
          dataType: DataType.ASCII,
          // Instruments echo nothing back, so without this you never see what
          // you sent alongside the reply.
          localTxEcho: true,
          // Replies are plain ASCII; there are no escape sequences to interpret.
          ansiEscapeCodeParsingEnabled: false,
        },
      },
    },
  },
  {
    id: 'plain-text-log',
    name: 'Plain-text log capture',
    description: 'Long-running capture of human-readable output, with timestamps.',
    details:
      'For leaving a device running and reading back what it printed. Turns off ANSI ' +
      'parsing so escape sequences are not interpreted, stamps every line with an ISO 8601 ' +
      'timestamp, hides non-printable bytes, and keeps a much larger scrollback buffer.',
    keywords: 'log logging capture timestamp plain text soak long running',
    patch: {
      settings: {
        rxSettings: {
          dataType: DataType.ASCII,
          ansiEscapeCodeParsingEnabled: false,
          addTimestamps: true,
          timestampFormat: TimestampFormat.ISO8601_WITHOUT_TIMEZONE,
          nonVisibleCharDisplayBehavior: NonVisibleCharDisplayBehaviors.SWALLOW,
        },
        displaySettings: {
          scrollbackBufferSizeRows: 20000,
        },
      },
    },
  },
  {
    id: 'ninjaterm-default',
    name: 'NinjaTerm defaults',
    description: 'Put the RX, TX and display settings back to how they ship.',
    details:
      'For getting back to a known state after experimenting. Restores every RX, TX and ' +
      'display setting to its default. Your connection settings, macros, highlight rules, ' +
      'filters, logging and colour scheme are left exactly as they are -- this undoes ' +
      'settings changes, it does not delete anything you have made.',
    keywords: 'default defaults reset restore factory stock original start over clean revert',
    patch: buildDefaultsPatch(),
  },
];

/**
 * Scope is derived from the patch rather than authored, so what a built-in says
 * it covers can never drift from what it actually sets.
 */
export const BUILT_IN_PRESETS: Preset[] = BUILT_IN_PRESET_DEFS.map((def) => ({
  ...def,
  source: 'built-in' as const,
  scope: deriveScope(def.patch),
}));
