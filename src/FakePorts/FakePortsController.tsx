import { makeAutoObservable } from 'mobx';

import { App, PortType } from 'src/App';
import { PortState } from 'src/Settings/PortConfigurationSettings/PortConfigurationSettings';
import { NewLineCursorBehaviors, NonVisibleCharDisplayBehaviors } from 'src/Settings/DataProcessingSettings/DataProcessingSettings';
import { generateRandomString } from 'src/Util/Util';

class FakePort {
  name: string;
  description: string;
  intervalId: NodeJS.Timer | null;
  connectFunction: () => NodeJS.Timer | null;
  disconnectFunction: (intervalId: NodeJS.Timer | null) => void;

  constructor(
    name: string,
    description: string,
    connectFunction: () => NodeJS.Timer | null,
    disconnectFunction: (intervalId: NodeJS.Timer | null) => void
  ) {
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
        (intervalId: NodeJS.Timer | null) => {
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
        (intervalId: NodeJS.Timer | null) => {
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
        (intervalId: NodeJS.Timer | null) => {
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
        (intervalId: NodeJS.Timer | null) => {
          // Stop the interval
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }
      )
    );

    // red green, 0.2lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        'red green, 0.2items/s',
        'Sends red and green colored text every 5 seconds.',
        () => {
          let stringIdx = 0;
          const strings =
            [
              '\x1b[31mred',
              '\x1b[32mgreen',
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
          }, 5000);
          return intervalId;
        },
        (intervalId: NodeJS.Timer | null) => {
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
          const strings =
            [
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
        (intervalId: NodeJS.Timer | null) => {
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
        (intervalId: NodeJS.Timer | null) => {
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
        (intervalId: NodeJS.Timer | null) => {
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

          app.settings.dataProcessingSettings.setAnsiEscapeCodeParsingEnabled(false);
          app.settings.dataProcessingSettings.setNewLineCursorBehavior(NewLineCursorBehaviors.DO_NOTHING);
          app.settings.dataProcessingSettings.setNonVisibleCharDisplayBehavior(NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS);

          let testCharIdx = 0;
          const intervalId = setInterval(() => {
            app.parseRxData(Uint8Array.from([ testCharIdx ]));
            testCharIdx += 1;
            if (testCharIdx === 256) {
              testCharIdx = 0;
            }
          }, 200);
          return intervalId;
        },
        (intervalId: NodeJS.Timer | null) => {
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

          app.settings.dataProcessingSettings.setAnsiEscapeCodeParsingEnabled(false);
          app.settings.dataProcessingSettings.setNewLineCursorBehavior(NewLineCursorBehaviors.DO_NOTHING);
          app.settings.dataProcessingSettings.setNonVisibleCharDisplayBehavior(NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS);

          // Create all the bytes and send them immediately
          const data = new Uint8Array(256);
          for (let idx = 0; idx < 256; idx++) {
            data[idx] = idx;
          }
          app.parseRxData(data);

          // No timer needed
          return null;
        },
        (intervalId: NodeJS.Timer | null) => {
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
          app.settings.dataProcessingSettings.ansiEscapeCodeParsingEnabled = false;
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
        (intervalId: NodeJS.Timer | null) => {
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
    let intervalId: NodeJS.Timer | null = null;
    this.fakePorts.push(
      new FakePort(
        'mcu modules',
        'Fake MCU data from different modules.',
        () => {
          const messages = [
            'TEMP: Measured temperature = 21C.',
            'TEMP: Measured temperature = 24C.',
            '\x1B[31;1mTEMP: ERROR - Temperature (56C) is too high.\x1B[0m',
            '\x1B[31;1mGPS: ERROR - GPS signal has been lost.\x1B[0m',
            '\x1B[31;1mSLEEP: ERROR - Requested sleep while peripherals still active.\x1B[0m',
            'CLOCK: Time is now 14:23:45',
            'CLOCK: Time is now 09:12:24',
            'CLOCK: Time is now 03:02:54',
            'WATCHDOG: Watchdog fed.',
            '\x1B[31;1mWATCHDOG: ERROR - Watchdog expired. Resetting micro...\x1B[0m',
            'BLU: New device found.',
            'BLU: Connecting to new device...',
            'BLU: Bluetooth connection refreshed.',
            'BLU: Starting advertising...',
            'SLEEP: In low power mode.',
            'SLEEP: In medium power mode.',
            'SLEEP: In high power mode.',
            'SLEEP: Sleeping...',
            'XTAL: External crystal frequency changed to 20MHz.',
            'XTAL: External crystal frequency changed to 40MHz.',
            'LED: Status LED set to mode: FLASHING.',
            'LED: Status LED set to mode: CONTINUOUS.',
            'LED: Status LED set to mode: OFF.',
          ];

          const onTimeoutFn = () => {
            const randomIndex = Math.floor(Math.random() * messages.length);
            const rxData = new TextEncoder().encode(messages[randomIndex] + '\n');
            app.parseRxData(rxData);
            if (intervalId !== null) {
              clearInterval(intervalId);
            }
            const randomWaitTime = Math.random()*1000;
            intervalId = setInterval(onTimeoutFn, randomWaitTime);
          }

          intervalId = setInterval(onTimeoutFn, 1000);
          return null;
        },
        (_: NodeJS.Timer | null) => {
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
    console.log('onClick() called.');
    this.selFakePortIdx = fakePortIdx;
  }

  openPort() {
    this.fakePorts[this.selFakePortIdx].connect();
    this.app.portState = PortState.OPENED;
    this.fakePortOpen = true;
    this.app.lastSelectedPortType = PortType.FAKE;
    this.app.snackbar.sendToSnackbar('Fake serial port opened.', 'success');
  }

  closePort() {
    this.fakePorts[this.selFakePortIdx].disconnect();
    this.app.portState = PortState.CLOSED;
    this.fakePortOpen = false;
    this.app.snackbar.sendToSnackbar('Fake serial port closed.', 'success');
  }
}
