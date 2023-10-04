/* eslint-disable no-console */
// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable, runInAction } from 'mobx';

import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { VariantType, enqueueSnackbar } from 'notistack';

import packageDotJson from '../../package.json'
// eslint-disable-next-line import/no-cycle
import { Settings } from './Settings/Settings';
import Terminal from './Terminal/Terminal';
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
// serviceWorkerRegistration.unregister();
// serviceWorkerRegistration.register();

declare global {
  interface String {
    insert(index: number, string: string): string;
  }
}

// eslint-disable-next-line no-extend-native, func-names
String.prototype.insert = function (index, string) {
  if (index > 0) {
    return this.substring(0, index) + string + this.substr(index);
  }

  return string + this;
};

export enum PortState {
  CLOSED,
  OPENED,
}

export type PortStateToButtonPropsItem = {
  text: string;
  color: string;
  icon: any;
};

export const portStateToButtonProps: { [key in PortState]: PortStateToButtonPropsItem; } = {
  [PortState.CLOSED]: {
    text: 'Open Port',
    color: 'success',
    icon: <PlayArrowIcon />,
  },
  [PortState.OPENED]: {
    text: 'Close Port',
    color: 'error',
    icon: <StopIcon />,
  },
};

export class App {

  settings: Settings;

  settingsDialogOpen = false;

  // If true, the settings dialog will be automatically closed on port open or close
  closeSettingsDialogOnPortOpenOrClose = true;

  portState = PortState.CLOSED;

  rxData = '';

  txRxTerminal: Terminal;

  rxTerminal: Terminal;

  txTerminal: Terminal;

  numBytesReceived: number;

  numBytesTransmitted: number;

  // If true, the TX/RX panel scroll will be locked at the bottom
  txRxTextScrollLock = true;

  // If true, the status msg panel scroll will be locked at the bottom
  statusMsgScrollLock = true;

  // If true app is being tested by code.
  // Used for force terminal height to value when browser is not
  // available to determine height
  testing: boolean;

  port: SerialPort | null;

  serialPortInfo: SerialPortInfo | null;

  keepReading: boolean = true;

  reader: ReadableStreamDefaultReader<Uint8Array> | null;

  closedPromise: Promise<void> | null;

  snackBarOpen: boolean;

  // Version of the NinjaTerm app. Read from package.json
  version: string;

  constructor(
    testing = false
  ) {
    this.testing = testing;

    this.version = packageDotJson['version'];

    this.settings = new Settings(this);

    // Need to create terminals before settings, as the settings
    // will configure the terminals
    this.txRxTerminal = new Terminal(this.settings);
    this.rxTerminal = new Terminal(this.settings);
    this.txTerminal = new Terminal(this.settings);

    this.numBytesReceived = 0;
    this.numBytesTransmitted = 0;

    this.port = null;
    this.serialPortInfo = null;
    this.reader = null;
    this.closedPromise = null;

    this.snackBarOpen = false;

    console.log('Started NinjaTerm.')

    // this.runTestMode();
    // This is fired whenever a serial port that has been allowed access
    // dissappears (i.e. USB serial), even if we are not connected to it.
    // navigator.serial.addEventListener("disconnect", (event) => {
    //   // TODO: Remove |event.target| from the UI.
    //   // If the serial port was opened, a stream error would be observed as well.
    //   console.log('Serial port removed.');
    // });

    makeAutoObservable(this); // Make sure this near the end
  }

  /** Function used for testing when you don't have an Arduino handy.
   * Sets up a interval timer to add fake RX data.
   * Change as needed for testing!
   */
  runTestMode() {
    console.log('runTestMode() called.');
    this.settings.dataProcessing.visibleData.fields.scrollbackBufferSizeRows.value = 300;
    this.settings.dataProcessing.applyChanges();
    let testCharIdx = 65;
    setInterval(() => {
      const te = new TextEncoder();
      // const data = te.encode(String.fromCharCode(testCharIdx) + '\n');
      const data = te.encode(String.fromCharCode(testCharIdx));
      this.parseRxData(Uint8Array.from(data));
      testCharIdx += 1;
      if (testCharIdx === 90) {
        testCharIdx = 65;
      }
    }, 200);
  }

  setSnackBarOpen(trueFalse: boolean) {
    this.snackBarOpen = trueFalse;
  }

  setSettingsDialogOpen(trueFalse: boolean) {
    this.settingsDialogOpen = trueFalse;
  }

  setCloseSettingsDialogOnPortOpenOrClose(trueFalse: boolean) {
    this.closeSettingsDialogOnPortOpenOrClose = trueFalse;
  }

  /**
   * Scans the computer for available serial ports, and updates availablePortInfos.
   *
   * Based of https://developer.chrome.com/en/articles/serial/
   */
  async scanForPorts() {
    // Prompt user to select any serial port.
    if ("serial" in navigator) {
      // The Web Serial API is supported.

      let localPort: SerialPort;

      // If the user clicks cancel, a DOMException is thrown
      try {
        localPort = await navigator.serial.requestPort();
      } catch (error) {
          console.log('Error occurred. error=', error);
          this.sendToSnackbar('User cancelled port selection.', 'error');
          return;
      }
      console.log('Got local port, now setting state...');
      runInAction(() => {
        console.log('Setting this.port and this.serialPortInfo...');
        this.port = localPort;
        this.serialPortInfo = this.port.getInfo();
      })
    } else {
      console.log('Not supported!');
    }
  }

  async openPort() {
    try {
      await this.port?.open({
        baudRate: this.settings.selectedBaudRate,
        dataBits: this.settings.selectedNumDataBits,
        parity: this.settings.selectedParity as ParityType,
        stopBits: this.settings.selectedStopBits,
        bufferSize: 1000000}); // Default buffer size is only 256 (presumably bytes), which is not enough regularly causes buffer overrun errors
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NetworkError') {
          const msg = 'Serial port is already in use by another program.\n'
                    + 'Reported error from port.open():\n'
                    + `${error}`
          this.sendToSnackbar(msg, 'error');
          console.log(msg);
        } else {
          const msg = `Unrecognized DOMException error with name=${error.name} occurred when trying to open serial port.\n`
          + 'Reported error from port.open():\n'
          + `${error}`
          this.sendToSnackbar(msg, 'error');
          console.log(msg);
        }
      } else {
        // Type of error not recognized or seen before
        const msg = `Unrecognized error occurred when trying to open serial port.\n`
        + 'Reported error from port.open():\n'
        + `${error}`
        this.sendToSnackbar(msg, 'error');
        console.log(msg);
      }

      // An error occurred whilst calling port.open(), so DO NOT continue, port
      // cannot be considered open
      return;
    }
    console.log('Serial port opened.');
    this.sendToSnackbar('Serial port opened.', 'success');
    this.setPortState(PortState.OPENED);
    // This will automatically close the settings window if the user is currently in it,
    // clicks "Open" and the port opens successfully.
    if (this.closeSettingsDialogOnPortOpenOrClose) {
      this.setSettingsDialogOpen(false);
    }

    this.keepReading = true;
    this.closedPromise = this.readUntilClosed();
  }

  /** Continuously reads from the serial port until:
   *  1) keepReading is set to false and then reader.cancel() is called to break out of inner read() loop
   *  2) Fatal error is thrown in read(), which causes port.readable to become null
   */
  async readUntilClosed() {
    // port.readable will become null when a fatal error occurs
    while (this.port?.readable && this.keepReading) {
      this.reader = this.port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) {
            // reader.cancel() has been called.
            console.log('reader.read() returned done.');
            break;
          }
          // value is a Uint8Array.
          this.parseRxData(value);
        }
      } catch (error) {
          // This is called if the USB serial device is removed whilst
          // reading
          console.log('reader.read() threw an error. error=', error, 'port.readable="', this.port?.readable, '" (null indicates fatal error)');
          // @ts-ignore:
          if (error instanceof DOMException) {
            console.log('Exception was DOMException. error.name=', error.name);
            // BufferOverrunError: Rendering couldn't get up with input data,
            // potentially make buffer size to port.open() larger or speed up processing/rendering
            // if this occurs often. This is non-fatal, readable will not be null
            if (error.name === 'BufferOverrunError') {
              this.sendToSnackbar('RX buffer overrun occurred. Too much data is coming in for the app to handle.\n'
                                  + 'Returned error from reader.read():\n'
                                  + `${error}`,
                                  'warning');
            } else if (error.name === 'BreakError') {
              this.sendToSnackbar('Encountered break signal.\n'
                                  + 'Returned error from reader.read():\n'
                                  + `${error}`,
                                  'warning');
            } else {
              const msg = `Unrecognized DOMException error with name=${error.name} occurred when trying to read from serial port.\n`
                          + 'Reported error from port.read():\n'
                          + `${error}`;
              this.sendToSnackbar(msg, 'error');
              console.log(msg);
            }
          } else {
            this.sendToSnackbar(`Serial port was removed unexpectedly.\nReturned error from reader.read():\n${error}`, 'error');
          }

          // this.setPortState(PortState.CLOSED);
          // runInAction(() => {
          //   // Setting this.port to null means the port needs to be
          //   // reselected in the UI (which makes sense because we just
          //   // lost it)
          //   // this.port = null;
          //   // this.closedPromise = null;
          // });
      } finally {
        // Allow the serial port to be closed later.
        this.reader.releaseLock();
      }
    }

    console.log('Closing port...');
    await this.port?.close();
  }

  /**
   * Enqueues a message to the snackbar used for temporary status updates to the user.
   *
   * @param msg The message you want to display. Use "\n" to insert new lines.
   * @param variant The variant (e.g. error, warning) of snackbar you want to display.
   */
  sendToSnackbar(msg: string, variant: VariantType) {
    enqueueSnackbar(
      msg,
      {
        variant: variant,
        style: { whiteSpace: 'pre-line' } // This allows the new lines in the string above to also be carried through to the displayed message
      });
  }

  /**
   * Unit tests call this instead of mocking out the serial port read() function
   * as setting up the deferred promise was too tricky.
   *
   * @param rxData
   */
  parseRxData(rxData: Uint8Array) {
    // Send received data to both the single TX/RX terminal
    // and the RX terminal
    this.txRxTerminal.parseData(rxData);
    this.rxTerminal.parseData(rxData);
    this.numBytesReceived += rxData.length;
  }

  async closePort() {
    console.log('closePort() called.');
    this.keepReading = false;
    // Force reader.read() to resolve immediately and subsequently
    // call reader.releaseLock() in the loop example above.
    this.reader?.cancel();

    if (this.closedPromise === null) {
      console.log('was null.');
      throw Error('jfjfjf')
    }
    await this.closedPromise;

    this.setPortState(PortState.CLOSED);
    this.sendToSnackbar('Serial port closed.', 'success');
    this.reader = null;
    this.closedPromise = null;
  }

  setPortState(newPortState: PortState) {
    this.portState = newPortState;
  }

  /**
   * This is called from either the TX/RX terminal or TX terminal
   * (i.e. any terminal pane that is allowed to send data)
   *
   * @param event
   * @returns
   */
  async handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // console.log('handleKeyDown() called. event=', event, this);

    // Prevent Tab press from moving focus to another element on screen
    // Do this even if port is not opened
    if (event.key === 'Tab') {
      event.preventDefault();
    }

    if (this.portState === PortState.OPENED) {
      // Serial port is open, let's send it to the serial
      // port

      // Convert event.key to required ASCII number. This would be easier if we could
      // use keyCode, but this method is deprecated!
      const bytesToWrite: number[] = [];
      // List of allowed symbols, includes space char also
      const symbols = '`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/? ';
      const alphaNumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqurstuvwxyz0123456789'
      if (event.ctrlKey || event.shiftKey) {
        // Don't send anything if a control key/shift key was pressed
        return;
      }

      if (event.key === 'Enter') {
        bytesToWrite.push(13);
        bytesToWrite.push(10);
      } else if (event.key.length === 1 && alphaNumericChars.includes(event.key)) {
        // Pressed key is alphanumeric
        bytesToWrite.push(event.key.charCodeAt(0));
      } else if (event.key.length === 1 && symbols.includes(event.key)) {
        // Pressed key is a symbol (e.g. ';?.,<>)
        // Do same thing as with alphanumeric cars
        bytesToWrite.push(event.key.charCodeAt(0));
      } else if (event.key === 'Backspace') {
        // Send BS (0x08) or DEL (0x7F)???
        bytesToWrite.push(0x08);
      //===========================================================
      // HANDLE ARROW KEYS
      //===========================================================
      } else if (event.key === 'ArrowLeft') {
        // Send "ESC[D" (go back 1)
        bytesToWrite.push(0x1B, '['.charCodeAt(0), 'D'.charCodeAt(0));
      } else if (event.key === 'ArrowRight') {
        // Send "ESC[C" (go forward 1)
        bytesToWrite.push(0x1B, '['.charCodeAt(0), 'C'.charCodeAt(0));
      } else if (event.key === 'ArrowUp') {
        // Send "ESC[A" (go up 1)
        bytesToWrite.push(0x1B, '['.charCodeAt(0), 'A'.charCodeAt(0));
      } else if (event.key === 'ArrowDown') {
        // Send "ESC[B" (go down 1)
        bytesToWrite.push(0x1B, '['.charCodeAt(0), 'B'.charCodeAt(0));
      } else if (event.key === 'Tab') {
        // Send horizontal tab, HT, 0x09
        bytesToWrite.push(0x09);
      } else {
        // If we get here, we don't know what to do with the key press
        console.log('Unsupported char! event=', event);
        return;
      }
      const writer = this.port?.writable?.getWriter();

      const data = Uint8Array.from(bytesToWrite);
      console.log('Calling writer.write() with data=', data);
      await writer?.write(data);

      // Allow the serial port to be closed later.
      writer?.releaseLock();
      this.txTerminal.parseData(Uint8Array.from(bytesToWrite));
      // Check if local TX echo is enabled, and if so, send the data to
      // the combined single terminal.
      if (this.settings.dataProcessing.appliedData.fields.localTxEcho.value) {
        this.txRxTerminal.parseData(Uint8Array.from(bytesToWrite));
      }
      runInAction(() => {
        this.numBytesTransmitted += bytesToWrite.length;
      })
    } // if (this.portState === PortState.OPENED) {
  }

  clearAllData() {
    this.txRxTerminal.clearData();
    this.txTerminal.clearData();
    this.rxTerminal.clearData();
  }

  setTxRxScrollLock(trueFalse: boolean) {
    this.txRxTextScrollLock = trueFalse;
  }

  setStatusMsgScrollLock(trueFalse: boolean) {
    this.statusMsgScrollLock = trueFalse;
  }
}
