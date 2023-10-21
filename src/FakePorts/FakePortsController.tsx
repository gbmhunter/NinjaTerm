import { makeAutoObservable } from "mobx";

import { App, PortState, PortType } from "App";
import { generateRandomString } from "Util/Util";

class FakePort {
  name: string;
  intervalId: NodeJS.Timer | null;
  connectFunction: () => NodeJS.Timer;
  disconnectFunction: (intervalId: NodeJS.Timer | null) => void;

  constructor(
    name: string,
    connectFunction: () => NodeJS.Timer,
    disconnectFunction: (intervalId: NodeJS.Timer | null) => void
  ) {
    this.name = name;
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

    // hello world, 0.2lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        "hello world, 0.2lps",
        () => {
          const intervalId = setInterval(() => {
            const textToSend = "Hello, world!\n";
            let bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));
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

    // hello world, 5lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        "hello world, 5lps",
        () => {
          const intervalId = setInterval(() => {
            const textToSend = "Hello, world!\n";
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
        "hello world, 10lps",
        () => {
          const intervalId = setInterval(() => {
            const textToSend = "Hello, world!\n";
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
        "red green, 0.2lps",
        () => {
          let stringIdx = 0;
          const strings =
            [
              "\x1b[31mred\n",
              "\x1b[32mgreen\n",
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

    // all colours, 5cps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        "all colours, 5cps",
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

    // random chars, 80pl, 10lps
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        "random chars, 80pl, 10lps",
        () => {
          const intervalId = setInterval(() => {
            console.time();
            const textToSend = generateRandomString(80) + "\n";
            console.log(textToSend);
            let bytesToSend = [];
            for (let i = 0; i < textToSend.length; i++) {
              bytesToSend.push(textToSend.charCodeAt(i));
            }
            app.parseRxData(Uint8Array.from(bytesToSend));
            console.timeEnd();

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

    // ALPHABETIC CHARS, 1 BY 1
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        "alphabetic chars, 1 by 1",
        () => {
          app.settings.dataProcessing.visibleData.fields.scrollbackBufferSizeRows.value = 300;
          app.settings.dataProcessing.applyChanges();
          let testCharIdx = 65;
          const intervalId = setInterval(() => {
            const te = new TextEncoder();
            const data = te.encode(String.fromCharCode(testCharIdx) + "\n");
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

    // BYTES 0x00-0xFF
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        "bytes 0x00-0xFF",
        () => {
          app.settings.dataProcessing.visibleData.fields.ansiEscapeCodeParsingEnabled.value =
            false;
          app.settings.dataProcessing.setCharSizePxDisp("30");
          app.settings.dataProcessing.applyCharSizePx();
          app.settings.dataProcessing.applyChanges();
          let testCharIdx = 0;
          const intervalId = setInterval(() => {
            // this.parseRxData(Uint8Array.from([ testCharIdx ]));
            app.parseRxData(Uint8Array.from([0x08]));
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

    // GRAPH DATA
    //=================================================================================
    this.fakePorts.push(
      new FakePort(
        "graph data",
        () => {
          app.settings.dataProcessing.visibleData.fields.ansiEscapeCodeParsingEnabled.value =
            false;
          app.settings.dataProcessing.applyChanges();
          let testCharIdx = 0;
          const intervalId = setInterval(() => {
            const rxData = new TextEncoder().encode("x=2,y=10\n");
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

    makeAutoObservable(this);
  }

  setIsDialogOpen(isDialogOpen: boolean) {
    this.isDialogOpen = isDialogOpen;
  }

  onClick(fakePortIdx: number) {
    console.log("onClick() called.");
    this.selFakePortIdx = fakePortIdx;
  }

  openPort() {
    this.fakePorts[this.selFakePortIdx].connect();
    this.app.setPortState(PortState.OPENED);
    this.fakePortOpen = true;
    this.app.lastSelectedPortType = PortType.FAKE;
    this.app.snackbar.sendToSnackbar("Fake serial port opened.", "success");
  }

  closePort() {
    this.fakePorts[this.selFakePortIdx].disconnect();
    this.app.setPortState(PortState.CLOSED);
    this.fakePortOpen = false;
    this.app.snackbar.sendToSnackbar("Fake serial port closed.", "success");
  }
}
