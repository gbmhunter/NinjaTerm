/* eslint-disable no-console */
// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable } from 'mobx';
import { SerialPort, SerialPortMock } from 'serialport';

import NewLineParser from 'util/NewLineParser/NewLineParser';
import AnsiECParser from 'util/AnsiECParser/AnsiECParser';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import StreamedData from 'util/StreamedData/StreamedData';
import DataPane from './DataPane';
import TextSegmentController from './TextSegmentController';
import { StatusMsg, StatusMsgSeverity } from './StatusMsg';
// eslint-disable-next-line import/no-cycle
import { SettingsStore } from './Settings/Settings';
import Terminal from './Terminal/Terminal';

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

export class App {
  SerialPortType: typeof SerialPort | typeof SerialPortMock;

  settings: SettingsStore;

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

  serialPort: null | SerialPort | SerialPortMock = null;

  portState = PortState.CLOSED;

  dataPane1: DataPane;

  dataPane2: DataPane;

  rxData = '';

  input: StreamedData;

  newLineParser: NewLineParser;

  buffer1: StreamedData;

  ansiECParser: AnsiECParser;

  output: StreamedData;

  txSegments: TextSegmentController;

  rxSegments: TextSegmentController;

  txRxSegments: TextSegmentController;

  // NEW

  txRxTerminal: Terminal;

  // If true, the TX/RX panel scroll will be locked at the bottom
  txRxTextScrollLock = true;

  // If true, the status msg panel scroll will be locked at the bottom
  statusMsgScrollLock = true;

  // If true app is being tested by code.
  // Used for force terminal height to value when browser is not
  // available to determine height
  testing: boolean;

  constructor(
    SerialPortType: typeof SerialPort | typeof SerialPortMock,
    testing = false
  ) {
    this.testing = testing;
    // Need to create terminal before settings, as the settings
    // will configure the terminal
    this.txRxTerminal = new Terminal();

    this.settings = new SettingsStore(this);

    this.dataPane1 = new DataPane();
    this.dataPane2 = new DataPane();

    this.input = new StreamedData();
    this.ansiECParser = new AnsiECParser();
    this.buffer1 = new StreamedData();
    this.newLineParser = new NewLineParser('\n');
    this.output = new StreamedData();

    this.txSegments = new TextSegmentController();
    this.rxSegments = new TextSegmentController();
    // A mix of both TX and RX data. Displayed when the "COMBINED_TX_RX_PANE"
    // view configuration is selected.
    this.txRxSegments = new TextSegmentController();

    this.addStatusBarMsg('Started NinjaTerm.', StatusMsgSeverity.INFO);
    makeAutoObservable(this); // Make sure this near the end

    // WARNING: Make sure this is after makeAutoObservable()!!!
    this.SerialPortType = SerialPortType;
  }

  setSettingsDialogOpen(trueFalse: boolean) {
    this.settingsDialogOpen = trueFalse;
    // If opening the settings dialog, also scan for ports
    if (trueFalse) {
      this.scanForPorts();
    }
  }

  setCloseSettingsDialogOnPortOpenOrClose(trueFalse: boolean) {
    this.closeSettingsDialogOnPortOpenOrClose = trueFalse;
  }

  /**
   * Scans the computer for available serial ports, and updates availablePortInfos.
   */
  scanForPorts() {
    this.SerialPortType.list()
      .then((ports) => {
        this.settings.setAvailablePortInfos(ports);
        // Set the selected port, this doesn't fire automatically if setting
        // the ports via code
        if (ports.length > 0) {
          this.settings.setSelectedPortPath(ports[0].path);
        }
        this.addStatusBarMsg(
          `Port scan complete. Found ${ports.length} ports.`,
          StatusMsgSeverity.INFO,
          true
        );
        return 0;
      })
      .catch((error) => {
        console.log(error);
        this.addStatusBarMsg(`${error}`, StatusMsgSeverity.ERROR, true);
      });
  }

  async openPort() {
    this.addStatusBarMsg('Opening port...', StatusMsgSeverity.INFO, true);
    this.serialPort = new this.SerialPortType({
      path: this.settings.selectedPortPath,
      baudRate: this.settings.selectedBaudRate,
      dataBits: this.settings.selectedNumDataBits as 5 | 6 | 7 | 8,
      parity: this.settings.selectedParity as
        | 'none'
        | 'even'
        | 'odd'
        | 'mark'
        | 'space',
      stopBits: this.settings.selectedStopBits,
      autoOpen: false, // Prevent serial port from opening until we call open()
    });

    // The open event is always emitted
    this.serialPort.on('open', () => {
      // open logic
      this.setPortState(PortState.OPENED);
      this.addStatusBarMsg(
        'Port opened successfully.',
        StatusMsgSeverity.OK,
        true
      );
      // This will automatically close the settings window if the user is currently in it,
      // clicks "Open" and the port opens successfully.
      if (this.closeSettingsDialogOnPortOpenOrClose) {
        this.setSettingsDialogOpen(false);
      }
    });

    if (this.serialPort.isOpen) {
      console.log('WARNING: Serial port already open!!!');
    }
    this.serialPort.open((error) => {
      if (error) {
        console.log(error);
        // Error already says "Error" at the start
        this.addStatusBarMsg(`${error}`, StatusMsgSeverity.ERROR, true);
      }
    });

    // Switches the port into "flowing mode"
    this.serialPort.on('data', (data) => {
      // this.addNewRxData(data);
      this.txRxTerminal.parseData(data);
    });
  }

  closePort() {
    if (!this.serialPort?.isOpen) {
      console.log('closePort() called but port was not open.');
      return;
    }
    this.serialPort?.close(() => {
      this.setPortState(PortState.CLOSED);
      // This will automatically close the settings window if the user is currently in it,
      // clicks "Close" and the port closes successfully.
      if (this.closeSettingsDialogOnPortOpenOrClose) {
        this.setSettingsDialogOpen(false);
      }
      this.addStatusBarMsg(
        'Port successfully closed.',
        StatusMsgSeverity.OK,
        true
      );
    });
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
        `${currDate.toISOString()}: ${msg}`,
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
      } else if (isLetter || isNumber || isSymbol) {
        bytesToWrite.push(event.key.charCodeAt(0));
      } else {
        console.log('Unsupported char!');
      }
      console.log('Writing to serial port. bytesToWrite=', bytesToWrite);
      this.serialPort?.write(bytesToWrite, (error) => {
        if (error) {
          this.addStatusBarMsg(
            `Could not write data to serial port. data=${event.key}, error=${error}.`,
            StatusMsgSeverity.ERROR
          );
        } else {
          // Sending was successful, increment TX count and insert sent data
          // into TX and TXRX segments for showing in pane(s)
          this.txSegments.appendText(String.fromCharCode(...bytesToWrite));
          this.txRxSegments.appendText(String.fromCharCode(...bytesToWrite));
        }
      });
    }
  }

  clearAllData() {
    this.txRxTerminal.clearData();
  }

  setTxRxScrollLock(trueFalse: boolean) {
    this.txRxTextScrollLock = trueFalse;
  }

  setStatusMsgScrollLock(trueFalse: boolean) {
    this.statusMsgScrollLock = trueFalse;
  }
}
