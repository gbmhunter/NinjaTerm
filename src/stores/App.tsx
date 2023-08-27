import { makeAutoObservable } from 'mobx';
import { SerialPort } from 'serialport';

import NewLineParser from 'util/NewLineParser/NewLineParser';
import AnsiECParser from 'util/AnsiECParser/AnsiECParser';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import StreamedData from 'util/StreamedData/StreamedData';
import TextSegment from './TextSegment';
import DataPane from './DataPane';
import { StatusMsg, StatusMsgSeverity } from './StatusMsg';
// eslint-disable-next-line import/no-cycle
import { SettingsStore } from './Settings/Settings';

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

const defaultTxRxColor = 'rgb(255, 255, 255)';

export class AppStore {
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

  serialPort: null | SerialPort = null;

  portState = PortState.CLOSED;

  dataPane1: DataPane;

  dataPane2: DataPane;

  rxData = '';

  // Keeps track of how many characters have been inserted into
  // the RX pane. Used for working out when the oldest data needs
  // to be removed because it has exceeded the scrollback limit.
  numCharsInRxPane = 0;

  input: StreamedData;

  newLineParser: NewLineParser;

  buffer1: StreamedData;

  ansiECParser: AnsiECParser;

  output: StreamedData;

  rxSegments: TextSegment[] = [];

  // If true, the TX/RX panel scroll will be locked at the bottom
  txRxTextScrollLock = true;

  // If true, the status msg panel scroll will be locked at the bottom
  statusMsgScrollLock = true;

  constructor() {
    this.settings = new SettingsStore(this);
    makeAutoObservable(this);

    this.dataPane1 = new DataPane();
    this.dataPane2 = new DataPane();

    this.input = new StreamedData();
    this.ansiECParser = new AnsiECParser();
    this.buffer1 = new StreamedData();
    this.newLineParser = new NewLineParser('\n');
    this.output = new StreamedData();

    // This also sets up the default 1st text segment
    this.clearRxData();

    this.addStatusBarMsg('Started NinjaTerm.', StatusMsgSeverity.INFO);
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
    SerialPort.list()
      .then((ports) => {
        this.settings.setAvailablePortInfos(ports);
        // Set the selected port, this doesn't fire automatically if setting
        // the ports via code
        if (ports.length > 0) {
          this.settings.setSelectedPortPath(ports[0].path);
        }
        // this.setPortStatusMsg({
        //   text: `Port scan complete. Found ${ports.length} ports.`,
        //   type: PortStatusMsgType.OK,
        // });
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

  openPort() {
    this.addStatusBarMsg('Opening port...', StatusMsgSeverity.INFO, true);
    this.serialPort = new SerialPort({
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
      this.addNewRxData(data);
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

  /**
   * Processes newly received serial data through the various parsing streams, all the way
   * to output data which is displayed to the user.
   */
  addNewRxData(data: Buffer) {
    this.rxData += data.toString();

    this.input.append(data.toString());
    this.newLineParser.parse(this.input, this.buffer1);
    this.ansiECParser.parse(this.buffer1, this.output);
    // this.output contains the new data needed to be add to the RX terminal window

    // Copy all text before first ColourMarker entry into the first text node
    let indexOfLastCharPlusOne: number;
    if (this.output.getColourMarkers().length === 0) {
      indexOfLastCharPlusOne = this.output.getText().length;
    } else {
      indexOfLastCharPlusOne = this.output.getColourMarkers()[0].getCharPos();
    }

    let textToAppend = this.output
      .getText()
      .substring(0, indexOfLastCharPlusOne);

    // Create new line characters for all new line markers that point to text
    // shifted above
    let currNewLineMarkerIndex = 0;
    for (let i = 0; i < this.output.getNewLineMarkers().length; i += 1) {
      if (
        this.output.getNewLineMarkers()[currNewLineMarkerIndex].charPos >
        indexOfLastCharPlusOne
      )
        break;

      textToAppend.insert(
        this.output.getNewLineMarkers()[currNewLineMarkerIndex].charPos + i,
        '\n' // New line character
      );
      currNewLineMarkerIndex += 1;
    }

    // Add this remaining text to the last existing element in the RX segments
    const lastRxSegment = this.rxSegments[this.rxSegments.length - 1];
    lastRxSegment.text += textToAppend;
    this.numCharsInRxPane += textToAppend.length;

    // Create new text nodes and copy all text
    // This loop won't run if there is no elements in the TextColors array
    for (let x = 0; x < this.output.getColourMarkers().length; x += 1) {
      // defaultTextColorActive = false;
      const indexOfFirstCharInNode = this.output
        .getColourMarkers()
        [x].getCharPos();

      let indexOfLastCharInNodePlusOne = 0;
      if (x >= this.output.getColourMarkers().length - 1) {
        indexOfLastCharInNodePlusOne = this.output.getText().length;
      } else {
        indexOfLastCharInNodePlusOne = this.output
          .getColourMarkers()
          [x + 1].getCharPos();
      }

      textToAppend = this.output
        .getText()
        .substring(indexOfFirstCharInNode, indexOfLastCharInNodePlusOne);

      // Create new line characters for all new line markers that point to text
      // shifted above
      let insertionCount = 0;
      while (true) {
        if (currNewLineMarkerIndex >= this.output.getNewLineMarkers().length)
          break;

        if (
          this.output.getNewLineMarkers()[currNewLineMarkerIndex].getCharPos() >
          indexOfLastCharInNodePlusOne
        )
          break;

        textToAppend.insert(
          this.output.getNewLineMarkers()[currNewLineMarkerIndex].getCharPos() +
            insertionCount -
            indexOfFirstCharInNode,
          '\n'
        ); // New line char
        currNewLineMarkerIndex += 1;
        insertionCount += 1;
      }

      // Add this remaining text to a new text segment
      const textColor = this.output.getColourMarkers()[x].color;
      const newTextSegment = new TextSegment(
        textToAppend.toString(),
        textColor,
        this.rxSegments[this.rxSegments.length - 1].key + 1 // Increment key by 1
      );

      this.rxSegments.push(newTextSegment);
      this.numCharsInRxPane += newTextSegment.text.length;
    }

    this.output.clear();

    // ================ TRIM SCROLLBACK BUFFER ===============//
    // Trim RX segments if total amount of text exceeds scrollback buffer size
    const scrollbackSizeChars =
      this.settings.dataProcessing.appliedData.fields.scrollbackBufferSizeChars
        .value;
    while (this.numCharsInRxPane > scrollbackSizeChars) {
      const numCharsToRemove = this.numCharsInRxPane - scrollbackSizeChars;
      // Remove chars from the oldest text segment first
      const numCharsInOldestSegment = this.rxSegments[0].text.length;
      if (numCharsToRemove >= numCharsInOldestSegment) {
        // We can remove the whole text segment, unless it's only one.
        this.rxSegments.shift();
        this.numCharsInRxPane -= numCharsInOldestSegment;
      } else {
        // The oldest text segment has more chars than what we need to remove,
        // so just trim
        this.rxSegments[0].text =
          this.rxSegments[0].text.slice(numCharsToRemove);
        this.numCharsInRxPane -= numCharsToRemove;
      }
    }
  }

  clearRxData() {
    // Clear any existing segments
    this.rxSegments = [];
    // Create a default segment for data to go into. If no ANSI escape codes
    // are received, this will the one and only text segment
    // debugger;
    this.rxSegments.push(new TextSegment('', defaultTxRxColor, 0));
    // Reset char count also
    this.numCharsInRxPane = 0;
  }

  setTxRxScrollLock(trueFalse: boolean) {
    this.txRxTextScrollLock = trueFalse;
  }

  setStatusMsgScrollLock(trueFalse: boolean) {
    this.statusMsgScrollLock = trueFalse;
  }
}
