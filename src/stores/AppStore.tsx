import { makeAutoObservable, reaction } from 'mobx';
import { SerialPort } from 'serialport';

import NewLineParser from 'util/NewLineParser/NewLineParser';
import AnsiECParser from 'util/AnsiECParser/AnsiECParser';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import StreamedData from 'util/StreamedData/StreamedData';
import TextSegment from './TextSegmentStore';
import { StatusMsg, StatusMsgSeverity } from './StatusMsg';
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
  settings = new SettingsStore();

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

  rxData = '';

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
    makeAutoObservable(this);

    this.input = new StreamedData();
    this.ansiECParser = new AnsiECParser();
    this.buffer1 = new StreamedData();
    this.newLineParser = new NewLineParser('\n');
    this.output = new StreamedData();

    // This also sets up the default 1st text segment
    this.clearRxData();

    // reaction(
    //   () => this.settings.dataProcessingSettings.ansiEscapeCodeParsingEnabled,
    //   (ansiEscapeCodeParsingEnabled) => {
    //     this.ansiECParser.isEnabled = ansiEscapeCodeParsingEnabled;
    //     if (this.ansiECParser.isEnabled) {
    //       this.addStatusBarMsg(
    //         'ANSI escape code parsing enabled.',
    //         StatusMsgSeverity.INFO
    //       );
    //     } else {
    //       this.addStatusBarMsg(
    //         'ANSI escape code parsing disabled.',
    //         StatusMsgSeverity.INFO
    //       );
    //     }
    //   }
    // );

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
      // stopBits: this.settings.sele
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
   * Adds newly received data to the received data buffer for displaying.
   */
  addNewRxData(data: Buffer) {
    // this.txRxText += rxData;

    this.rxData += data.toString();

    this.input.append(data.toString());
    this.newLineParser.parse(this.input, this.buffer1);
    this.ansiECParser.parse(this.buffer1, this.output);
    // this.output contains the new data needed to be add to the RX terminal window

    // const lastRxSegment = this.rxSegments[this.rxSegments.length - 1];
    // lastRxSegment.text += this.output.text;
    // lastRxSegment.key += 1;

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

    // Create new text nodes and copy all text
    // This loop won't run if there is no elements in the TextColors array
    // int currIndexToInsertNodeAt = nodeIndexToStartShift;
    for (let x = 0; x < this.output.getColourMarkers().length; x += 1) {
      // defaultTextColorActive = false;
      // Text newText = new Text();

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

      //            logger.debug("textToAppend (before new lines added) = " + textToAppend);

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

      // Add this remaining text to the last existing element in the RX segments
      const textColor = this.output.getColourMarkers()[x].color;
      const newTextSegment = new TextSegment(
        textToAppend.toString(),
        textColor,
        this.rxSegments.length
      );

      this.rxSegments.push(newTextSegment);

      //            logger.debug("textToAppend (after new lines added) = " + textToAppend);

      // ==============================================//
      // ==== ADD TEXT TO STYLEDTEXTAREA AND COLOUR ===//
      // ==============================================//

      //         final int insertionStartIndex = styledTextArea.getLength();
      //         styledTextArea.replaceText(insertionStartIndex, insertionStartIndex, textToAppend.toString());
      //         final int insertionStopIndex = styledTextArea.getLength();

      // //            logger.debug("insertionStartIndex = " + insertionStartIndex + ", insertionStopIndex = " + insertionStopIndex);

      //         final Color textColor = streamedData.getColourMarkers().get(x).color;

      //         styledTextArea.setStyle(
      //                 insertionStartIndex,
      //                 insertionStopIndex,
      //                 "-fx-fill: " + javaColorToCSS(textColor) + "; -fx-font-family: monospace; -fx-font-size: " + fontSizePx + "px;");

      //         // Update the num. chars added with all the text added to this new Text node
      //         numCharsAdded += textToAppend.length();
    }

    this.output.clear();

    //     //==============================================//
    //     //============= INPUT ARG CHECKS ===============//
    //     //==============================================//

    //     numCharsAdded = 0;

    //         //==============================================//
    //         //=== ADD ALL TEXT BEFORE FIRST COLOUR CHANGE ==//
    //         //==============================================//

    //         // Copy all text before first ColourMarker entry into the first text node

    //         let indexOfLastCharPlusOne: number;
    //         if (this.output.getColourMarkers().length == 0) {
    //             indexOfLastCharPlusOne = this.output.getText().length
    //         } else {
    //             indexOfLastCharPlusOne = this.output.getColourMarkers()[0].getCharPos()
    //         }

    //         let textToAppend = this.output.getText().substring(0, indexOfLastCharPlusOne)

    //         // Create new line characters for all new line markers that point to text
    //         // shifted above
    //         let currNewLineMarkerIndex = 0;
    //         for (let i = 0; i < this.output.getNewLineMarkers().length; i++) {
    //             if (this.output.getNewLineMarkers().get(currNewLineMarkerIndex).charPos > indexOfLastCharPlusOne)
    //                 break

    //             textToAppend.insert(streamedData.getNewLineMarkers().get(currNewLineMarkerIndex).charPos + i, "\n");
    //             currNewLineMarkerIndex++;
    //         }

    //         //lastTextNode.setText(lastTextNode.getText() + textToAppend.toString());
    //         final int startIndex = styledTextArea.getLength();
    //         styledTextArea.replaceText(styledTextArea.getLength(), styledTextArea.getLength(), textToAppend.toString());
    //         final int stopIndex = styledTextArea.getLength();

    //         if(defaultTextColorActive) {
    //             styledTextArea.setStyle(startIndex, stopIndex, "-fx-fill: " + javaColorToCSS(textColor) + "; -fx-font-family: monospace; -fx-font-size: " + fontSizePx + "px;");
    //         }

    //         // If the previous StreamedText object had a colour to apply when the next character was received,
    //         // add it now
    //         if(colorToApplyToNextChar != null) {
    //             /*styledTextArea.setStyle(
    //                     startIndex,
    //                     stopIndex,
    //                     TextStyle.EMPTY.updateFontSize(12).updateFontFamily("monospace").updateTextColor(colorToApplyToNextChar));*/
    //             /*styledTextArea.setStyle(
    //                     startIndex,
    //                     stopIndex,
    //                     "-fx-font-size: 12;");*/
    //             colorToApplyToNextChar = null;
    //         }

    //         // Update the number of chars added with what was added to the last existing text node
    //         numCharsAdded += textToAppend.length();

    //         // Create new text nodes and copy all text
    //         // This loop won't run if there is no elements in the TextColors array
    //         //int currIndexToInsertNodeAt = nodeIndexToStartShift;
    //         for (int x = 0; x < streamedData.getColourMarkers().size(); x++) {
    //             defaultTextColorActive = false;
    //             //Text newText = new Text();

    //             int indexOfFirstCharInNode = streamedData.getColourMarkers().get(x).getCharPos();

    //             int indexOfLastCharInNodePlusOne;
    //             if (x >= streamedData.getColourMarkers().size() - 1) {
    //                 indexOfLastCharInNodePlusOne = streamedData.getText().length();
    //             } else {
    //                 indexOfLastCharInNodePlusOne = streamedData.getColourMarkers().get(x + 1).getCharPos();
    //             }

    //             textToAppend = new StringBuilder(streamedData.getText().substring(indexOfFirstCharInNode, indexOfLastCharInNodePlusOne));

    // //            logger.debug("textToAppend (before new lines added) = " + textToAppend);

    //             // Create new line characters for all new line markers that point to text
    //             // shifted above
    //             int insertionCount = 0;
    //             while (true) {
    //                 if (currNewLineMarkerIndex >= streamedData.getNewLineMarkers().size())
    //                     break;

    //                 if (streamedData.getNewLineMarkers().get(currNewLineMarkerIndex).getCharPos() > indexOfLastCharInNodePlusOne)
    //                     break;

    //                 textToAppend.insert(
    //                         streamedData.getNewLineMarkers().get(currNewLineMarkerIndex).getCharPos() + insertionCount - indexOfFirstCharInNode,
    //                         NEW_LINE_CHAR_SEQUENCE_FOR_TEXT_FLOW);
    //                 currNewLineMarkerIndex++;
    //                 insertionCount++;
    //             }

    // //            logger.debug("textToAppend (after new lines added) = " + textToAppend);

    //             //==============================================//
    //             //==== ADD TEXT TO STYLEDTEXTAREA AND COLOUR ===//
    //             //==============================================//

    //             final int insertionStartIndex = styledTextArea.getLength();
    //             styledTextArea.replaceText(insertionStartIndex, insertionStartIndex, textToAppend.toString());
    //             final int insertionStopIndex = styledTextArea.getLength();

    // //            logger.debug("insertionStartIndex = " + insertionStartIndex + ", insertionStopIndex = " + insertionStopIndex);

    //             final Color textColor = streamedData.getColourMarkers().get(x).color;

    //             styledTextArea.setStyle(
    //                     insertionStartIndex,
    //                     insertionStopIndex,
    //                     "-fx-fill: " + javaColorToCSS(textColor) + "; -fx-font-family: monospace; -fx-font-size: " + fontSizePx + "px;");

    //             // Update the num. chars added with all the text added to this new Text node
    //             numCharsAdded += textToAppend.length();
    //         }

    //         // Clear the streamed data object, as we have consumed all the information
    //         // available in it
    //         streamedData.clear();
  }

  clearRxData() {
    // Clear any existing segments
    this.rxSegments = [];
    // Create a default segment for data to go into. If no ANSI escape codes
    // are received, this will the one and only text segment
    this.rxSegments.push(new TextSegment('', defaultTxRxColor, 0));
  }

  setTxRxScrollLock(trueFalse: boolean) {
    this.txRxTextScrollLock = trueFalse;
  }

  setStatusMsgScrollLock(trueFalse: boolean) {
    this.statusMsgScrollLock = trueFalse;
    console.log('statusMsgScrollLock=', this.statusMsgScrollLock);
  }
}
