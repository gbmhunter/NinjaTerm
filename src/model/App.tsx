/* eslint-disable no-console */
// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable, runInAction } from 'mobx';
import { closeSnackbar } from 'notistack';
import ReactGA from 'react-ga4';
import { Button } from '@mui/material';

// Import package.json to read out the version number
import packageDotJson from '../../package.json';
// eslint-disable-next-line import/no-cycle
import { Settings, SettingsCategories } from './Settings/Settings';
import Snackbar from './Snackbar/Snackbar';
import Graphing from './Graphing/Graphing';
import Logging from './Logging/Logging';
import FakePortsController from './FakePorts/FakePortsController';
import AppStorage from './Storage/AppStorage';
import { PortState } from './Settings/PortConfigurationSettings/PortConfigurationSettings';
import Terminals from './Terminals/Terminals';
import SingleTerminal from './Terminals/SingleTerminal/SingleTerminal';
import { BackspaceKeyPressBehavior, DeleteKeyPressBehavior, EnterKeyPressBehavior } from './Settings/TxSettings/TxSettings';
import { SelectionController, SelectionInfo } from './SelectionController/SelectionController';
import { isRunningOnWindows } from './Util/Util';

declare global {
  interface String {
    insert(index: number, string: string): string;
  }

  // We save the created app instance to window.app (done in index.tsx) so that
  // the test framework Playwright can access it. One use case
  // is to insert data, as it's hard to mock the async serial
  // read bytes function
  interface Window {
    app: App;
    umami: any; // Umami analytics
  }
}

// eslint-disable-next-line no-extend-native, func-names
String.prototype.insert = function (index, string) {
  if (index > 0) {
    return this.substring(0, index) + string + this.substr(index);
  }

  return string + this;
};

/**
 * Enumerates the possible things to display as the "main pane".
 * This is the large pane that takes up most of the screen.
 */
export enum MainPanes {
  SETTINGS,
  TERMINAL,
  GRAPHING,
  LOGGING,
}

export enum PortType {
  REAL,
  FAKE,
}

class LastUsedSerialPort {
  serialPortInfo: Partial<SerialPortInfo> = {};
  portState: PortState = PortState.CLOSED;
}

const tipsToDisplayOnStartup = [
  'TIP: Use Ctrl-Shift-C to copy text \nfrom the terminal, and Ctrl-Shift-V to paste.',
  'TIP: Change the type of data displayed between ASCII, HEX and other number types in Settings → RX Settings.',
  'TIP: Press Ctrl-Shift-B to send the "break" signal.',
]

export class App {
  settings: Settings;

  // If true, the settings dialog will be automatically closed on port open or close
  closeSettingsDialogOnPortOpenOrClose = true;

  portState = PortState.CLOSED;

  rxData = '';

  numBytesReceived: number;

  numBytesTransmitted: number;

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

  terminals: Terminals;

  graphing: Graphing;

  logging: Logging;

  // Remembers the last selected port type, so open() and close()
  // know what type of port to operate on
  lastSelectedPortType = PortType.REAL;

  fakePortController: FakePortsController = new FakePortsController(this);

  appStorage: AppStorage = new AppStorage();

  selectionController: SelectionController = new SelectionController();

  SelectionController = SelectionController;

  showCircularProgressModal = false;

  constructor(testing = false) {
    this.testing = testing;
    if (this.testing) {
      console.log('Warning, testing mode is enabled.');
    }

    // Read out the version number from package.json
    this.version = packageDotJson['version'];

    this.settings = new Settings(this.appStorage, this.fakePortController);

    this.snackbar = new Snackbar();

    this.terminals = new Terminals(this);

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

    this.logging = new Logging(this);

    if (navigator.serial !== undefined) {
      navigator.serial.addEventListener('connect', (event) => {
        console.log('connect. event: ', event);
        this.onSerialPortConnected(event.target as SerialPort);
      });
    }

    makeAutoObservable(this); // Make sure this near the end
  }

  /**
   * Called once when the React UI is loaded (specifically, when the App is rendered, by using a useEffect()).
   *
   * This is used to do things that can only be done once the UI is ready, e.g. enqueueSnackbar items.
   */
  async onAppUiLoaded() {
    if (this.settings.portConfiguration.config.resumeConnectionToLastSerialPortOnStartup) {
      await this.tryToLoadPreviouslyUsedPort();
    }

    // Send 1 random tip to snackbar on app load
    // Choose random tip from array
    const randomIndex = Math.floor(Math.random() * tipsToDisplayOnStartup.length);
    this.snackbar.sendToSnackbar(tipsToDisplayOnStartup[randomIndex], 'info');
  }

  onSerialPortConnected(serialPort: SerialPort) {
    console.log('onSerialPortConnected() called.');

    if (this.portState === PortState.CLOSED_BUT_WILL_REOPEN) {
      // Check to see if this is the serial port we want to reopen

      const lastUsedPortInfo: LastUsedSerialPort = this.appStorage.getData('lastUsedSerialPort');
      if (lastUsedPortInfo === null) {
        return;
      }

      const lastUsedPortInfoStr = JSON.stringify(lastUsedPortInfo.serialPortInfo);
      const serialPortInfoStr = JSON.stringify(serialPort.getInfo());

      if (lastUsedPortInfoStr === serialPortInfoStr) {
        console.log('Found previously used port, reopening it.');
        runInAction(() => {
          this.port = serialPort;
          this.serialPortInfo = serialPort.getInfo();
        });
        this.openPort();
      }
    }
  }

  async tryToLoadPreviouslyUsedPort() {
    // getPorts() returns ports that the user has previously approved
    // this app to be able to access
    let approvedPorts = await navigator.serial.getPorts();

    // const lastUsedSerialPort = this.appStorage.data.lastUsedSerialPort;
    const lastUsedSerialPort: LastUsedSerialPort = this.appStorage.getData('lastUsedSerialPort') as LastUsedSerialPort;
    if (lastUsedSerialPort === null) {
      // Did not find last used serial port data in local storage, so do nothing
      return;
    }

    const lastUsedPortInfoStr = JSON.stringify(lastUsedSerialPort.serialPortInfo);
    // If the JSON representation of the last used port is just "{}",
    // it means that the last used port didn't contain any valuable
    // information to uniquely identify it, so don't bother trying to
    // find it again!
    if (lastUsedPortInfoStr === '{}') {
      return;
    }
    // Check list of approved ports to see if any match the last opened ports
    // USB vendor ID and product ID. If so, open.
    for (let i = 0; i < approvedPorts.length; i += 1) {
      const approvedPort = approvedPorts[i];
      const approvedPortInfo = approvedPort.getInfo();
      const approvedPortInfoStr = JSON.stringify(approvedPort.getInfo());
      if (approvedPortInfoStr === lastUsedPortInfoStr) {
        // Found a match, open it
        runInAction(async () => {
          this.port = approvedPort;
          this.serialPortInfo = approvedPortInfo;

          if (lastUsedSerialPort.portState === PortState.OPENED) {
            await this.openPort(false);
            this.snackbar.sendToSnackbar(`Automatically opening last used port with info=${lastUsedPortInfoStr}.`, 'success');
          } else if (lastUsedSerialPort.portState === PortState.CLOSED) {
            this.snackbar.sendToSnackbar(`Automatically selecting last used port with info=${lastUsedPortInfoStr}.`, 'success');
          }
        });
        return;
      }
    }
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
    if ('serial' in window.navigator) {
      // The Web Serial API is supported.

      let localPort: SerialPort;

      // If the user clicks cancel, a DOMException is thrown
      try {
        // This makes a browser controlled modal pop-up in
        // where the user selects a serial port
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
        // Save the info for this port, so we can automatically re-open
        // it on app re-open in the future
        let lastUsedSerialPort: LastUsedSerialPort = this.appStorage.getData('lastUsedSerialPort');
        if (lastUsedSerialPort === null) {
          lastUsedSerialPort = new LastUsedSerialPort();
        }
        lastUsedSerialPort.serialPortInfo = this.serialPortInfo;
        this.appStorage.saveData('lastUsedSerialPort', lastUsedSerialPort);
      });
      if (this.settings.portConfiguration.config.connectToSerialPortAsSoonAsItIsSelected) {
        await this.openPort();
        // Go to the terminal pane, only if opening was successful
        if (this.portState === PortState.OPENED) {
          this.setShownMainPane(MainPanes.TERMINAL);
        }
      }
    } else {
      this.snackbar.sendToSnackbar('Browser not supported, it does not provide the navigator.serial API.', 'error');
    }
  }

  /**
   * Opens the selected serial port using settings from the Port Configuration view.
   *
   * @param printSuccessMsg If true, a success message will be printed to the snackbar.
   */
  async openPort(printSuccessMsg = true) {
    if (this.lastSelectedPortType === PortType.REAL) {
      // Show the circular progress modal when trying to open the port. If the port opening is going to fail, sometimes it takes
      // a few seconds for awaiting open() to complete, so this prevents the user from trying to open the port again while we wait
      this.setShowCircularProgressModal(true);
      try {
        await this.port?.open({
          baudRate: this.settings.portConfiguration.config.baudRate, // This might be custom
          dataBits: this.settings.portConfiguration.config.numDataBits,
          parity: this.settings.portConfiguration.config.parity as ParityType,
          stopBits: this.settings.portConfiguration.config.stopBits,
          bufferSize: 10000,
        }); // Default buffer size is only 256 (presumably bytes), which is not enough regularly causes buffer overrun errors
      } catch (error) {
        if (error instanceof DOMException) {
          if (error.name === 'NetworkError') {
            const msg = 'Serial port is already in use by another program.\n' + 'Reported error from port.open():\n' + `${error}`;
            this.snackbar.sendToSnackbar(msg, 'error');
            console.log(msg);
          } else {
            const msg = `Unrecognized DOMException error with name=${error.name} occurred when trying to open serial port.\n` + 'Reported error from port.open():\n' + `${error}`;
            this.snackbar.sendToSnackbar(msg, 'error');
            console.log(msg);
          }
        } else {
          // Type of error not recognized or seen before
          const msg = `Unrecognized error occurred when trying to open serial port.\n` + 'Reported error from port.open():\n' + `${error}`;
          this.snackbar.sendToSnackbar(msg, 'error');
          console.log(msg);
        }

        console.log('Disabling modal');
        this.setShowCircularProgressModal(false);

        // An error occurred whilst calling port.open(), so DO NOT continue, port
        // cannot be considered open
        return;
      }
      console.log('Open success!');
      if (printSuccessMsg) {
        this.snackbar.sendToSnackbar('Serial port opened.', 'success');
      }

      this.setShowCircularProgressModal(false);

      runInAction(() => {
        this.portState = PortState.OPENED;
        this.keepReading = true;
        this.closedPromise = this.readUntilClosed();
      });

      const lastUsedSerialPort: LastUsedSerialPort = this.appStorage.getData('lastUsedSerialPort');
      lastUsedSerialPort.portState = PortState.OPENED;
      this.appStorage.saveData('lastUsedSerialPort', lastUsedSerialPort);

      // Create custom GA4 event to see how many ports have
      // been opened in NinjaTerm :-)
      ReactGA.event('port_open');
      // Umami event to track how many times a port was opened :-)
      window.umami.track('port-open');
    } else if (this.lastSelectedPortType === PortType.FAKE) {
      this.fakePortController.openPort();
    } else {
      throw Error('Unsupported port type!');
    }

    // Clear the partial number buffers in all terminals
    this.terminals.txTerminal.clearPartialNumberBuffer();
    this.terminals.rxTerminal.clearPartialNumberBuffer();
    this.terminals.txRxTerminal.clearPartialNumberBuffer();
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
            // console.log('reader.read() returned done.');
            break;
          }
          // value is a Uint8Array.
          this.parseRxData(value);
        }
      } catch (error) {
        // console.log('reader.read() threw an error. error=', error, 'port.readable="', this.port?.readable, '" (null indicates fatal error)');
        // These error are described at https://wicg.github.io/serial/
        // @ts-ignore:
        if (error instanceof DOMException) {
          // console.log('Exception was DOMException. error.name=', error.name);
          // BufferOverrunError: Rendering couldn't get up with input data,
          // potentially make buffer size to port.open() larger or speed up processing/rendering
          // if this occurs often. This is non-fatal, port.readable will not be null
          if (error.name === 'BufferOverrunError') {
            this.snackbar.sendToSnackbar(
              'RX buffer overrun occurred. Too much data is coming in for the app to handle.\n' + 'Returned error from reader.read():\n' + `${error}`,
              'warning'
            );
          } else if (error.name === 'BreakError') {
            this.snackbar.sendToSnackbar('Encountered break signal.\n' + 'Returned error from reader.read():\n' + `${error}`, 'warning');
          } else if (error.name === 'FramingError') {
            this.snackbar.sendToSnackbar('Encountered framing error.\n' + 'Returned error from reader.read():\n' + `${error}`, 'warning');
          } else if (error.name === 'ParityError') {
            this.snackbar.sendToSnackbar('Encountered parity error.\n' + 'Returned error from reader.read():\n' + `${error}`, 'warning');
          } else if (error.name === 'NetworkError') {
            this.snackbar.sendToSnackbar(
              'Encountered network error. This usually means the a USB serial port was unplugged from the computer.\n' + 'Returned error from reader.read():\n' + `${error}`,
              'error'
            ); // This is a fatal error
          } else {
            const msg =
              `Unrecognized DOMException error with name=${error.name} occurred when trying to read from serial port.\n` + 'Reported error from port.read():\n' + `${error}`;
            this.snackbar.sendToSnackbar(msg, 'error');
            console.log(msg);
            console.log('port.readable: ', this.port?.readable);
          }
        } else {
          this.snackbar.sendToSnackbar(`Serial port was removed unexpectedly.\nReturned error from reader.read():\n${error}`, 'error');
        }
      } finally {
        // Allow the serial port to be closed later.
        this.reader.releaseLock();
      }
    }

    await this.port!.close();

    // If keepReading is true, this means close() was not called, and it's an unexpected
    // fatal error from the serial port which has caused us to close. In this case, handle
    // the clean-up and state transition here.
    if (this.keepReading === true) {
      if (this.settings.portConfiguration.config.reopenSerialPortIfUnexpectedlyClosed) {
        this.setPortState(PortState.CLOSED_BUT_WILL_REOPEN);
      } else {
        this.setPortState(PortState.CLOSED);
      }
      this.reader = null;
      this.closedPromise = null;
      // Set port to null as we might have "lost" it, i.e. might
      // have been removed/disappeared
      this.port = null;
    }
  }

  setPortState(newPortState: PortState) {
    this.portState = newPortState;
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
    // console.log('parseRxData() called. rxData=', rxData);
    // Send received data to both the single TX/RX terminal
    // and the RX terminal
    this.terminals.txRxTerminal.parseData(rxData);
    this.terminals.rxTerminal.parseData(rxData);
    this.graphing.parseData(rxData);
    this.logging.handleRxData(rxData);
    this.numBytesReceived += rxData.length;
  }

  async closePort(goToReopenState = false) {
    if (this.lastSelectedPortType === PortType.REAL) {
      this.keepReading = false;
      // Force reader.read() to resolve immediately and subsequently
      // call reader.releaseLock() in the loop example above.
      this.reader?.cancel();

      if (this.closedPromise === null) {
        throw Error('this.closedPromise was null when trying to close port.');
      }
      await this.closedPromise;

      if (goToReopenState) {
        // this.setPortState(PortState.CLOSED_BUT_WILL_REOPEN);
        this.portState = PortState.CLOSED_BUT_WILL_REOPEN;
      } else {
        // this.setPortState(PortState.CLOSED);
        this.portState = PortState.CLOSED;
      }
      this.snackbar.sendToSnackbar('Serial port closed.', 'success');
      this.reader = null;
      this.closedPromise = null;
      // this.appStorage.data.lastUsedSerialPort.portState = PortState.CLOSED;
      // this.appStorage.saveData();
      const lastUsedSerialPort: LastUsedSerialPort = this.appStorage.getData('lastUsedSerialPort');
      lastUsedSerialPort.portState = PortState.CLOSED;
      this.appStorage.saveData('lastUsedSerialPort', lastUsedSerialPort);
    } else if (this.lastSelectedPortType === PortType.FAKE) {
      this.fakePortController.closePort();
    } else {
      throw Error('Unsupported port type!');
    }
  }

  stopWaitingToReopenPort() {
    this.portState = PortState.CLOSED;
  }

  /** Central place which handles all key pressed in the app.
   * This includes:
   * - Key presses when a terminal pane is active. Data will be set out the serial port
   *   if it's a TXRX or TX terminal, the port is open and the key press is relevant.
   * - Pressing Ctrl-Shift-C to copy selected text to clipboard.
   * - Pressing "f" while on the Port Configuration settings.
   */
  async handleKeyDown(event: React.KeyboardEvent) {
    console.log('handleKeyDown() called. event.key=', event.key);
    // SPECIAL TESTING "FAKE PORTS"
    if (this.shownMainPane === MainPanes.SETTINGS && this.settings.activeSettingsCategory === SettingsCategories.PORT_CONFIGURATION && event.key === 'f') {
      this.fakePortController.setIsDialogOpen(true);
    }
    //============================================
    // COPY KEYBOARD SHORTCUT
    //============================================
    else if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      // Ctrl-Shift-C is pressed
      this.handleCopyToClipboard(event);
    }
    //============================================
    // PASTE KEYBOARD SHORTCUT
    //============================================
    else if (event.ctrlKey && event.shiftKey && event.key === 'V') {
      // Ctrl-Shift-V is pressed, handle paste
      // Get clipboard text and send it out the serial port if either the TXRX or TX terminal is in focus
      // Calling readText() will ask the user for permission to access the clipboard on the first time
      let text = await navigator.clipboard.readText();

      // Convert CRLF to LF if setting is enabled
      if (this.settings.generalSettings.config.whenPastingOnWindowsReplaceCRLFWithLF && isRunningOnWindows()) {
        text = text.replace(/\r\n/g, '\n');
      }

      // Make sure serial port is open
      if (this.portState !== PortState.OPENED) {
        return;
      }

      // Make sure either the TXRX or TX terminal is in focus
      if (!this.terminals.txRxTerminal.isFocused && !this.terminals.txTerminal.isFocused) {
        return;
      }

      // Convert string to Uint8Array
      const dataAsUint8Array = new TextEncoder().encode(text);
      await this.writeBytesToSerialPort(dataAsUint8Array);
    }
    //=============================================
    // TERMINAL DATA
    //=============================================
    else if (this.terminals.txRxTerminal.isFocused || this.terminals.txTerminal.isFocused) {
      // If we get here and the terminals are in focus, assume it's terminal data
      this.handleTerminalKeyDown(event);
    }
  }

  /**
   * This is called when the user presses Ctrl-Shift-C. It copies the selected text
   * to the clipboard.
   * @param event The keyboard event.
   * @returns
   */
  private handleCopyToClipboard(event: React.KeyboardEvent) {
    // Prevents Ctrl-Shift-C from opening the browser's dev tools
    event.preventDefault();
    event.stopPropagation();

    // console.log('handleCopyToClipboard() called.');
    const selection = window.getSelection();
    if (selection === null) {
      return;
    }

    // Work out if the selection is contained within a single terminal pane, and if so,
    // handle the copy in a special manner (no just a basic toString())
    const terminalsToCheck = [this.terminals.txRxTerminal, this.terminals.txTerminal, this.terminals.rxTerminal];
    let terminalSelectionWasIn: SingleTerminal | null = null;
    let selectionInfo: SelectionInfo | null = null;
    for (let i = 0; i < terminalsToCheck.length; i += 1) {
      const terminal = terminalsToCheck[i];
      selectionInfo = terminal.getSelectionInfoIfWithinTerminal();
      if (selectionInfo !== null) {
        // Found a terminal that the selection is contained within, break out of loop
        terminalSelectionWasIn = terminal;
        break;
      }
    }

    let clipboardText = '';
    if (selectionInfo !== null) {
      // Copy the text from the start node to the end node (NOTE: not the same as
      // the anchor and focus node if the user clicked at the end and released at the start)
      clipboardText = this.extractClipboardTextFromTerminal(selectionInfo, terminalSelectionWasIn!);
    } else {
      // Since selection is not fully contained within a single terminal pane,
      // do a basic toString() copy of the text to the clipboard
      // Do we need to await the promise?
      // WARNING: As per spec at: https://w3c.github.io/clipboard-apis/#dom-clipboard-writetext
      //   On Windows replace `\n` characters with `\r\n` in data before creating textBlob
      clipboardText = selection.toString();
    }

    navigator.clipboard.writeText(clipboardText);
    // Create toast telling user that text was copied to clipboard
    this.snackbar.sendToSnackbar(`${clipboardText.length} chars copied to clipboard.`, 'success');
  }

  /**
   * Given selection info and the terminal the selection was in, this function walks through the rows
   * contained in the selection and extracts the text suitable for copying to the clipboard.
   *
   * @param selectionInfo Information about the selection, generated by the SelectionController.
   * @param terminalSelectionWasIn The terminal that the selection was wholly contained within.
   * @returns Text extracted from the terminal rows, suitable for copying to the clipboard.
   */
  private extractClipboardTextFromTerminal(
      selectionInfo: SelectionInfo,
      terminalSelectionWasIn: SingleTerminal): string {
    // Extract number from end of the row ID
    // row ID is in form <terminal id>-row-<number>
    const firstRowIdNumOnly = parseInt(selectionInfo.firstRowId.split('-').slice(-1)[0]);
    const lastRowIdNumOnly = parseInt(selectionInfo.lastRowId.split('-').slice(-1)[0]);

    // Get the index of these row numbers in the terminal
    const firstRowIndex = terminalSelectionWasIn!.terminalRows.findIndex((row) => row.uniqueRowId === firstRowIdNumOnly);
    const lastRowIndex = terminalSelectionWasIn!.terminalRows.findIndex((row) => row.uniqueRowId === lastRowIdNumOnly);

    // Iterate from the first to the last row, and extract the text from each row
    let textToCopy = '';
    for (let i = firstRowIndex; i <= lastRowIndex; i += 1) {
      const terminalRow = terminalSelectionWasIn.terminalRows[i];

      // Add a newline character between each successive row, except if:
      //    - The terminal row was created due to wrapping AND setting is enabled.
      //    This means the user can paste the text into
      //    a text editor and it won't have additional new lines added just because the text wrapped in
      //    the terminal. New lines will only be added if the terminal row was created because of
      //    a new line character or an ANSI escape sequence (e.g. cursor down).
      if (i !== firstRowIndex && (terminalRow.wasCreatedDueToWrapping === false || !this.settings.generalSettings.config.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping)) {
        textToCopy += '\n';
      }

      if (i === firstRowIndex && i === lastRowIndex) {
        // If this is the first and last row, only copy from the start to the end of the selection
        textToCopy += terminalRow.getText().slice(selectionInfo.firstColIdx, selectionInfo.lastColIdx);
      } else if (i === firstRowIndex) {
        // If this is the first row, only copy from the start of the selection
        textToCopy += terminalRow.getText().slice(selectionInfo.firstColIdx);
      } else if (i === lastRowIndex) {
        // If this is the last row, only copy to the end of the selection
        textToCopy += terminalRow.getText().slice(0, selectionInfo.lastColIdx);
      } else {
        // If this is neither the first nor the last row, copy the entire row
        textToCopy += terminalRow.getText();
      }
    }

    return textToCopy;
  }

  /**
   * This is called from either the TX/RX terminal or TX terminal
   * (i.e. any terminal pane that is allowed to send data). This function
   * determines what the user has pressed and what data to send out the
   * serial port because of it.
   *
   * This needs to use an arrow function because it's being passed around
   * as a callback. Tried to bind to this in constructor, didn't work.
   *
   * @param event The React keydown event.
   */
  handleTerminalKeyDown = async (event: React.KeyboardEvent) => {
    // console.log('handleTerminalKeyDown() called. event=', event);

    // Capture all key presses and prevent default actions or bubbling.
    // preventDefault() prevents a Tab press from moving focus to another element on screen
    event.preventDefault();
    event.stopPropagation();

    if (this.portState !== PortState.OPENED) {
      // Serial port is not open, so don't send anything
      return;
    }

    // Serial port is open, let's send it to the serial
    // port

    // Convert event.key to required ASCII number. This would be easier if we could
    // use keyCode, but this method is deprecated!
    const bytesToWrite: number[] = [];
    // List of allowed symbols, includes space char also
    const symbols = "`~!@#$%^&*()-_=+[{]}\\|;:'\",<.>/? ";

    // List of all alphanumeric chars
    const alphabeticChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqurstuvwxyz';
    const alphaNumericChars = alphabeticChars + '0123456789';
    if (event.key === 'Control' || event.key === 'Shift' || event.key === 'Alt') {
      // Don't send anything if a control/shift/alt key was pressed by itself
      return;
    }
    //===========================================================
    // Ctrl-Shift-B: Send break signal
    //===========================================================
    else if (event.ctrlKey && event.shiftKey && event.key === 'B') {
      // TODO: Get types for setSignals() and remove ts-ignore
      try {
        // @ts-ignore
        await this.port.setSignals({ break: true });
        // 200ms seems like a standard break time
        await new Promise(resolve => setTimeout(resolve, 200));
        // @ts-ignore
        await this.port.setSignals({ break: false });
        // Emit message to user
        this.snackbar.sendToSnackbar('Break signal sent.', 'success');
      }
      // As per https://wicg.github.io/serial/#dom-serialport-setsignals
      // If the operating system fails to change the state of any of these signals for any reason, queue a
      // global task on the relevant global object of this using the serial port task source to reject promise with a "NetworkError" DOMException.
      catch (error) {
        this.snackbar.sendToSnackbar(`Error sending break signal. error: ${error}.`, 'error');
      }
    }
    else if (event.ctrlKey) {
      // Most presses with the Ctrl key held down should do nothing. One exception is
      // if sending 0x01-0x1A when Ctrl-A through Ctrl-Z is pressed is enabled
      if (this.settings.txSettings.config.send0x01Thru0x1AWhenCtrlAThruZPressed && event.key.length === 1 && alphabeticChars.includes(event.key)) {
        // Ctrl-A through Ctrl-Z is has been pressed
        // Send 0x01 through 0x1A, which is easily done by getting the char, converting to
        // uppercase if lowercase and then subtracting 64
        bytesToWrite.push(event.key.toUpperCase().charCodeAt(0) - 64);
      } else {
        // Ctrl key was pressed, but we don't want to send anything
        return;
      }
    } else if (event.altKey) {
      if (this.settings.txSettings.config.sendEscCharWhenAltKeyPressed && event.key.length === 1 && alphabeticChars.includes(event.key)) {
        // Alt-A through Alt-Z is has been pressed
        // Send ESC char (0x1B) followed by the char
        bytesToWrite.push(0x1B);
        bytesToWrite.push(event.key.charCodeAt(0));
      } else {
        // Alt key was pressed with another key, but we don't want to do anything with it
        return;
      }
    } else if (event.key === 'Enter') {
      if (this.settings.txSettings.config.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_LF) {
        bytesToWrite.push(0x0A);
      } else if (this.settings.txSettings.config.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_CR) {
        bytesToWrite.push(0x0D);
      } else if (this.settings.txSettings.config.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_CRLF) {
        bytesToWrite.push(0x0D);
        bytesToWrite.push(0x0A);
      } else {
        throw Error('Unsupported enter key press behavior!');
      }
    } else if (event.key.length === 1 && alphaNumericChars.includes(event.key)) {
      // Pressed key is alphanumeric
      bytesToWrite.push(event.key.charCodeAt(0));
    } else if (event.key.length === 1 && symbols.includes(event.key)) {
      // Pressed key is a symbol (e.g. ';?.,<>)
      // Do same thing as with alphanumeric cars
      bytesToWrite.push(event.key.charCodeAt(0));
    }
    //===========================================================
    // HANDLE BACKSPACE AND DELETE KEY PRESSES
    //===========================================================
    else if (event.key === 'Backspace') {
      // Work out whether to send BS (0x08) or DEL (0x7F) based on settings
      if (this.settings.txSettings.config.backspaceKeyPressBehavior === BackspaceKeyPressBehavior.SEND_BACKSPACE) {
        bytesToWrite.push(0x08);
      } else if (this.settings.txSettings.config.backspaceKeyPressBehavior === BackspaceKeyPressBehavior.SEND_DELETE) {
        bytesToWrite.push(0x7F);
      } else {
        throw Error('Unsupported backspace key press behavior!');
      }
    } else if (event.key === 'Delete') {
      // Delete also has the option of sending [ESC][3~
      if (this.settings.txSettings.config.deleteKeyPressBehavior === DeleteKeyPressBehavior.SEND_BACKSPACE) {
        bytesToWrite.push(0x08);
      } else if (this.settings.txSettings.config.deleteKeyPressBehavior === DeleteKeyPressBehavior.SEND_DELETE) {
        bytesToWrite.push(0x7F);
      } else if (this.settings.txSettings.config.deleteKeyPressBehavior === DeleteKeyPressBehavior.SEND_VT_SEQUENCE) {
        bytesToWrite.push(0x1B, '['.charCodeAt(0), '3'.charCodeAt(0), '~'.charCodeAt(0));
      } else {
        throw Error('Unsupported delete key press behavior!');
      }
    }
    //===========================================================
    // HANDLE ARROW KEY PRESSES
    //===========================================================
    else if (event.key === 'ArrowLeft') {
      // Send 'ESC[D' (go back 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'D'.charCodeAt(0));
    } else if (event.key === 'ArrowRight') {
      // Send 'ESC[C' (go forward 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'C'.charCodeAt(0));
    } else if (event.key === 'ArrowUp') {
      // Send 'ESC[A' (go up 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'A'.charCodeAt(0));
    } else if (event.key === 'ArrowDown') {
      // Send 'ESC[B' (go down 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'B'.charCodeAt(0));
    } else if (event.key === 'Tab') {
      // Send horizontal tab, HT, 0x09
      bytesToWrite.push(0x09);
    } else {
      // If we get here, we don't know what to do with the key press
      console.log('Unsupported char! event=', event);
      return;
    }
    await this.writeBytesToSerialPort(Uint8Array.from(bytesToWrite));
  };

  private async writeBytesToSerialPort(bytesToWrite: Uint8Array) {
    const writer = this.port?.writable?.getWriter();

    await writer?.write(bytesToWrite);

    // Allow the serial port to be closed later.
    writer?.releaseLock();
    this.terminals.txTerminal.parseData(bytesToWrite);
    // Check if local TX echo is enabled, and if so, send the data to
    // the combined single terminal.
    if (this.settings.rxSettings.config.localTxEcho) {
      this.terminals.txRxTerminal.parseData(bytesToWrite);
    }

    // Also send this data to the logger, it may need it
    this.logging.handleTxData(bytesToWrite);

    runInAction(() => {
      this.numBytesTransmitted += bytesToWrite.length;
    });
  }

  clearAllData() {
    this.terminals.txRxTerminal.clear();
    this.terminals.txTerminal.clear();
    this.terminals.rxTerminal.clear();
  }

  /**
   * Sets the main pane to be shown.
   */
  setShownMainPane(newPane: MainPanes) {
    this.shownMainPane = newPane;
  }

  swOnNeedRefresh(updateSw: (reloadPage?: boolean | undefined) => Promise<void>) {
    console.log('onNeedRefresh() called.');
    this.snackbar.sendToSnackbar(
      'A new version of NinjaTerm is available. Click Reload to update.',
      'info',
      (snackbarId) => (
        <>
          <Button
            onClick={() => {
              updateSw(true);
            }}
            color='info'
            variant='text'
            sx={{
              color: 'rgb(33, 150, 243)',
              backgroundColor: 'white',
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
          >
            Close
          </Button>
        </>
      ),
      true // Make this snackbar persist until the user clicks either of the buttons
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

  setShowCircularProgressModal(show: boolean) {
    this.showCircularProgressModal = show;
  }
}
