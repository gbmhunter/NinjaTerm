/* eslint-disable no-console */
// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable, runInAction } from 'mobx';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { closeSnackbar }  from 'notistack';


import packageDotJson from '../package.json'
// eslint-disable-next-line import/no-cycle
import { Settings, SettingsCategories } from './Settings/Settings';
import Terminal from './Terminal/SingleTerminal/SingleTerminal';
import Snackbar from './Snackbar';
import Graphing from './Graphing/Graphing';
import FakePortsController from './FakePorts/FakePortsController';
import { Button } from '@mui/material';

declare global {
  interface String {
    insert(index: number, string: string): string;
  }

  // We save the created app instance to window.app (done in index.tsx) so that
  // the test framework Playwright can access it. One use case
  // is to insert data, as it's hard to mock the async serial
  // read bytes function
  interface Window { app: App; }
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

/**
 * Enumerates the possible things to display as the "main pane".
 * This is the large pane that takes up most of the screen.
 */
export enum MainPanes {
  SETTINGS,
  TERMINAL,
  GRAPHING,
}

export enum PortType {
  REAL,
  FAKE,
}

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

  serialPortInfo: Partial<SerialPortInfo> | null;

  keepReading: boolean = true;

  reader: ReadableStreamDefaultReader<Uint8Array> | null;

  closedPromise: Promise<void> | null;

  // Version of the NinjaTerm app. Read from package.json
  version: string;

  snackbar: Snackbar;

  shownMainPane: MainPanes;

  graphing: Graphing;

  // Remembers the last selected port type, so open() and close()
  // know what type of port to operate on
  lastSelectedPortType = PortType.REAL;

  fakePortController: FakePortsController = new FakePortsController(this);

  constructor(
    testing = false
  ) {
    this.testing = testing;
    if (this.testing) {
      console.log('Warning, testing mode is enabled.');
    }

    // Read out the version number from package.json
    this.version = packageDotJson['version'];

    this.settings = new Settings(this);

    this.snackbar = new Snackbar();

    this.txRxTerminal = new Terminal(this, true);
    this.rxTerminal = new Terminal(this, false); // Not focusable
    this.txTerminal = new Terminal(this, true);

    this.numBytesReceived = 0;
    this.numBytesTransmitted = 0;

    this.port = null;
    this.serialPortInfo = null;
    this.reader = null;
    this.closedPromise = null;

    // Show the terminal by default
    this.shownMainPane = MainPanes.TERMINAL;

    // Create graphing instance. Graphing is disabled by default.
    this.graphing = new Graphing(this.snackbar);

    // This is fired whenever a serial port that has been allowed access
    // dissappears (i.e. USB serial), even if we are not connected to it.
    // navigator.serial.addEventListener("disconnect", (event) => {
    //   // TODO: Remove |event.target| from the UI.
    //   // If the serial port was opened, a stream error would be observed as well.
    //   console.log('Serial port removed.');
    // });

    makeAutoObservable(this); // Make sure this near the end
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
    if ("serial" in window.navigator) {
      // The Web Serial API is supported.

      let localPort: SerialPort;


      // If the user clicks cancel, a DOMException is thrown
      try {
        // This makes a browser controlled modal pop-up in
        // where the user selects a serial port
        console.log(window.navigator.serial)
        // return;
        localPort = await window.navigator.serial.requestPort();
      } catch (error) {
          // The only reason I know of that occurs an error to be thrown is
          // when the user clicks cancel.
          this.snackbar.sendToSnackbar('User cancelled port selection.', 'warning');
          return;
      }
      runInAction(() => {
        this.port = localPort;
        this.serialPortInfo = this.port.getInfo();
      })
    } else {
      console.error('Browser not supported, it does not provide the navigator.serial API.');
    }
  }

  async openPort() {
    if (this.lastSelectedPortType === PortType.REAL) {
      try {
        await this.port?.open({
          baudRate: this.settings.selectedBaudRate,
          dataBits: this.settings.selectedNumDataBits,
          parity: this.settings.selectedParity as ParityType,
          stopBits: this.settings.selectedStopBits,
          bufferSize: 10000}); // Default buffer size is only 256 (presumably bytes), which is not enough regularly causes buffer overrun errors
      } catch (error) {
        if (error instanceof DOMException) {
          if (error.name === 'NetworkError') {
            const msg = 'Serial port is already in use by another program.\n'
                      + 'Reported error from port.open():\n'
                      + `${error}`
            this.snackbar.sendToSnackbar(msg, 'error');
            console.log(msg);
          } else {
            const msg = `Unrecognized DOMException error with name=${error.name} occurred when trying to open serial port.\n`
            + 'Reported error from port.open():\n'
            + `${error}`
            this.snackbar.sendToSnackbar(msg, 'error');
            console.log(msg);
          }
        } else {
          // Type of error not recognized or seen before
          const msg = `Unrecognized error occurred when trying to open serial port.\n`
          + 'Reported error from port.open():\n'
          + `${error}`
          this.snackbar.sendToSnackbar(msg, 'error');
          console.log(msg);
        }

        // An error occurred whilst calling port.open(), so DO NOT continue, port
        // cannot be considered open
        return;
      }
      this.snackbar.sendToSnackbar('Serial port opened.', 'success');
      this.setPortState(PortState.OPENED);
      // This will automatically close the settings window if the user is currently in it,
      // clicks "Open" and the port opens successfully.
      if (this.closeSettingsDialogOnPortOpenOrClose) {
        this.setSettingsDialogOpen(false);
      }

      this.keepReading = true;
      this.closedPromise = this.readUntilClosed();
    } else if (this.lastSelectedPortType === PortType.FAKE) {
      this.fakePortController.openPort();
    } else {
      throw Error('Unsupported port type!');
    }
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
          // These error are described at https://wicg.github.io/serial/
          // @ts-ignore:
          if (error instanceof DOMException) {
            console.log('Exception was DOMException. error.name=', error.name);
            // BufferOverrunError: Rendering couldn't get up with input data,
            // potentially make buffer size to port.open() larger or speed up processing/rendering
            // if this occurs often. This is non-fatal, readable will not be null
            if (error.name === 'BufferOverrunError') {
              this.snackbar.sendToSnackbar('RX buffer overrun occurred. Too much data is coming in for the app to handle.\n'
                                  + 'Returned error from reader.read():\n'
                                  + `${error}`,
                                  'warning');
            } else if (error.name === 'BreakError') {
              this.snackbar.sendToSnackbar('Encountered break signal.\n'
                                  + 'Returned error from reader.read():\n'
                                  + `${error}`,
                                  'warning');
            } else if (error.name === 'FramingError') {
              this.snackbar.sendToSnackbar('Encountered framing error.\n'
                                  + 'Returned error from reader.read():\n'
                                  + `${error}`,
                                  'warning');
            }  else if (error.name === 'ParityError') {
              this.snackbar.sendToSnackbar('Encountered parity error.\n'
                                  + 'Returned error from reader.read():\n'
                                  + `${error}`,
                                  'warning');
            }  else {
              const msg = `Unrecognized DOMException error with name=${error.name} occurred when trying to read from serial port.\n`
                          + 'Reported error from port.read():\n'
                          + `${error}`;
              this.snackbar.sendToSnackbar(msg, 'error');
              console.log(msg);
            }
          } else {
            this.snackbar.sendToSnackbar(`Serial port was removed unexpectedly.\nReturned error from reader.read():\n${error}`, 'error');
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
   * In normal operation this is called from the readUntilClose() function above.
   *
   * Unit tests call this instead of mocking out the serial port read() function
   * as setting up the deferred promise was too tricky.
   *
   * @param rxData
   */
  parseRxData(rxData: Uint8Array) {
    console.log('parseRxData() called. rxData=', rxData);
    // Send received data to both the single TX/RX terminal
    // and the RX terminal
    this.txRxTerminal.parseData(rxData);
    this.rxTerminal.parseData(rxData);
    this.graphing.parseData(rxData);
    this.numBytesReceived += rxData.length;
  }

  async closePort() {
    if (this.lastSelectedPortType === PortType.REAL) {
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
      this.snackbar.sendToSnackbar('Serial port closed.', 'success');
      this.reader = null;
      this.closedPromise = null;
    } else if (this.lastSelectedPortType === PortType.FAKE) {
      this.fakePortController.closePort();
    } else {
      throw Error('Unsupported port type!');
    }
  }

  setPortState(newPortState: PortState) {
    this.portState = newPortState;
  }

  /**
   * This is called from either the TX/RX terminal or TX terminal
   * (i.e. any terminal pane that is allowed to send data). This function
   * determines what the user has pressed and what data to send out the
   * serial port because of it.
   *
   * @param event The React keydown event.
   * @returns Nothing.
   */
  async handleTerminalKeyDown(event: React.KeyboardEvent) {
    console.log('handleTerminalKeyDown() called. event.key=', event.key);

    // Capture all key presses and prevent default actions or bubbling.
    // preventDefault() prevents a Tab press from moving focus to another element on screen
    event.preventDefault();
    event.stopPropagation();

    if (this.portState === PortState.OPENED) {
      // Serial port is open, let's send it to the serial
      // port

      // Convert event.key to required ASCII number. This would be easier if we could
      // use keyCode, but this method is deprecated!
      const bytesToWrite: number[] = [];
      // List of allowed symbols, includes space char also
      const symbols = '`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/? ';
      const alphaNumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqurstuvwxyz0123456789'
      if (event.key === 'Control' || event.key === 'Shift') {
        // Don't send anything if a control key/shift key was pressed by itself
        return;
      } else if (event.key === 'Enter') {
        // TODO: Add support for sending different things on enter
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
      // console.log('Calling writer.write() with data=', data);
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

  /**
   * Sets the main pane to be shown.
   */
  setShownMainPane(newPane: MainPanes) {
    this.shownMainPane = newPane;
  }

  /** Handles any stray key press that was not caught by a child node.
   * For example, pressing "f" while on the Port Configuration settings
   * this cause this function to be called.
   *
   * This is not the function that sends data out the serial port, that
   * is handleTerminalKeyDown(), which is called by the Terminals.
   */
  handleKeyDown(event: React.KeyboardEvent) {
    if (this.shownMainPane === MainPanes.SETTINGS
        && this.settings.activeSettingsCategory === SettingsCategories.PORT_CONFIGURATION
        && event.key === 'f') {
      this.fakePortController.setIsDialogOpen(true);
    }
  }

  swOnNeedRefresh(updateSw: (reloadPage?: boolean | undefined) => Promise<void>) {
    console.log('onNeedRefresh() called.');
    this.snackbar.sendToSnackbar(
      'A new version of NinjaTerm is available. Click Reload to update.',
      'info',
      (snackbarId) => <>
        <Button
          onClick={() => {
            updateSw(true);
          }}
          color='info'
          variant='text'
          sx={{
            color: 'rgb(33, 150, 243)',
            backgroundColor: 'white'
          }}
        >
          Reload
        </Button>
        <Button
          onClick={() => {
            closeSnackbar(snackbarId);
          }}
          color='info'
          variant='text'
          sx={{
            color: 'white',
            // backgroundColor: 'white'
          }}
        >Close</Button>
      </>,
      true, // Make this snackbar persist until the user clicks either of the buttons
    );
  }

  swOnOfflineReady() {
    console.log('onOfflineReady() called.');
    this.snackbar.sendToSnackbar('NinjaTerm is offline ready.', 'info');
  }

  swOnRegisterError(error: any) {
    console.log('onRegisterError() called.');
    console.error(error.message);
  }
}
