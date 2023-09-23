/* eslint-disable no-console */
// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable, runInAction, observe } from 'mobx';

import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { SnackbarProvider, enqueueSnackbar } from 'notistack';

import DataPane from './DataPane';
import TextSegmentController from './TextSegmentController';
import { StatusMsg, StatusMsgSeverity } from './StatusMsg';
// eslint-disable-next-line import/no-cycle
import { Settings } from './Settings/Settings';
import Terminal from './Terminal/Terminal';

// console.log(version);

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

export const portStateToButtonProps: {
  [key in PortState]: PortStateToButtonPropsItem;
} = {
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

function padTo2Digits(num: number) {
  return num.toString().padStart(2, '0');
}

/**
 * Converts a date into a readable string for the status bar.
 *
 * @param date Converts a Date object into a string in the
 *    format YY-MM-DD HH:MM:SS.
 * @returns Converted string.
 */
function formatDate(date: Date) {
  return (
    // eslint-disable-next-line prefer-template
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('-') +
    ' ' +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(':')
  );
}

export class App {

  settings: Settings;

  settingsDialogOpen = false;

  // If true, the settings dialog will be automatically closed on port open or close
  closeSettingsDialogOnPortOpenOrClose = true;

  /** Contains the text data for the status textarea. */
  statusMsgs: StatusMsg[] = [];

  portState = PortState.CLOSED;

  dataPane1: DataPane;

  dataPane2: DataPane;

  rxData = '';

  txSegments: TextSegmentController;

  rxSegments: TextSegmentController;

  txRxSegments: TextSegmentController;

  // NEW

  txRxTerminal: Terminal;

  rxTerminal: Terminal;

  txTerminal: Terminal;

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

  constructor(
    testing = false
  ) {
    this.testing = testing;

    this.settings = new Settings(this);

    // Need to create terminals before settings, as the settings
    // will configure the terminals
    this.txRxTerminal = new Terminal(this.settings);
    this.rxTerminal = new Terminal(this.settings);
    this.txTerminal = new Terminal(this.settings);

    this.dataPane1 = new DataPane();
    this.dataPane2 = new DataPane();

    this.txSegments = new TextSegmentController();
    this.rxSegments = new TextSegmentController();
    // A mix of both TX and RX data. Displayed when the "Single Terminal"
    // view configuration is selected.
    this.txRxSegments = new TextSegmentController();

    this.port = null;
    this.serialPortInfo = null;
    this.reader = null;
    this.closedPromise = null;

    this.snackBarOpen = false;

    console.log('Started NinjaTerm.')

    // This is fired whenever a serial port that has been allowed access
    // dissappears (i.e. USB serial), even if we are not connected to it.
    // navigator.serial.addEventListener("disconnect", (event) => {
    //   // TODO: Remove |event.target| from the UI.
    //   // If the serial port was opened, a stream error would be observed as well.
    //   console.log('Serial port removed.');
    // });

    makeAutoObservable(this); // Make sure this near the end
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
          console.log('Error occured. error=', error);
          enqueueSnackbar('User cancelled port selection.', { variant: 'error'});
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


    // this.SerialPortType.list()
    //   .then((ports) => {
    //     this.settings.setAvailablePortInfos(ports);
    //     // Set the selected port, this doesn't fire automatically if setting
    //     // the ports via code
    //     if (ports.length > 0) {
    //       this.settings.setSelectedPortPath(ports[0].path);
    //     }
    //     this.addStatusBarMsg(
    //       `Port scan complete. Found ${ports.length} ports.`,
    //       StatusMsgSeverity.INFO,
    //       true
    //     );
    //     return 0;
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //     this.addStatusBarMsg(`${error}`, StatusMsgSeverity.ERROR, true);
    //   });
  }

  async openPort() {
    // this.addStatusBarMsg('Opening port...', StatusMsgSeverity.INFO, true);
    // this.serialPort = new this.SerialPortType({
    //   path: this.settings.selectedPortPath,
    //   baudRate: this.settings.selectedBaudRate,
    //   dataBits: this.settings.selectedNumDataBits as 5 | 6 | 7 | 8,
    //   parity: this.settings.selectedParity as
    //     | 'none'
    //     | 'even'
    //     | 'odd'
    //     | 'mark'
    //     | 'space',
    //   stopBits: this.settings.selectedStopBits,
    //   autoOpen: false, // Prevent serial port from opening until we call open()
    // });

    // navigator.serial.addEventListener("connect", (event) => {
    //   // TODO: Automatically open event.target or warn user a port is available.
    //   console.log('connect event called.');
    // });

    await this.port?.open({baudRate: this.settings.selectedBaudRate})
    console.log('Serial port opened.');
    enqueueSnackbar('Serial port opened.', { variant: 'success'});
    this.setPortState(PortState.OPENED);
    // This will automatically close the settings window if the user is currently in it,
    // clicks "Open" and the port opens successfully.
    if (this.closeSettingsDialogOnPortOpenOrClose) {
      this.setSettingsDialogOpen(false);
    }

    this.keepReading = true;
    this.closedPromise = this.readUntilClosed();
  }

  /** Continuously reads from the serial port. */
  async readUntilClosed() {
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
          enqueueSnackbar('Serial port was removed unexpectedly.', { variant: 'error'});
          this.setPortState(PortState.CLOSED);
          runInAction(() => {
            // Setting this.port to null means the port needs to be
            // reselected in the UI (which makes sense because we just
            // lost it)
            this.port = null;
            this.closedPromise = null;
          });
      } finally {
        // Allow the serial port to be closed later.
        this.reader.releaseLock();
      }
    }

    await this.port?.close();
  }

  parseRxData(value: Uint8Array) {
    // Send received data to both the single TX/RX terminal
    // and the RX terminal
    this.txRxTerminal.parseData(value);
    this.rxTerminal.parseData(value);
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
    enqueueSnackbar('Serial port closed.', { variant: 'success'});
    this.reader = null;
    this.closedPromise = null;
  }

  setPortState(newPortState: PortState) {
    this.portState = newPortState;
  }

  /**
   * Call this to add a message to the status bar at the bottom of the main view.
   *
   * @param msg Message to output to the status bar. Message should include new line character.
   */
  addStatusBarMsg = (
    msg: string,
    severity: StatusMsgSeverity,
    showInPortSettings: boolean = false
  ) => {
    const currDate = new Date();
    this.statusMsgs.push(
      new StatusMsg(
        this.statusMsgs.length,
        `${formatDate(currDate)}: ${msg}`,
        severity,
        showInPortSettings
      )
    );
  };

  async handleKeyPress(event: KeyboardEvent) {
    console.log('handleKeyPress() called. event=', event, this);
    if (this.portState === PortState.OPENED) {
      // Serial port is open, let's send it to the serial
      // port

      // Convert event.key to required ASCII number. This would be easier if we could
      // use keyCode, but this method is deprecated!
      const bytesToWrite: number[] = [];
      const isLetter =
        (event.key >= 'a' && event.key <= 'z') ||
        (event.key >= 'A' && event.key <= 'Z');
      const isNumber = event.key >= '0' && event.key <= '9';
      // List of allowed symbols
      const symbols = '`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/?';
      const isSymbol = symbols.includes(event.key);
      if (event.ctrlKey) {
        // Don't send anything if a control key was held down
        return;
      }

      if (event.key === 'Enter') {
        bytesToWrite.push(13);
        bytesToWrite.push(10);
        // this.txTerminal.parseData(Buffer.from('\n'));
        // this.txRxTerminal.parseData(Buffer.from('\n'));
      } else if (isLetter || isNumber || isSymbol) {
        bytesToWrite.push(event.key.charCodeAt(0));
      } else {
        console.log('Unsupported char!');
      }
      const writer = this.port?.writable?.getWriter();

      const data = Uint8Array.from(bytesToWrite);
      await writer?.write(data);

      // Allow the serial port to be closed later.
      writer?.releaseLock();
      this.txTerminal.parseData(Uint8Array.from(bytesToWrite));
      // Check if local TX echo is enabled, and if so, send the data to
      // the combined single terminal.
      if (this.settings.dataProcessing.appliedData.fields.localTxEcho.value) {
        this.txRxTerminal.parseData(Uint8Array.from(bytesToWrite));
      }
    }
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
