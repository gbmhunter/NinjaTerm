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

import { BuiltInPresetDef, Preset } from './Preset';
import { deriveScope } from './PresetScope';

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
