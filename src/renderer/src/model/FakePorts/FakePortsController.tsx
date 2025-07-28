import { makeAutoObservable } from 'mobx';

import { App, MainPanes, PortType } from 'src/model/App';
import { PortState } from 'src/model/Settings/PortSettings/PortSettings';
import { DataType, NewLineCursorBehavior, NonVisibleCharDisplayBehaviors, NumberType, PaddingCharacter } from 'src/model/Settings/RxSettings/RxSettings';
import { generateRandomString } from 'src/model/Util/Util';

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

  constructor(app: App) {
    this.app = app;

    // hello world, 0.1lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'hello world, 0.1lps',
        'Sends "Hello, world!\\n" every 10 seconds.',
        () => {
          const intervalId = setInterval(() => {
            const textToSend = 'Hello, world!\n';
            let bytesToSend = [];
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

    // hello world, 1lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'hello world, 1lps',
        'Sends "Hello, world!\\n" every 1 second.',
        () => {
          const intervalId = setInterval(() => {
            const textToSend = 'Hello, world!\n';
            let bytesToSend = [];
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

    // hello world, 5lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'hello world, 5lps',
        'Sends "Hello, world!\\n" every 200ms.',
        () => {
          const intervalId = setInterval(() => {
            const textToSend = 'Hello, world!\n';
            let bytesToSend = [];
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

    // hello world, 10lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'hello world, 10lps',
        'Sends "Hello, world!\\n" every 100ms.',
        () => {
          const intervalId = setInterval(() => {
            const textToSend = 'Hello, world!\n';
            let bytesToSend = [];
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
              let bytesToSend = [];
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

    // 50 numbered lines all at once
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        '50 numbered lines all at once',
        'Sends "0\\n1\\n ..." to 49 (50 numbers) all at once. Useful for testing scroll behaviour.',
        () => {
          for (let i = 0; i < 50; i++) {
            const textToSend = `${i}\n`;
            let bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));
          }
          return null;
        },
        (intervalId: NodeJS.Timeout | null) => {
          // Do nothing
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
            let bytesToSend = [];
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
            let bytesToSend = [];
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
            let textToSend = '';
            if (sendIdx < 50) {
              textToSend = `Line ${sendIdx}\n`;
            } else {
              textToSend = '\x1b[1J';
            }
            let bytesToSend = [];
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
            let bytesToSend = [];
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

          let bytesToSend = [];
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

    // random chars, 80chars/line, 10lines/s
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'random chars, 80chars/line, 10lines/s',
        'Sends 80 random characters in a line, at a rate of 10 lines per second.',
        () => {
          const intervalId = setInterval(() => {
            const textToSend = generateRandomString(80) + '\n';
            let bytesToSend = [];
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

    makeAutoObservable(this);
  }

  setIsDialogOpen(isDialogOpen: boolean) {
    this.isDialogOpen = isDialogOpen;
  }

  onClick(fakePortIdx: number) {
    this.selFakePortIdx = fakePortIdx;
  }

  openPort() {
    this.fakePorts[this.selFakePortIdx].connect();
    this.app.portState = PortState.OPENED;
    this.fakePortOpen = true;
    this.app.lastSelectedPortType = PortType.FAKE;
    this.app.snackbar.sendToSnackbar('Fake serial port opened.', 'success');

    // Go to terminal view
    if (this.app.settings.portConfiguration.connectToSerialPortAsSoonAsItIsSelected) {
      this.app.setShownMainPane(MainPanes.TERMINAL);
    }
  }

  closePort() {
    this.fakePorts[this.selFakePortIdx].disconnect();
    this.app.portState = PortState.CLOSED;
    this.fakePortOpen = false;
    this.app.snackbar.sendToSnackbar('Fake serial port closed.', 'success');
  }
}
