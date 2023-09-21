/* eslint-disable no-console */
// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable, runInAction } from 'mobx';

import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

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

  /** The one status message is display in the port settings dialog */
  portSettingsMsg: StatusMsg = new StatusMsg(
    0,
    '',
    StatusMsgSeverity.INFO,
    true
  );

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

  constructor(
    testing = false
  ) {
    this.testing = testing;
    // Need to create terminals before settings, as the settings
    // will configure the terminals
    this.txRxTerminal = new Terminal();
    this.rxTerminal = new Terminal();
    this.txTerminal = new Terminal();

    this.settings = new Settings(this);

    this.dataPane1 = new DataPane();
    this.dataPane2 = new DataPane();

    this.txSegments = new TextSegmentController();
    this.rxSegments = new TextSegmentController();
    // A mix of both TX and RX data. Displayed when the "COMBINED_TX_RX_PANE"
    // view configuration is selected.
    this.txRxSegments = new TextSegmentController();

    this.port = null;
    this.serialPortInfo = null;

    this.addStatusBarMsg('Started NinjaTerm.', StatusMsgSeverity.INFO);
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
   */
  async scanForPorts() {
    // Prompt user to select any serial port.
    console.log('hfhfh');
    if ("serial" in navigator) {
      // The Web Serial API is supported.
      const localPort = await navigator.serial.requestPort();
      runInAction(() => {
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

    navigator.serial.addEventListener("connect", (event) => {
      // TODO: Automatically open event.target or warn user a port is available.
      console.log('connect event called.');
    });

    await this.port?.open({baudRate: this.settings.selectedBaudRate})
    console.log('Serial port opened.');
    this.setPortState(PortState.OPENED);
      // this.addStatusBarMsg(
      //   'Port opened successfully.',
      //   StatusMsgSeverity.OK,
      //   true
      // );
    // This will automatically close the settings window if the user is currently in it,
    // clicks "Open" and the port opens successfully.
    if (this.closeSettingsDialogOnPortOpenOrClose) {
      this.setSettingsDialogOpen(false);
    }
    

    await this.readUntilClosed();

    // // The open event is always emitted
    // this.serialPort.on('open', () => {
    //   // open logic
    //   this.setPortState(PortState.OPENED);
    //   this.addStatusBarMsg(
    //     'Port opened successfully.',
    //     StatusMsgSeverity.OK,
    //     true
    //   );
    //   // This will automatically close the settings window if the user is currently in it,
    //   // clicks "Open" and the port opens successfully.
    //   if (this.closeSettingsDialogOnPortOpenOrClose) {
    //     this.setSettingsDialogOpen(false);
    //   }
    // });

    // if (this.serialPort.isOpen) {
    //   console.log('WARNING: Serial port already open!!!');
    // }
    // this.serialPort.open((error) => {
    //   if (error) {
    //     console.log(error);
    //     // Error already says "Error" at the start
    //     this.addStatusBarMsg(`${error}`, StatusMsgSeverity.ERROR, true);
    //   }
    // });

    // // Switches the port into "flowing mode"
    // this.serialPort.on('data', (data) => {
    //   this.rxTerminal.parseData(data);
    //   this.txRxTerminal.parseData(data);
    // });
  }

  async readUntilClosed() {
    // this.txRxTerminal.parseData(Buffer.from('s'));
    while (this.port?.readable && this.keepReading) {
      const reader = this.port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            // reader.cancel() has been called.
            break;
          }
          // value is a Uint8Array.
          this.txRxTerminal.parseData(value);
        }
      } catch (error) {
        // Handle error...
      } finally {
        // Allow the serial port to be closed later.
        reader.releaseLock();
      }
    }
  
    await this.port?.close();
  }

  closePort() {
    // if (!this.serialPort?.isOpen) {
    //   console.log('closePort() called but port was not open.');
    //   return;
    // }
    // this.serialPort?.close(() => {
    //   this.setPortState(PortState.CLOSED);
    //   // This will automatically close the settings window if the user is currently in it,
    //   // clicks "Close" and the port closes successfully.
    //   if (this.closeSettingsDialogOnPortOpenOrClose) {
    //     this.setSettingsDialogOpen(false);
    //   }
    //   this.addStatusBarMsg(
    //     'Port successfully closed.',
    //     StatusMsgSeverity.OK,
    //     true
    //   );
    // });
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
    // If showInPortSettings is true, replace the port settings message
    if (showInPortSettings) {
      this.portSettingsMsg = new StatusMsg(
        0, // Doesn't actually matter
        msg,
        severity,
        true // Doesn't actually matter
      );
    }
  };

  handleKeyPress(event: KeyboardEvent) {
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
      console.log('Writing to serial port. bytesToWrite=', bytesToWrite);
      // this.serialPort?.write(bytesToWrite, (error) => {
      //   if (error) {
      //     this.addStatusBarMsg(
      //       `Could not write data to serial port. data=${event.key}, error=${error}.`,
      //       StatusMsgSeverity.ERROR
      //     );
      //   } else {
      //     // Sending was successful, increment TX count and insert sent data
      //     // into TX and TXRX segments for showing in pane(s)
      //     this.txTerminal.parseData(Buffer.from(bytesToWrite));
      //     this.txRxTerminal.parseData(Buffer.from(bytesToWrite));
      //   }
      // });
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
