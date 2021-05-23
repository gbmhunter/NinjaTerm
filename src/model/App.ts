import { makeAutoObservable } from "mobx"
import SerialPort from 'serialport'

import StatusMsg from './StatusMsg'
import Settings from './Settings'
import NewLineParser from "../util/NewLineParser/NewLineParser"
import StreamedData from "../util/StreamedData/StreamedData"

const electron = require('electron')

// These are mocked for jest in __mocks__/electron.js
const { remote } = electron
const { Menu, MenuItem } = remote

function areWeTestingWithJest() {
  return process.env.JEST_WORKER_ID !== undefined;
}

/**
 * Use this to validate that a string is exactly a positive integer.
 *
 * @param str The string to check if integer.
 * @returns Returns true only if provided string is exactly a positive integer, with no leading whitespace, else returns false.
 */
function isNormalPositiveInteger(str : string) {
  const n = Math.floor(Number(str))
  return n !== Infinity && String(n) === str && n >= 0
}

declare global {
  interface String {
    insert(index: number, string: string): string;
  }
}

String.prototype.insert = function(index, string) {
  if (index > 0) {
    return this.substring(0, index) + string + this.substr(index);
  }

  return string + this;
};

class TextSegment {
  text: string = ''
  color: string = ''
  key: number
  constructor(text: string, color: string, key: number) {
    makeAutoObservable(this)
    this.text = text
    this.color = color
    this.key = key
  }
}

// Model the application state.
export default class App {

  settingsShown = false

  /** One of 'Open' or 'Closed' */
  serialPortState = 'Closed'

  serialPortObj: SerialPort | null = null

  rxData = ''

  input: StreamedData

  newLineParser: NewLineParser

  output: StreamedData

  rxSegments: TextSegment[] = []

  /** Contains the text data for the status textarea. */
  statusMsgs: StatusMsg[] = []

  /** If true, the RX textarea will always be kept scrolled to the bottom. If false, scroll position keeps
   * current received data in view.
   */
  autoScroll = true

  settings = new Settings(this)

  constructor() {
      makeAutoObservable(this)

      // Setup the application menu. Electron doesn't seem to run in the render process
      // when invoked by jest, so we don't run this code when doing testing
      if(!areWeTestingWithJest()) {
        const menu = new Menu()
        const fileSubMenu = new Menu()
        fileSubMenu.append(new MenuItem({ label: 'Settings', click: () => { this.setSettingsShown(true) } }))
        const fileMenu = new MenuItem({ label: 'File', submenu: fileSubMenu })
        menu.append(fileMenu)
        menu.append(new MenuItem({ type: 'separator' }))
        Menu.setApplicationMenu(menu)
      }

      this.input = new StreamedData()
      this.newLineParser = new NewLineParser('\n')
      this.output = new StreamedData()

      this.rxSegments.push(new TextSegment('', '#000000', 0))

      // Do initial scan for serial ports
      this.addStatusBarMsg('NinjaTerm started.', 'ok')
      this.settings.rescan()
  }

  setSettingsShown = (trueFalse: boolean) => {
    this.settingsShown = trueFalse
  }

  openCloseButtonClicked = () => {
    if(this.serialPortState === 'Closed') {

      if(this.settings.selSerialPort === '')
        throw Error('Selected serial port is null.')
      else {

        // Determine baud rate based on whether user has selected
        // 'standard' or 'custom'
        let selBaudRate = null
        if(this.settings.selBaudRateStyle === 'standard')
          selBaudRate = this.settings.selBaudRateStandard
        else if(this.settings.selBaudRateStyle === 'custom') {
          // Validate user entered custom baud rate
          if(!isNormalPositiveInteger(this.settings.selBaudRateCustom.value)) {
            this.settings.selBaudRateCustom.error = 'Value must be a positive integer.'
            return
          }
          // If we get here, custom baud rate passed validation checks
          const convertedBaudRate = Number.parseInt(this.settings.selBaudRateCustom.value, 10)
          this.settings.selBaudRateCustom.error = null
          selBaudRate = convertedBaudRate
        }
        else
          throw Error('selBaudRateStyle unrecognized.')

        const serialPortObj = new SerialPort(
          this.settings.selSerialPort,
          {
            baudRate: selBaudRate,
            dataBits: this.settings.selNumDataBits,
            parity: this.settings.selParity,
            stopBits: this.settings.selNumStopBits,
            autoOpen: false,
          } as SerialPort.OpenOptions,
        )

        this.serialPortObj = serialPortObj

        serialPortObj.on('open', this.onSerialPortOpened)
        // Switches the port into "flowing mode"
        serialPortObj.on('data', (data) => {
          this.onSerialPortReceivedData(data)
        })
        // All errors (incl. open errors) will be emitted as an error event
        serialPortObj.on('error', (err) => {
          this.addStatusBarMsg(err.message, 'error')
        })

        serialPortObj.open()

      }
    } else if (this.serialPortState === 'Open') {
      if(this.serialPortObj === null)
        throw Error('Serial port object was null.')
      this.serialPortObj.close()
      this.serialPortState = 'Closed'
      this.serialPortObj = null
      this.addStatusBarMsg(`Serial port "${this.settings.selSerialPort}" closed.\n`, 'ok')
    }
  }

  onSerialPortOpened = () => {
    this.addStatusBarMsg(`Serial port "${this.settings.selSerialPort}" opened.\n`, 'ok')
    this.serialPortState = 'Open'
  }

  onSerialPortReceivedData = (data: any) => {
    console.log('Received data from serial port. Data:', data)
    this.rxData += data.toString()

    this.input.append(data.toString())
    this.newLineParser.parse(this.input, this.output)
    // this.output contains the new data needed to be add to the RX terminal window

    const lastRxSegment = this.rxSegments[this.rxSegments.length - 1]
    lastRxSegment.text += this.output.text
    lastRxSegment.key += 1

    this.output.clear()


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


  setAutoScroll = (trueFalse: boolean) => {
    this.autoScroll = trueFalse
  }

  /**
   * Call this to add a message to the status bar at the bottom of the main view.
   *
   * @param msg Message to output to the status bar. Message should include new line character.
   */
  addStatusBarMsg = (msg: string, severity: string) => {
    const currDate = new Date()
    this.statusMsgs.push(new StatusMsg(this.statusMsgs.length, `${currDate.toISOString()}: ${msg}`, severity))
  }

  handleKeyPress = (event: KeyboardEvent) => {
    console.log('keypress detected. event=')
    console.log(event)
    if(this.serialPortState === 'Open') {
      // Send keypress to serial port
      this.serialPortObj?.write([event.keyCode])
    }
  }
}
