import { makeAutoObservable } from 'mobx';

import { App, MainPanes } from 'src/model/App';
import { PortType } from '@/model/ConnController/ConnController';
import { ConnState } from 'src/model/Settings/PortSettings/PortSettings';
import { CharacterEncoding, DataType, NewLineCursorBehavior, NonVisibleCharDisplayBehaviors, NumberType, PaddingCharacter } from 'src/model/Settings/RxSettings/RxSettings';
import { generateRandomString } from 'src/model/Util/Util';
import { DetectionMode } from '../Graphing/Graphing';

class FakePort {
  name: string;
  description: string;
  intervalId: NodeJS.Timeout | null;
  connectFunction: () => NodeJS.Timeout | null;
  disconnectFunction: (intervalId: NodeJS.Timeout | null) => void;

  constructor(name: string, description: string, connectFunction: () => NodeJS.Timeout | null, disconnectFunction: (intervalId: NodeJS.Timeout | null) => void) {
    this.name = name;
    this.description = description;
    this.intervalId = null;
    this.connectFunction = connectFunction;
    this.disconnectFunction = disconnectFunction;
    makeAutoObservable(this);
  }

  connect() {
    this.intervalId = this.connectFunction();
  }

  disconnect() {
    this.disconnectFunction(this.intervalId);
  }
}

export default class FakePortsController {
  app: App;

  isDialogOpen = false;

  fakePorts: FakePort[] = [];

  selFakePortIdx = 0;

  fakePortOpen = false;

  /**
   * Free-text filter applied to the fake port list in the selection dialog.
   * Matches against both the name and description (case-insensitive).
   */
  searchText = '';

  constructor(app: App) {
    this.app = app;

    //=================================================================================
    // silent (no data)
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'silent (no data)',
        'Opens a connection but never sends any data. Useful for testing TX features such as local echo and ' +
          'backspace handling without any incoming RX data getting in the way — just open it, type, and watch the echo.',
        () => {
          // Nothing to schedule; there is no data to emit. Returning null means
          // there is no interval for the disconnect handler to clear.
          return null;
        },
        (_intervalId: NodeJS.Timeout | null) => {
          // No interval was created, so there is nothing to tear down.
        }
      )
    );

    //=================================================================================
    // hello world, 0.1lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'hello world, 0.1lps',
        'Sends "Hello, world!\\n" every 10 seconds.',
        () => {
          const intervalId = setInterval(() => {
            const textToSend = 'Hello, world!\n';
            const bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));
          }, 10000);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // hello world, 1lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'hello world, 1lps',
        'Sends "Hello, world!\\n" every 1 second.',
        () => {
          const intervalId = setInterval(() => {
            const textToSend = 'Hello, world!\n';
            const bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));
          }, 1000);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // hello world, 5lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'hello world, 5lps',
        'Sends "Hello, world!\\n" every 200ms.',
        () => {
          const intervalId = setInterval(() => {
            const textToSend = 'Hello, world!\n';
            const bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));
          }, 200);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // hello world, 10lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'hello world, 10lps',
        'Sends "Hello, world!\\n" every 100ms.',
        () => {
          const intervalId = setInterval(() => {
            const textToSend = 'Hello, world!\n';
            const bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));
          }, 100);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // hello world, 20lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'hello world, 20lps',
        'Sends 20 "Hello, world!\\n"s every second.',
        () => {
          const intervalId = setInterval(() => {
            for (let i = 0; i < 20; i++) {
              const textToSend = 'Hello, world!\n';
              const bytesToSend = [];
              for (let i = 0; i < textToSend.length; i++) {
                bytesToSend.push(textToSend.charCodeAt(i));
              }
              app.parseRxData(Uint8Array.from(bytesToSend));
            }
          }, 1000);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // 200 numbered lines all at once
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        '200 numbered lines all at once',
        'Sends "0\\n1\\n ..." to 199 (200 numbers) all at once. Useful for testing scroll behaviour.',
        () => {
          for (let i = 0; i < 200; i++) {
            const textToSend = `${i}\n`;
            const bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));
          }
          return null;
        },
        (_intervalId: NodeJS.Timeout | null) => {
          // Do nothing
        }
      )
    );

    //=================================================================================
    // pass/fail alternating, 0.2items/s (for testing sound functionality)
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'pass/fail alternating, 0.5items/s',
        'Alternates between "pass" and "fail" every 2 seconds. Useful for testing sound notifications.',
        () => {
          let stringIdx = 0;
          const strings = ['pass\n', 'fail\n'];
          const intervalId = setInterval(() => {
            const textToSend = strings[stringIdx];
            const bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));

            stringIdx += 1;
            if (stringIdx === strings.length) {
              stringIdx = 0;
            }
          }, 2000);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // highlight rules demo — mix of info/warning/error, short and very long
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'highlight rules demo: info/warning/error mix, ~1.4lps',
        'Emits a randomised mix of info, warning, and error log lines roughly once a second. Includes some very long lines (200+ chars) that wrap in the terminal so you can verify the highlight rule renders correctly across wrapped row segments. Pair with the default Warning + Error rules.',
        () => {
          const shortInfo = [
            'INFO: heartbeat ok',
            'INFO: telemetry batch sent',
            'INFO: configuration loaded from flash',
            'SENSOR: temp=23.5C humidity=45%',
            'BLE: client polling for new records',
            'STORAGE: flushed 4 records to NVS',
            'NET: keepalive 200 ok',
            'ADC: battery voltage 3.85V',
          ];
          const shortWarning = [
            'WARNING: low memory, 1024 bytes free',
            'WARNING: signal strength low (-85 dBm)',
            'WARNING: retry attempt 3 of 5 on uplink',
            'WARNING: i2c bus 1 jitter detected',
            'WARNING: clock drift exceeded 50ppm',
          ];
          const shortError = [
            'ERROR: failed to write to flash sector 0x12',
            'ERROR: i2c timeout on bus 1',
            'ERROR: device disconnected unexpectedly',
            'ERROR: assertion failed at main.c:142',
            'ERROR: stack overflow in worker task',
          ];
          // Long lines (~250 chars) so they wrap at typical terminal widths.
          // Useful to confirm the highlight rule still paints the matched
          // word even when the line spans several rendered rows.
          const longInfo = [
            'INFO: telemetry batch dump: ' + 'sample=42 '.repeat(25) + '— end of batch',
            'INFO: configuration dump: ' + 'param=value '.repeat(20) + '— done',
          ];
          const longWarning = [
            'WARNING: degraded performance on subsystem A — diagnostic trail: ' + 'step=ok '.repeat(30) + '— continuing in fallback mode',
            'WARNING: prolonged sensor calibration anomaly: ' + 'delta=+0.03 '.repeat(20) + '— flagging next cycle for re-calibration',
          ];
          const longError = [
            'ERROR: critical fault in subsystem B with diagnostic trace: ' + 'frame@0xDEAD '.repeat(20) + '— scheduling reboot',
            'ERROR: unhandled exception during packet reassembly: ' + 'byte=0xFF '.repeat(25) + '— dropping connection',
          ];
          // Pool weights: info appears ~3x, warning/error 1x each, long
          // variants 1x each — keeps the stream readable while still
          // hitting every code path.
          const pools = [shortInfo, shortInfo, shortInfo, shortWarning, shortError, longInfo, longWarning, longError];
          const pickLine = () => {
            const pool = pools[Math.floor(Math.random() * pools.length)];
            return pool[Math.floor(Math.random() * pool.length)] + '\n';
          };
          const intervalId = setInterval(() => {
            app.parseRxData(new TextEncoder().encode(pickLine()));
          }, 700);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // red green, 0.2lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'red green, 0.2items/s',
        'Sends red and green colored text every 5 seconds.',
        () => {
          let stringIdx = 0;
          const strings = ['\x1b[31mred', '\x1b[32mgreen'];
          const intervalId = setInterval(() => {
            const textToSend = strings[stringIdx];
            const bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));

            stringIdx += 1;
            if (stringIdx === strings.length) {
              stringIdx = 0;
            }
          }, 5000);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // all colors, 5cps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'all colors, 5items/s',
        'Iterates through all possible ANSI foreground and background colors at 5 items per second.',
        () => {
          let stringIdx = 0;
          const strings = [
            // STANDARD FOREGROUNDS
            // Reset all styles
            '\x1B[0m\x1B[30mnormal black',
            '\x1B[31mnormal red',
            '\x1B[32mnormal green',
            '\x1B[33mnormal brown/yellow',
            '\x1B[34mnormal blue',
            '\x1B[35mnormal magenta',
            '\x1B[36mnormal cyan',
            '\x1B[37mnormal grey',

            // BOLD FOREGROUNDS
            // This may give either bold text or bright colors
            // depending on terminal implementation
            '\x1B[1m\x1B[30mbold black',
            '\x1B[31mbold red',
            '\x1B[32mbold green',
            '\x1B[33mbold brown/yellow',
            '\x1B[34mbold blue',
            '\x1B[35mbold magenta',
            '\x1B[36mbold cyan',
            '\x1B[37mbold grey',

            // BRIGHT FOREGROUNDS
            '\x1B[0m\x1B[90mbright black',
            '\x1B[91mbright red',
            '\x1B[92mbright green',
            '\x1B[93mbright brown/yellow',
            '\x1B[94mbright blue',
            '\x1B[95mbright magenta',
            '\x1B[96mbright cyan',
            '\x1B[97mbright white',

            // STANDARD BACKGROUNDS
            // Reset all styles
            // For the lighter backgrounds, the text color is changed
            // to black
            '\x1B[0m\x1B[40mblack bg',
            '\x1B[41mred bg',
            '\x1B[42mgreen bg',
            '\x1B[43mbrown/yellow bg',
            '\x1B[44mblue bg',
            '\x1B[45mmagenta bg',
            '\x1B[46mcyan bg',
            '\x1B[47m;30mwhite bg',

            // BOLD BACKGROUNDS
            // Set to bold mode
            // This may give either bold text or bright colors
            // depending on terminal implementation
            // NinjaTerm just makes it bright
            '\x1B[1m\x1B[40mbold black bg',
            '\x1B[41;30mbold red bg',
            '\x1B[42;30mbold green bg',
            '\x1B[43;30mbold yellow bg',
            '\x1B[44;37mbold blue bg',
            '\x1B[45mbold magenta bg',
            '\x1B[46mbold cyan bg',
            '\x1B[47;30mbold white bg',

            // BRIGHT BACKGROUNDS
            '\x1B[0m\x1B[100mbright black bg',
            '\x1B[101;30mbright red bg',
            '\x1B[102;30mbright green bg',
            '\x1B[103;30mbright brown/yellow bg',
            '\x1B[104mbright blue bg',
            '\x1B[105mbright magenta bg',
            '\x1B[106mbright cyan bg',
            '\x1B[107;30mbright white bg',
          ];
          const intervalId = setInterval(() => {
            const textToSend = strings[stringIdx];
            const bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));

            stringIdx += 1;
            if (stringIdx === strings.length) {
              stringIdx = 0;
            }
          }, 200);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // erase in display, clear from start of screen to cursor (ESC[1J)
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'erase in display, clear from start of screen to cursor (ESC[1J) test',
        'Sends data and then ESC[1J to clear from the start of screen to the cursor.',
        () => {
          let sendIdx = 0;

          const intervalId = setInterval(() => {
            const textToSend = sendIdx < 50 ? `Line ${sendIdx}\n` : '\x1b[1J';
            const bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));

            sendIdx += 1;
            if (sendIdx === 51) {
              sendIdx = 0;
            }
          }, 200);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // erase in display, clear entire screen slow test
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'erase in display, clear entire screen test',
        'Sends data and then ESC[2J to clear the entire screen.',
        () => {
          let sendIdx = 0;

          const intervalId = setInterval(() => {
            let textToSend = '';
            if (sendIdx < 50) {
              textToSend = `Line ${sendIdx}\n`;
            } else {
              textToSend = '\x1b[2J';
            }
            const bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));

            sendIdx += 1;
            if (sendIdx === 51) {
              sendIdx = 0;
            }
          }, 200);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // erase in display, clear entire screen all at once test
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'erase in display, clear entire screen all at once test',
        'Sends data and then ESC[2J to clear the entire screen.',
        () => {
          let textToSend = '';
          for (let i = 0; i < 50; i++) {
            textToSend += `Line ${i}\n`;
          }
          textToSend += '\x1b[2J';

          const bytesToSend = [];
          for (let i = 0; i < textToSend.length; i++) {
            bytesToSend.push(textToSend.charCodeAt(i));
          }
          app.parseRxData(Uint8Array.from(bytesToSend));

          return null;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // unsupported/unknown escape codes (for testing "Show Unknown Escape Codes")
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'unsupported escape codes, ~0.7lps',
        'Sends a rotating set of CSI escape sequences that NinjaTerm does not support (erase line, DSR, show/hide cursor, save/restore cursor, italic/underline/inverse, 256-colour and true-colour SGR). Enables ANSI parsing and the RX "Show Unknown Escape Codes" setting so each unsupported sequence is surfaced inline as a highlighted marker.',
        () => {
          app.settings.rxSettings.setAnsiEscapeCodeParsingEnabled(true);
          app.settings.rxSettings.setShowUnknownEscapeCodes(true);
          // The longest demo sequence (true-colour SGR) is 15 chars, which the
          // default limit covers, but pin it anyway so the demo still works if
          // the user has lowered their own limit.
          app.settings.rxSettings.maxEscapeCodeLengthChars.setDispValue('25');
          app.settings.rxSettings.maxEscapeCodeLengthChars.apply();

          // Each line is a human-readable label followed by the raw, unsupported
          // escape sequence — the sequence itself is what gets surfaced.
          const strings = [
            'EL erase line (ESC[K): \x1b[K',
            'EL erase line n=2 (ESC[2K): \x1b[2K',
            'DSR device status report (ESC[6n): \x1b[6n',
            'show cursor (ESC[?25h): \x1b[?25h',
            'hide cursor (ESC[?25l): \x1b[?25l',
            'SCP save cursor (ESC[s): \x1b[s',
            'RCP restore cursor (ESC[u): \x1b[u',
            'SGR italic (ESC[3m): \x1b[3mitalic?\x1b[0m',
            'SGR underline (ESC[4m): \x1b[4munderline?\x1b[0m',
            'SGR inverse (ESC[7m): \x1b[7minverse?\x1b[0m',
            'SGR 256-colour fg (ESC[38;5;82m): \x1b[38;5;82mgreen?\x1b[0m',
            'SGR true-colour fg (ESC[38;2;0;200;0m): \x1b[38;2;0;200;0mgreen?\x1b[0m',
          ];
          let stringIdx = 0;
          const intervalId = setInterval(() => {
            const textToSend = strings[stringIdx] + '\n';
            app.parseRxData(new TextEncoder().encode(textToSend));
            stringIdx += 1;
            if (stringIdx === strings.length) {
              stringIdx = 0;
            }
          }, 1500);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // text-mode dashboard (for testing CUP cursor positioning)
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'text-mode dashboard, 2 updates/s',
        'Draws a CP437 box-drawing framed dashboard once, then uses CUP (ESC[row;colH) to repaint just the value fields in place, twice a second. Enables ANSI parsing and CP437 decoding. Exercises absolute cursor positioning the way a full-screen DOS text-mode UI would. Pair with a DOS terminal font in Settings > Display for the authentic look.',
        () => {
          app.settings.rxSettings.setAnsiEscapeCodeParsingEnabled(true);
          // The frame is drawn with raw CP437 bytes, exactly as a DOS-style
          // device would send them, so the terminal has to be decoding CP437 for
          // them to come out as box-drawing characters rather than hex glyphs.
          app.settings.rxSettings.setCharacterEncoding(CharacterEncoding.CP437);
          // Timestamps are inserted as ordinary characters at the start of a
          // row, so they take up columns this demo doesn't know about and every
          // ESC[row;colH lands that far to the left, painting values into the
          // middle of the timestamp instead of into the frame.
          app.settings.rxSettings.setAddTimestamps(false);

          // Send raw bytes rather than TextEncoder-ing a string: every byte here
          // is one character on the wire, which is the whole point of CP437.
          const send = (bytes: number[]) => {
            app.parseRxData(Uint8Array.from(bytes));
          };
          // ASCII text -> bytes, for the labels.
          const ascii = (text: string) => Array.from(text, (char) => char.charCodeAt(0));
          // CP437 box-drawing bytes.
          const TOP_LEFT = 0xda;
          const TOP_RIGHT = 0xbf;
          const BOTTOM_LEFT = 0xc0;
          const BOTTOM_RIGHT = 0xd9;
          const HORIZONTAL = 0xc4;
          const VERTICAL = 0xb3;
          const TEE_LEFT = 0xc3;
          const TEE_RIGHT = 0xb4;
          const INNER_WIDTH = 28;
          const horizontalRun = new Array(INNER_WIDTH).fill(HORIZONTAL);
          // A row of the frame: an edge byte, padded content, an edge byte.
          const framedRow = (left: number, content: string, right: number) => [
            left,
            ...ascii(content.padEnd(INNER_WIDTH)),
            right,
            ...ascii('\n'),
          ];

          // Clear the screen and draw the frame. Every update after this jumps
          // straight to the field it wants with CUP, so the frame is only ever
          // drawn once.
          send([
            ...ascii('\x1b[2J\x1b[1;1H'),
            TOP_LEFT, ...horizontalRun, TOP_RIGHT, ...ascii('\n'),
            ...framedRow(VERTICAL, ' NinjaTerm text-mode demo', VERTICAL),
            TEE_LEFT, ...horizontalRun, TEE_RIGHT, ...ascii('\n'),
            ...framedRow(VERTICAL, ' Ticks   :', VERTICAL),
            ...framedRow(VERTICAL, ' Voltage :', VERTICAL),
            ...framedRow(VERTICAL, ' State   :', VERTICAL),
            BOTTOM_LEFT, ...horizontalRun, BOTTOM_RIGHT,
          ]);

          const states = ['IDLE', 'ARMED', 'RUNNING', 'FAULT'];
          let tick = 0;
          const intervalId = setInterval(() => {
            tick += 1;
            // Column 12 is just past the ":" of each label. Values are padded out
            // to a fixed width so a shorter one fully overwrites a longer one.
            const voltage = (3.3 + Math.sin(tick / 5) * 0.2).toFixed(3) + ' V';
            const state = states[tick % states.length];
            send(ascii('\x1b[4;12H' + tick.toString().padEnd(15)));
            send(ascii('\x1b[5;12H' + voltage.padEnd(15)));
            send(ascii('\x1b[6;12H' + state.padEnd(15)));
          }, 500);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    // random chars, 80chars/line, 10lines/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'random chars, 80chars/line, 10lines/s',
        'Sends 80 random characters in a line, at a rate of 10 lines per second.',
        () => {
          const intervalId = setInterval(() => {
            const textToSend = generateRandomString(80) + '\n';
            const bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));
          }, 100);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    // alphabetic chars, 1 by 1, 5char/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'alphabetic chars, 1 by 1, 5char/s',
        'Sends all alphabetic characters, one by one, at a rate of 5 characters per second.',
        () => {
          app.settings.displaySettings.scrollbackBufferSizeRows.setDispValue('300');
          app.settings.displaySettings.scrollbackBufferSizeRows.apply();
          let testCharIdx = 65;
          const intervalId = setInterval(() => {
            const te = new TextEncoder();
            const data = te.encode(String.fromCharCode(testCharIdx) + '\n');
            // const data = te.encode(String.fromCharCode(testCharIdx));
            app.parseRxData(Uint8Array.from(data));
            testCharIdx += 1;
            if (testCharIdx === 90) {
              testCharIdx = 65;
            }
          }, 200);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    // typing with backspace corrections, ~8char/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'typing with backspace corrections, ~8char/s',
        'Simulates a user typing into a shell and fixing typos with the backspace key, one byte at a time. ' +
          'Exercises both a lone backspace (0x08) and the classic "\\b \\b" erase sequence. ' +
          'Pair with the RX "Backspace" setting to see destructive backspace, move-cursor-left, or glyph behaviors.',
        () => {
          // The keystroke stream, with embedded backspaces (\b == 0x08).
          // Line 1: type "helllo" (typo), backspace x3, retype to "hello",
          //   continue " wrold" (typo), backspace x4, retype to " world".
          // Line 2: type "abc" then the "\b \b" erase sequence -> "ab".
          const script =
            '$ echo helllo\b\b\blo wrold\b\b\b\borld\n' +
            '$ printf abc\b \b\n';
          const bytes: number[] = [];
          for (let i = 0; i < script.length; i++) {
            bytes.push(script.charCodeAt(i));
          }
          let idx = 0;
          const intervalId = setInterval(() => {
            app.parseRxData(Uint8Array.from([bytes[idx]]));
            idx += 1;
            if (idx === bytes.length) {
              idx = 0;
            }
          }, 120);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    // bytes 0x00-0xFF, 5chars/s, control and hex glyphs
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'bytes 0x00-0xFF, 5chars/s, control and hex glyphs',
        'Sends all bytes from 0x00 to 0xFF, one by one, at a rate of 5 characters per second. Good for testing unprintable characters. Sets the char size to 30px. Disables new line parsing.',
        () => {
          app.settings.displaySettings.charSizePx.setDispValue('30');
          app.settings.displaySettings.charSizePx.apply();

          app.settings.displaySettings.terminalWidthChars.setDispValue('40');
          app.settings.displaySettings.terminalWidthChars.apply();

          app.settings.rxSettings.setAnsiEscapeCodeParsingEnabled(false);
          app.settings.rxSettings.setNewLineCursorBehavior(NewLineCursorBehavior.DO_NOTHING);
          app.settings.rxSettings.setNonVisibleCharDisplayBehavior(NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS);

          let testCharIdx = 0;
          const intervalId = setInterval(() => {
            app.parseRxData(Uint8Array.from([testCharIdx]));
            testCharIdx += 1;
            if (testCharIdx === 256) {
              testCharIdx = 0;
            }
          }, 200);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    // bytes 0x00-0xFF, all at once, control and hex glyphs
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'bytes 0x00-0xFF, all at once, control and hex glyphs',
        'Sends all bytes from 0x00 to 0xFF, all at once. Good for testing unprintable characters. Sets the char size to 30px. Disables new line parsing.',
        () => {
          app.settings.displaySettings.charSizePx.setDispValue('30');
          app.settings.displaySettings.charSizePx.apply();

          app.settings.displaySettings.terminalWidthChars.setDispValue('40');
          app.settings.displaySettings.terminalWidthChars.apply();

          app.settings.rxSettings.setAnsiEscapeCodeParsingEnabled(false);
          app.settings.rxSettings.setNewLineCursorBehavior(NewLineCursorBehavior.DO_NOTHING);
          app.settings.rxSettings.setNonVisibleCharDisplayBehavior(NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS);

          // Create all the bytes and send them immediately
          const data = new Uint8Array(256);
          for (let idx = 0; idx < 256; idx++) {
            data[idx] = idx;
          }
          app.parseRxData(data);

          // No timer needed
          return null;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    // graph data, x=2, y=10, 0.5points/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'graph data, x=2, y=10, 0.5points/s',
        'Sends data that can be graphed.',
        () => {
          app.settings.rxSettings.ansiEscapeCodeParsingEnabled = false;
          let testCharIdx = 0;
          const intervalId = setInterval(() => {
            const rxData = new TextEncoder().encode('x=2,y=10\n');
            app.parseRxData(rxData);
            testCharIdx += 1;
            if (testCharIdx === 256) {
              testCharIdx = 0;
            }
          }, 2000);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    // noisy sine wave, 5points/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'noisy sine wave, 5points/s',
        'Generates a noisy sine wave (value\\n format) at 5 points per second.',
        () => {
          // Disable ANSI escape code parsing for graph data, as it's likely not needed
          // and could interfere if the generated numbers accidentally form escape codes.
          app.settings.rxSettings.ansiEscapeCodeParsingEnabled = false;

          let n = 0; // Iteration counter for sine wave progression
          const intervalMilliseconds = 200; // 5 points per second (1000ms / 200ms = 5)

          const amplitude = 50; // Amplitude of the sine wave
          // Number of data points to complete one full sine wave cycle.
          // e.g., 50 points * 0.2s/point = 10 seconds per cycle.
          const pointsPerCycle = 50;
          const angularStep = (2 * Math.PI) / pointsPerCycle;
          const noiseMagnitude = 10; // Max deviation due to noise (noise will be +/- noiseMagnitude/2)

          const intervalId = setInterval(() => {
            const sineValue = amplitude * Math.sin(n * angularStep);
            // Generate noise between -noiseMagnitude/2 and +noiseMagnitude/2
            const noise = (Math.random() - 0.5) * noiseMagnitude;
            const noisyValue = sineValue + noise;

            // Format as "x=<data>,y=<data>\n"
            const textToSend = `x=${n},y=${noisyValue.toFixed(2)}\n`;
            const bytesToSend = new TextEncoder().encode(textToSend);
            app.parseRxData(bytesToSend);

            n++; // Increment for the next point in the sine wave
          }, intervalMilliseconds);

          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    // mcu modules
    //=================================================================================
    // This intervalId is a hacky way of allowing for variable intervals
    let intervalId_mcuModules: NodeJS.Timeout | null = null;
    let isFirstLogMessageEver = true; // To handle the very first log differently
    const prompt_mcuModules = "\x1B[1;32muart~: \x1B[0m";

    this.fakePorts.push(
      new FakePort(
        'mcu modules (Zephyr-like shell)',
        'Simulates MCU data from different modules with a Zephyr-like shell interface, timestamps, and a persistent prompt.',
        () => {
          // Helper to get a timestamp string
          const getCurrentTimestamp = () => {
            const now = new Date();
            // Pad function for single digit numbers
            const pad = (num: number) => num.toString().padStart(2, '0');
            const padMs = (num: number) => num.toString().padStart(3, '0');
            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${padMs(now.getMilliseconds())}`;
          };

          // Expanded messages for a more realistic embedded log feel
          const messages = [
            "SYSTEM: Power on. Initializing peripherals...",
            "SYSTEM: Boot sequence complete. Application started.",
            "RTC: Current time synchronized from NTP.",
            "\x1B[1;31mERROR: RTC time is out of sync. Fallback to system time.\x1B[0m",
            "GPS: Acquiring satellite fix...",
            "GPS: Got location fix. Latitude: 40.7128 N, Longitude: 74.0060 W",
            "\x1B[1;33mGPS: WARNING - Weak signal. Positional accuracy may be reduced.\x1B[0m",
            "CELLULAR: Searching for network...",
            "CELLULAR: Registered on network. Operator: FakeMobile, Signal: -75 dBm",
            "CELLULAR: Established connection to server api.fakedomain.com.",
            "\x1B[1;31mCELLULAR: ERROR - Failed to connect to server. Timeout.\x1B[0m",
            "WIFI: Scanning for networks...",
            "WIFI: Connected to AP 'MySecureNet'. IP: 192.168.1.123",
            "\x1B[1;33mWIFI: WARNING - Connection unstable. Retrying handshake.\x1B[0m",
            "SENSOR: Temperature reading: 23.5 C",
            "SENSOR: Humidity reading: 45.2 %RH",
            "MEMORY: Free heap: 32768 bytes.",
            "\x1B[1;33mMEMORY: WARNING - Low memory. 2048 bytes remaining.\x1B[0m",
            "STORAGE: Data packet saved to flash. Record ID: 1024",
            "BLE: Advertising started. Device name: NinjaDevice_XYZ",
            "BLE: Client connected. Address: AA:BB:CC:DD:EE:FF",
            "\x1B[1;31mBLE: ERROR - Unexpected disconnect from client.\x1B[0m",
            "ADC: Battery voltage: 3.85V",
            "SYSTEM: Entering low power mode."
          ];

          // isFirstLogMessageEver is now correctly scoped from the outer closure

          // Initial setup when fake port connects:
          // NO initial prompt is printed here. onTimeoutFn handles the first prompt.

          const onTimeoutFn = () => {
            let outputString = "";
            const timestamp = getCurrentTimestamp();
            const randomIndex = Math.floor(Math.random() * messages.length);
            const logMessage = messages[randomIndex];
            const promptLength = prompt_mcuModules.length;

            if (isFirstLogMessageEver) {
              // For the very first log message, no clearing is needed.
              outputString += `${timestamp} ${logMessage}\n`;
              outputString += prompt_mcuModules;
              isFirstLogMessageEver = false;
            } else {
              // For subsequent messages:
              // 1. Move cursor left by prompt length (to start of the old prompt).
              outputString += `\x1B[${promptLength}D`;
              // 2. Clear from cursor to end of screen (ESC[0J or ESC[J).
              outputString += "\x1B[J";
              // 3. Print new log (on the line that was the old prompt), then newline.
              outputString += `${timestamp} ${logMessage}\n`;
              // 4. Print new prompt (on the line below new log).
              outputString += prompt_mcuModules;
            }

            app.parseRxData(new TextEncoder().encode(outputString));

            if (intervalId_mcuModules !== null) {
              clearInterval(intervalId_mcuModules);
            }
            const randomWaitTime = Math.random() * 2000 + 500;
            intervalId_mcuModules = setInterval(onTimeoutFn, randomWaitTime);
          };

          // Schedule the first call to onTimeoutFn.
          const randomInitialWaitTime = Math.random() * 2000 + 500;
          intervalId_mcuModules = setInterval(onTimeoutFn, randomInitialWaitTime);

          return null;
        },
        (_: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId_mcuModules !== null) {
            clearInterval(intervalId_mcuModules);
            intervalId_mcuModules = null;
          }
          // When disconnecting, attempt to clear the last prompt and screen below it.
          let finalClear = "";
          if (!isFirstLogMessageEver) { // Only if at least one log/prompt cycle happened
            finalClear += `\x1B[${prompt_mcuModules.length}D`; // Move to start of last prompt
            finalClear += "\x1B[J";      // Clear from cursor to end of screen
          }
          finalClear += "\n"; // Add a newline for a clean state, regardless of whether clear was sent.
          app.parseRxData(new TextEncoder().encode(finalClear));

          // Reset flag for next connection. This is crucial.
          isFirstLogMessageEver = true;
        }
      )
    );

    //=================================================================================
    // dataType: HEX, bytes: 0x00-0xFF, 5chars/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'dataType: hex, bytes 0x00-0xFF, 5chars/s',
        'Sends all bytes from 0x00 to 0xFF, one by one, at a rate of 5 characters per second.',
        () => {
          app.settings.rxSettings.setDataType(DataType.NUMBER);
          app.settings.rxSettings.setNumberType(NumberType.HEX);

          let testCharIdx = 0;
          const intervalId = setInterval(() => {
            app.parseRxData(Uint8Array.from([testCharIdx]));
            testCharIdx += 1;
            if (testCharIdx === 256) {
              testCharIdx = 0;
            }
          }, 200);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // dataType: uint8, bytes: 0x00-0xFF, 5chars/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'dataType: uint8, bytes 0x00-0xFF, 5chars/s',
        'Sends all bytes from 0x00 to 0xFF, one by one, at a rate of 5 characters per second.',
        () => {
          app.settings.rxSettings.setDataType(DataType.NUMBER);
          app.settings.rxSettings.setNumberType(NumberType.UINT8);

          let testCharIdx = 0;
          const intervalId = setInterval(() => {
            app.parseRxData(Uint8Array.from([testCharIdx]));
            testCharIdx += 1;
            if (testCharIdx === 256) {
              testCharIdx = 0;
            }
          }, 200);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // dataType: uint16, numbers: 250-260, 5chars/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'dataType: uint16, numbers: 250-260, 5chars/s',
        'Sends uint16 numbers 250 thru 260, at a rate of 5 characters per second.',
        () => {
          app.settings.rxSettings.setDataType(DataType.NUMBER);
          app.settings.rxSettings.setNumberType(NumberType.UINT16);

          let numberToSend = 250;
          const intervalId = setInterval(() => {
            app.parseRxData(Uint8Array.from([numberToSend & 0xff, (numberToSend >> 8) & 0xff]));
            numberToSend += 1;
            if (numberToSend === 261) {
              numberToSend = 250;
            }
          }, 200);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // dataType: int16, numbers: -10 to 10, endianness: little, 1chars/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'dataType: int16, numbers: 250-260, endianness: little, 1chars/s',
        'Sends int16 numbers -10 thru 10, in little endian format, at a rate of 5 characters per second.',
        () => {
          app.settings.rxSettings.setDataType(DataType.NUMBER);
          app.settings.rxSettings.setNumberType(NumberType.INT16);
          app.settings.rxSettings.setInsertNewLineOnValue(false);
          app.settings.rxSettings.numberSeparator.setDispValue(' ');
          app.settings.rxSettings.numberSeparator.apply();
          app.settings.rxSettings.setPadValues(true);
          app.settings.rxSettings.setPaddingCharacter(PaddingCharacter.ZERO);

          let numberToSend = -10;
          const intervalId = setInterval(() => {
            const array = new ArrayBuffer(2);
            const view = new DataView(array);
            view.setInt16(0, numberToSend, true); // Little endian
            app.parseRxData(Uint8Array.from([view.getUint8(0), view.getUint8(1)]));
            numberToSend += 1;
            if (numberToSend === 11) {
              numberToSend = -10;
            }
          }, 1000);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // dataType: float32, numbers: -1 to 1 in 0.25 steps, endianness: little, 1chars/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'dataType: float32, numbers: -1 to 1 in 0.25 steps, endianness: little, 1chars/s',
        'Sends 32-bit floating point numbers -1 to 1 in 0.25 steps, in little endian format, at a rate of 5 characters per second.',
        () => {
          app.settings.rxSettings.setDataType(DataType.NUMBER);
          app.settings.rxSettings.setNumberType(NumberType.FLOAT32);
          app.settings.rxSettings.setInsertNewLineOnValue(false);
          app.settings.rxSettings.numberSeparator.setDispValue(' ');
          app.settings.rxSettings.numberSeparator.apply();
          app.settings.rxSettings.setPadValues(true);
          app.settings.rxSettings.setPaddingCharacter(PaddingCharacter.ZERO);

          let numberToSend = -1.0;
          const intervalId = setInterval(() => {
            const array = new ArrayBuffer(4);
            const view = new DataView(array);
            view.setFloat32(0, numberToSend, true); // Little endian
            const uint8Array = new Uint8Array(array);
            app.parseRxData(uint8Array);
            numberToSend += 0.25;
            if (numberToSend > 1.05) {
              numberToSend = -1.0;
            }
          }, 1000);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // dataType: float32, numbers: random in the range -100 to 100, endianness: little, 1chars/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'dataType: float32, numbers: random in the range -100 to 100, endianness: little, 1chars/s',
        'Sends random 32-bit floating point numbers in the range -100 to 100, in little endian format, at a rate of 1 characters per second.',
        () => {
          app.settings.rxSettings.setDataType(DataType.NUMBER);
          app.settings.rxSettings.setNumberType(NumberType.FLOAT32);
          app.settings.rxSettings.setInsertNewLineOnValue(false);
          app.settings.rxSettings.numberSeparator.setDispValue(' ');
          app.settings.rxSettings.numberSeparator.apply();
          app.settings.rxSettings.setPadValues(true);
          app.settings.rxSettings.setPaddingCharacter(PaddingCharacter.ZERO);

          const intervalId = setInterval(() => {
            const array = new ArrayBuffer(4);
            const view = new DataView(array);
            // Generate random float number between -100 and 100
            const numberToSend = Math.random() * 200 - 100;
            view.setFloat32(0, numberToSend, true); // Little endian
            const uint8Array = new Uint8Array(array);
            app.parseRxData(uint8Array);
          }, 1000);
          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // Command Based Graphing Demo - Single Plot, Single Trace
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'Command Based Graphing Demo: Single Plot, Single Trace',
        'Demonstrates command based graphing with a single plot and a single trace. Uses a single command per line.',
        () => {
          app.settings.rxSettings.ansiEscapeCodeParsingEnabled = false;
          app.graphing.setGraphingEnabled(true);

          // Setup sequence - create plot and traces
          const setupCommands = [
            '$NT:GPH:ADD_FIG,id=env,title="Temperature";\n',
            '$NT:GPH:ADD_TRACE,fig=env,id=temp,name="Temperature (deg C)",color=#FF4444,xtype=timestamp;\n',
          ];

          // Send setup commands immediately
          for (const command of setupCommands) {
            app.parseRxData(new TextEncoder().encode(command));
          }

          // Generate realistic sensor data
          const intervalId = setInterval(() => {
            // Simulate temperature: 20-30°C with daily variation
            const temp = 25 + 5 * Math.sin(Date.now() / 100000) + (Math.random() - 0.5) * 2;
            const tempCommand = `$NT:GPH:ADD_DATA,trace=temp,data=${temp.toFixed(1)};\n`;
            app.parseRxData(new TextEncoder().encode(tempCommand));
          }, 1000); // 1 Hz

          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // Command Based Graphing Demo - Accelerometer Data (Counter X-axis)
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'Command Based Graphing Demo: Single Plot, 3 Traces',
        'Demonstrates command based graphing with a single plot and multiple traces. Uses a single command per line.',
        () => {
          app.settings.rxSettings.ansiEscapeCodeParsingEnabled = false;
          app.graphing.setGraphingEnabled(true);

          // Setup sequence - create plot and traces
          const setupCommands = [
            '$NT:GPH:ADD_FIG,id=accel,title="Accelerometer Data";\n',
            '$NT:GPH:ADD_TRACE,fig=accel,id=x,name="X-axis (g)",color=#FF0000,xtype=counter;\n',
            '$NT:GPH:ADD_TRACE,fig=accel,id=y,name="Y-axis (g)",color=#00FF00,xtype=counter;\n',
            '$NT:GPH:ADD_TRACE,fig=accel,id=z,name="Z-axis (g)",color=#0000FF,xtype=counter;\n'
          ];

          for (const command of setupCommands) {
            app.parseRxData(new TextEncoder().encode(command));
          }

          let counter = 0;
          const intervalId = setInterval(() => {
            // Simulate accelerometer data with some motion patterns
            const xAccel = Math.sin(counter * 0.1) * 2 + (Math.random() - 0.5) * 0.5;
            const yAccel = Math.cos(counter * 0.15) * 1.5 + (Math.random() - 0.5) * 0.5;
            const zAccel = 9.8 + Math.sin(counter * 0.05) * 0.3 + (Math.random() - 0.5) * 0.2; // Gravity + small variation

            const xCommand = `$NT:GPH:ADD_DATA,trace=x,data=${xAccel.toFixed(2)};\n`;
            const yCommand = `$NT:GPH:ADD_DATA,trace=y,data=${yAccel.toFixed(2)};\n`;
            const zCommand = `$NT:GPH:ADD_DATA,trace=z,data=${zAccel.toFixed(2)};\n`;

            app.parseRxData(new TextEncoder().encode(xCommand));
            app.parseRxData(new TextEncoder().encode(yCommand));
            app.parseRxData(new TextEncoder().encode(zCommand));

            counter++;
          }, 100); // 10 Hz

          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // Command Based Graphing Demo - XY Position Data (Data X-axis)
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'Command Based Graphing Demo: XY Position (Data X-axis)',
        'Demonstrates command based graphing with explicit x,y coordinate plotting for position tracking.',
        () => {
          app.settings.rxSettings.ansiEscapeCodeParsingEnabled = false;
          app.graphing.setGraphingEnabled(true);

          // Setup sequence - create plot and traces
          const setupCommands = [
            '$NT:GPH:ADD_FIG,id=pos,title="Position Tracking";$NT:GPH:ADD_TRACE,fig=pos,id=path,name="Robot Path",color=#FF00FF,xtype=data;\n'
          ];

          for (const command of setupCommands) {
            app.parseRxData(new TextEncoder().encode(command));
          }

          let angle = 0;
          const intervalId = setInterval(() => {
            // Simulate robot moving in a spiral pattern
            const radius = 5 + angle * 0.02;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            const command = `$NT:GPH:ADD_DATA,trace=path,data=${x.toFixed(2)},${y.toFixed(2)};\n`;
            app.parseRxData(new TextEncoder().encode(command));

            angle += 0.2;
            if (angle > 20 * Math.PI) { // Reset after ~10 spirals
              angle = 0;
            }
          }, 200); // 5 Hz

          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // Command Based Graphing Demo - Multiple Data Points Per Command
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'Three Phase and Temperature Sensor Plots',
        'Demonstrates two plots: three-phase sine waves and temperature sensors.',
        () => {
          app.settings.rxSettings.ansiEscapeCodeParsingEnabled = false;
          app.graphing.setGraphingEnabled(true);
          app.graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);

          // Setup sequence - create plots and traces
          const setupCommands = [
            // First plot: Three-phase sine waves
            '$NT:GPH:ADD_FIG,id=sine_waves,title="Three-Phase Sine Waves",xlabel="Sample",ylabel="Amplitude";',
            '$NT:GPH:ADD_TRACE,fig=sine_waves,id=phase_a,name="Phase A",color=#FF0000,xtype=counter;',
            '$NT:GPH:ADD_TRACE,fig=sine_waves,id=phase_b,name="Phase B",color=#00FF00,xtype=counter;',
            '$NT:GPH:ADD_TRACE,fig=sine_waves,id=phase_c,name="Phase C",color=#0000FF,xtype=counter;',
            // Second plot: Temperature sensors
            '$NT:GPH:ADD_FIG,id=temperature,title="Temperature Sensors",xlabel="Time (s)",ylabel="Temperature (°C)";',
            '$NT:GPH:ADD_TRACE,fig=temperature,id=sensor1,name="Sensor 1",color=#FF8000,xtype=timestamp;',
            '$NT:GPH:ADD_TRACE,fig=temperature,id=sensor2,name="Sensor 2",color=#8000FF,xtype=timestamp;\n'
          ];

          for (const command of setupCommands) {
            app.parseRxData(new TextEncoder().encode(command));
          }

          let secondCounter = 0;

          // Single timer that fires every second
          const intervalId = setInterval(() => {
            secondCounter++;

            // Temperature sensor updates - every second
            const baseTempSensor1 = 22 + Math.sin(secondCounter * 0.01) * 3; // Slow sine variation around 22°C
            const baseTempSensor2 = 25 + Math.cos(secondCounter * 0.012) * 2.5; // Different pattern around 25°C

            const sensor1Temp = (baseTempSensor1 + (Math.random() - 0.5) * 0.5).toFixed(1);
            const sensor2Temp = (baseTempSensor2 + (Math.random() - 0.5) * 0.4).toFixed(1);

            app.parseRxData(new TextEncoder().encode(`$NT:GPH:ADD_DATA,trace=sensor1,data=${sensor1Temp};\n`));
            app.parseRxData(new TextEncoder().encode(`$NT:GPH:ADD_DATA,trace=sensor2,data=${sensor2Temp};\n`));

            // Sine wave updates - every 3rd second (every 3rd callback)
            if (secondCounter % 3 === 0) {
              const phaseAData = [];
              const phaseBData = [];
              const phaseCData = [];

              // Generate 3 complete cycles (72 samples each, 216 total)
              for (let i = 0; i < 100; i++) {
                const angle = (i * Math.PI * 2) / 72; // 72 samples per cycle
                const noise = (Math.random() - 0.5) * 1.0; // Small noise

                // Phase A (0°)
                phaseAData.push((Math.sin(angle) * 10 + noise).toFixed(2));

                // Phase B (120° = 2π/3 radians behind)
                phaseBData.push((Math.sin(angle - (2 * Math.PI / 3)) * 10 + noise).toFixed(2));

                // Phase C (240° = 4π/3 radians behind)
                phaseCData.push((Math.sin(angle - (4 * Math.PI / 3)) * 10 + noise).toFixed(2));
              }

              // Clear previous data and send new full cycles
              app.parseRxData(new TextEncoder().encode('$NT:GPH:CLR_FIG,fig=sine_waves;\n'));
              app.parseRxData(new TextEncoder().encode(`$NT:GPH:ADD_DATA,trace=phase_a,data=[${phaseAData.join(',')}];\n`));
              app.parseRxData(new TextEncoder().encode(`$NT:GPH:ADD_DATA,trace=phase_b,data=[${phaseBData.join(',')}];\n`));
              app.parseRxData(new TextEncoder().encode(`$NT:GPH:ADD_DATA,trace=phase_c,data=[${phaseCData.join(',')}];\n`));
            }
          }, 1000); // Fire every second

          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    //=================================================================================
    // Creating and Deleting Figures
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'Creating and Deleting Figures',
        'Demonstrates command based graphing with creating, clearing, and deleting figures and traces.',
        () => {
          app.settings.rxSettings.ansiEscapeCodeParsingEnabled = false;

          let phase = 0; // 0: setup, 1: data, 2: clear, 3: new plot, 4: more data, 5: delete
          let dataCounter = 0;

          const intervalId = setInterval(() => {
            if (phase === 0) {
              // Initial setup - create first plot
              const setupCommands = [
                '$NT:GPH:ADD_FIG,id=fig1,title="Figure 1";\n',
                '$NT:GPH:ADD_TRACE,fig=fig1,id=trace1,name="Wave 1",color=#FF6600,xtype=counter;\n',
                '$NT:GPH:ADD_TRACE,fig=fig1,id=trace2,name="Wave 2",color=#6600FF,xtype=counter;\n',
              ];

              for (const command of setupCommands) {
                app.parseRxData(new TextEncoder().encode(command));
              }
              phase = 1;
              dataCounter = 0;

            } else if (phase === 1) {
              // Send data for 5 seconds
              const wave1 = Math.sin(dataCounter * 0.2) * 10;
              const wave2 = Math.cos(dataCounter * 0.3) * 8;

              app.parseRxData(new TextEncoder().encode(`$NT:GPH:ADD_DATA,trace=trace1,data=${wave1.toFixed(2)};\n`));
              app.parseRxData(new TextEncoder().encode(`$NT:GPH:ADD_DATA,trace=trace2,data=${wave2.toFixed(2)};\n`));

              dataCounter++;
              if (dataCounter >= 10) {
                phase = 2;
                dataCounter = 0;
              }

            } else if (phase === 2) {
              // Delete one trace
              app.parseRxData(new TextEncoder().encode('$NT:GPH:DEL_TRACE,trace=trace1;\n'));
              app.parseRxData(new TextEncoder().encode('Deleted trace1 trace.\n'));
              phase = 3;

            } else if (phase === 3) {
              // Create second plot
              const setupCommands = [
                '$NT:GPH:ADD_FIG,id=fig2,title="Figure 2";\n',
                '$NT:GPH:ADD_TRACE,id=trace3,fig=fig2,name="Ramp Signal",color=#00FF88,xtype=timestamp;\n',
              ];

              for (const command of setupCommands) {
                app.parseRxData(new TextEncoder().encode(command));
              }
              phase = 4;
              dataCounter = 0;

            } else if (phase === 4) {
              // Send data to both plots
              const wave2 = Math.cos(dataCounter * 0.3) * 8;
              const ramp = (dataCounter % 20) * 0.5; // Sawtooth wave

              app.parseRxData(new TextEncoder().encode(`$NT:GPH:ADD_DATA,trace=trace2,data=${wave2.toFixed(2)};\n`));
              app.parseRxData(new TextEncoder().encode(`$NT:GPH:ADD_DATA,trace=trace3,data=${ramp.toFixed(2)};\n`));

              dataCounter++;
              if (dataCounter >= 10) {
                phase = 5;
              }
            } else if (phase === 5) {
              // Delete first plot and restart cycle
              app.parseRxData(new TextEncoder().encode('$NT:GPH:CLR_FIG,fig=fig1;\n'));
              app.parseRxData(new TextEncoder().encode('$NT:GPH:DEL_FIG,fig=fig2;\n'));
              app.parseRxData(new TextEncoder().encode('Cleared fig1 and deleted fig2. Restarting cycle...\n'));

              phase = 6;
              dataCounter = 0;
            }
            else if (phase === 6) {
              // This is just a delay phase
              dataCounter++;
              if (dataCounter >= 10) {
                phase = 0;
              }
            }
          }, 500);

          return intervalId;
        },
        (intervalId: NodeJS.Timeout | null) => {
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    makeAutoObservable(this);
  }

  setIsDialogOpen(isDialogOpen: boolean) {
    this.isDialogOpen = isDialogOpen;
  }

  setSearchText(searchText: string) {
    this.searchText = searchText;
  }

  /**
   * The fake ports matching the current search text, each paired with its
   * original index into `fakePorts`. The original index is preserved because
   * selection (`selFakePortIdx`) and `openPort()` both index into the full,
   * unfiltered array.
   */
  get filteredFakePorts(): { fakePort: FakePort; idx: number }[] {
    const withIdx = this.fakePorts.map((fakePort, idx) => ({ fakePort, idx }));
    const search = this.searchText.trim().toLowerCase();
    if (search === '') {
      return withIdx;
    }
    return withIdx.filter(
      ({ fakePort }) =>
        fakePort.name.toLowerCase().includes(search) || fakePort.description.toLowerCase().includes(search)
    );
  }

  onClick(fakePortIdx: number) {
    this.selFakePortIdx = fakePortIdx;
  }

  openPort() {
    this.fakePorts[this.selFakePortIdx].connect();
    this.app.connController.connState = ConnState.OPENED;
    this.fakePortOpen = true;
    this.app.connController.lastSelectedPortType = PortType.FAKE;
    this.app.snackbar.sendToSnackbar('Fake serial port opened.', 'success');

    // Go to terminal view
    if (this.app.settings.portConfiguration.connectToSerialPortAsSoonAsItIsSelected) {
      this.app.setShownMainPane(MainPanes.TERMINAL);
    }
  }

  closePort() {
    this.fakePorts[this.selFakePortIdx].disconnect();
    this.app.connController.connState = ConnState.CLOSED;
    this.fakePortOpen = false;
    this.app.snackbar.sendToSnackbar('Fake serial port closed.', 'success');
  }
}
