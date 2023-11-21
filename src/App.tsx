/* eslint-disable no-console */
// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable, runInAction } from "mobx";
import { closeSnackbar } from "notistack";
import ReactGA from "react-ga4";
import { Button } from "@mui/material";

// Import package.json to read out the version number
import packageDotJson from "../package.json";
// eslint-disable-next-line import/no-cycle
import { Settings, SettingsCategories } from "./Settings/Settings";
import Snackbar from "./Snackbar";
import Graphing from "./Graphing/Graphing";
import Logging from "./Logging/Logging";
import FakePortsController from "./FakePorts/FakePortsController";
import AppStorage from "./Storage/AppStorage";
import { PortState } from "./Settings/PortConfigurationSettings/PortConfigurationSettings";
import Terminals from "./Terminals/Terminals";
import { BackspaceKeyPressBehavior, DeleteKeyPressBehaviors } from "./Settings/DataProcessingSettings/DataProcessingSettings";

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

export class App {
  settings: Settings;

  // If true, the settings dialog will be automatically closed on port open or close
  closeSettingsDialogOnPortOpenOrClose = true;

  portState = PortState.CLOSED;

  rxData = "";

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

  constructor(testing = false) {
    this.testing = testing;
    if (this.testing) {
      console.log("Warning, testing mode is enabled.");
    }

    // Read out the version number from package.json
    this.version = packageDotJson["version"];

    this.settings = new Settings(this);

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
      navigator.serial.addEventListener("connect", (event) => {
        console.log("connect. event: ", event);
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
    if (this.settings.portConfiguration.resumeConnectionToLastSerialPortOnStartup) {
      await this.tryToLoadPreviouslyUsedPort();
    }
  }

  onSerialPortConnected(serialPort: SerialPort) {
    console.log("onSerialPortConnected() called.");

    if (this.portState === PortState.CLOSED_BUT_WILL_REOPEN) {
      // Check to see if this is the serial port we want to reopen

      const lastUsedPortInfo: LastUsedSerialPort = this.appStorage.getData("lastUsedSerialPort");
      if (lastUsedPortInfo === null) {
        return;
      }

      const lastUsedPortInfoStr = JSON.stringify(lastUsedPortInfo.serialPortInfo);
      const serialPortInfoStr = JSON.stringify(serialPort.getInfo());

      if (lastUsedPortInfoStr === serialPortInfoStr) {
        console.log("Found previously used port, reopening it.");
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
    const lastUsedSerialPort: LastUsedSerialPort = this.appStorage.getData("lastUsedSerialPort") as LastUsedSerialPort;
    if (lastUsedSerialPort === null) {
      // Did not find last used serial port data in local storage, so do nothing
      return;
    }

    const lastUsedPortInfoStr = JSON.stringify(lastUsedSerialPort.serialPortInfo);
    // If the JSON representation of the last used port is just "{}",
    // it means that the last used port didn't contain any valuable
    // information to uniquely identify it, so don't bother trying to
    // find it again!
    if (lastUsedPortInfoStr === "{}") {
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
            this.snackbar.sendToSnackbar(`Automatically opening last used port with info=${lastUsedPortInfoStr}.`, "success");
          } else if (lastUsedSerialPort.portState === PortState.CLOSED) {
            this.snackbar.sendToSnackbar(`Automatically selecting last used port with info=${lastUsedPortInfoStr}.`, "success");
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
    if ("serial" in window.navigator) {
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
        this.snackbar.sendToSnackbar("User cancelled port selection.", "warning");
        return;
      }
      runInAction(() => {
        this.port = localPort;
        this.serialPortInfo = this.port.getInfo();
        // Save the info for this port, so we can automatically re-open
        // it on app re-open in the future
        let lastUsedSerialPort: LastUsedSerialPort = this.appStorage.getData("lastUsedSerialPort");
        if (lastUsedSerialPort === null) {
          lastUsedSerialPort = new LastUsedSerialPort();
        }
        lastUsedSerialPort.serialPortInfo = this.serialPortInfo;
        this.appStorage.saveData("lastUsedSerialPort", lastUsedSerialPort);
      });
      if (this.settings.portConfiguration.connectToSerialPortAsSoonAsItIsSelected) {
        await this.openPort();
        runInAction(() => {
          this.portState = PortState.OPENED;
        });
        // Goto the terminal pane
        this.setShownMainPane(MainPanes.TERMINAL);
      }
    } else {
      console.error("Browser not supported, it does not provide the navigator.serial API.");
    }
  }

  async openPort(printSuccessMsg = true) {
    if (this.lastSelectedPortType === PortType.REAL) {
      try {
        await this.port?.open({
          baudRate: this.settings.selectedBaudRate,
          dataBits: this.settings.selectedNumDataBits,
          parity: this.settings.selectedParity as ParityType,
          stopBits: this.settings.selectedStopBits,
          bufferSize: 10000,
        }); // Default buffer size is only 256 (presumably bytes), which is not enough regularly causes buffer overrun errors
      } catch (error) {
        if (error instanceof DOMException) {
          if (error.name === "NetworkError") {
            const msg = "Serial port is already in use by another program.\n" + "Reported error from port.open():\n" + `${error}`;
            this.snackbar.sendToSnackbar(msg, "error");
            console.log(msg);
          } else {
            const msg = `Unrecognized DOMException error with name=${error.name} occurred when trying to open serial port.\n` + "Reported error from port.open():\n" + `${error}`;
            this.snackbar.sendToSnackbar(msg, "error");
            console.log(msg);
          }
        } else {
          // Type of error not recognized or seen before
          const msg = `Unrecognized error occurred when trying to open serial port.\n` + "Reported error from port.open():\n" + `${error}`;
          this.snackbar.sendToSnackbar(msg, "error");
          console.log(msg);
        }

        // An error occurred whilst calling port.open(), so DO NOT continue, port
        // cannot be considered open
        return;
      }
      if (printSuccessMsg) {
        this.snackbar.sendToSnackbar("Serial port opened.", "success");
      }

      runInAction(() => {
        this.portState = PortState.OPENED;
        this.keepReading = true;
        this.closedPromise = this.readUntilClosed();
      });

      const lastUsedSerialPort: LastUsedSerialPort = this.appStorage.getData("lastUsedSerialPort");
      lastUsedSerialPort.portState = PortState.OPENED;
      this.appStorage.saveData("lastUsedSerialPort", lastUsedSerialPort);

      // Create custom GA4 event to see how many ports have
      // been opened in NinjaTerm :-)
      ReactGA.event("port_open");
    } else if (this.lastSelectedPortType === PortType.FAKE) {
      this.fakePortController.openPort();
    } else {
      throw Error("Unsupported port type!");
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
            console.log("reader.read() returned done.");
            break;
          }
          // value is a Uint8Array.
          this.parseRxData(value);
        }
      } catch (error) {
        console.log("reader.read() threw an error. error=", error, 'port.readable="', this.port?.readable, '" (null indicates fatal error)');
        // These error are described at https://wicg.github.io/serial/
        // @ts-ignore:
        if (error instanceof DOMException) {
          console.log("Exception was DOMException. error.name=", error.name);
          // BufferOverrunError: Rendering couldn't get up with input data,
          // potentially make buffer size to port.open() larger or speed up processing/rendering
          // if this occurs often. This is non-fatal, readable will not be null
          if (error.name === "BufferOverrunError") {
            this.snackbar.sendToSnackbar(
              "RX buffer overrun occurred. Too much data is coming in for the app to handle.\n" + "Returned error from reader.read():\n" + `${error}`,
              "warning"
            );
          } else if (error.name === "BreakError") {
            this.snackbar.sendToSnackbar("Encountered break signal.\n" + "Returned error from reader.read():\n" + `${error}`, "warning");
          } else if (error.name === "FramingError") {
            this.snackbar.sendToSnackbar("Encountered framing error.\n" + "Returned error from reader.read():\n" + `${error}`, "warning");
          } else if (error.name === "ParityError") {
            this.snackbar.sendToSnackbar("Encountered parity error.\n" + "Returned error from reader.read():\n" + `${error}`, "warning");
          } else if (error.name === "NetworkError") {
            this.snackbar.sendToSnackbar(
              "Encountered network error. This usually means the a USB serial port was unplugged from the computer.\n" + "Returned error from reader.read():\n" + `${error}`,
              "error"
            ); // This is a fatal error
          } else {
            const msg =
              `Unrecognized DOMException error with name=${error.name} occurred when trying to read from serial port.\n` + "Reported error from port.read():\n" + `${error}`;
            this.snackbar.sendToSnackbar(msg, "error");
            console.log(msg);
          }
        } else {
          this.snackbar.sendToSnackbar(`Serial port was removed unexpectedly.\nReturned error from reader.read():\n${error}`, "error");
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
      if (this.settings.portConfiguration.reopenSerialPortIfUnexpectedlyClosed) {
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
    console.log('parseRxData() called. rxData=', rxData);
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
        console.log("was null.");
        throw Error("jfjfjf");
      }
      await this.closedPromise;

      if (goToReopenState) {
        // this.setPortState(PortState.CLOSED_BUT_WILL_REOPEN);
        this.portState = PortState.CLOSED_BUT_WILL_REOPEN;
      } else {
        // this.setPortState(PortState.CLOSED);
        this.portState = PortState.CLOSED;
      }
      this.snackbar.sendToSnackbar("Serial port closed.", "success");
      this.reader = null;
      this.closedPromise = null;
      // this.appStorage.data.lastUsedSerialPort.portState = PortState.CLOSED;
      // this.appStorage.saveData();
      const lastUsedSerialPort: LastUsedSerialPort = this.appStorage.getData("lastUsedSerialPort");
      lastUsedSerialPort.portState = PortState.CLOSED;
      this.appStorage.saveData("lastUsedSerialPort", lastUsedSerialPort);
    } else if (this.lastSelectedPortType === PortType.FAKE) {
      this.fakePortController.closePort();
    } else {
      throw Error("Unsupported port type!");
    }
  }

  stopWaitingToReopenPort() {
    this.portState = PortState.CLOSED;
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
   * @returns Nothing.
   */
  handleTerminalKeyDown = async (event: React.KeyboardEvent) => {
    // console.log('handleTerminalKeyDown() called. event.key=', event.key);

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
    const alphaNumericChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqurstuvwxyz0123456789";
    if (event.key === "Control" || event.key === "Shift") {
      // Don't send anything if a control key/shift key was pressed by itself
      return;
    } else if (event.key === "Enter") {
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
    }
    //===========================================================
    // HANDLE BACKSPACE AND DELETE KEY PRESSES
    //===========================================================
    else if (event.key === 'Backspace') {
      // Work out whether to send BS (0x08) or DEL (0x7F) based on settings
      if (this.settings.dataProcessingSettings.backspaceKeyPressBehavior === BackspaceKeyPressBehavior.SEND_BACKSPACE) {
        bytesToWrite.push(0x08);
      } else if (this.settings.dataProcessingSettings.backspaceKeyPressBehavior === BackspaceKeyPressBehavior.SEND_DELETE) {
        bytesToWrite.push(0x7F);
      } else {
        throw Error('Unsupported backspace key press behavior!');
      }
    } else if (event.key === 'Delete') {
      // Delete also has the option of sending [ESC][3~
      if (this.settings.dataProcessingSettings.deleteKeyPressBehavior === DeleteKeyPressBehaviors.SEND_BACKSPACE) {
        bytesToWrite.push(0x08);
      } else if (this.settings.dataProcessingSettings.deleteKeyPressBehavior === DeleteKeyPressBehaviors.SEND_DELETE) {
        bytesToWrite.push(0x7F);
      } else if (this.settings.dataProcessingSettings.deleteKeyPressBehavior === DeleteKeyPressBehaviors.SEND_VT_SEQUENCE) {
        bytesToWrite.push(0x1B, "[".charCodeAt(0), "3".charCodeAt(0), "~".charCodeAt(0));
      } else {
        throw Error('Unsupported delete key press behavior!');
      }
    }
    //===========================================================
    // HANDLE ARROW KEY PRESSES
    //===========================================================
    else if (event.key === "ArrowLeft") {
      // Send "ESC[D" (go back 1)
      bytesToWrite.push(0x1b, "[".charCodeAt(0), "D".charCodeAt(0));
    } else if (event.key === "ArrowRight") {
      // Send "ESC[C" (go forward 1)
      bytesToWrite.push(0x1b, "[".charCodeAt(0), "C".charCodeAt(0));
    } else if (event.key === "ArrowUp") {
      // Send "ESC[A" (go up 1)
      bytesToWrite.push(0x1b, "[".charCodeAt(0), "A".charCodeAt(0));
    } else if (event.key === "ArrowDown") {
      // Send "ESC[B" (go down 1)
      bytesToWrite.push(0x1b, "[".charCodeAt(0), "B".charCodeAt(0));
    } else if (event.key === "Tab") {
      // Send horizontal tab, HT, 0x09
      bytesToWrite.push(0x09);
    } else {
      // If we get here, we don't know what to do with the key press
      console.log("Unsupported char! event=", event);
      return;
    }
    const writer = this.port?.writable?.getWriter();

    const txDataAsUint8Array = Uint8Array.from(bytesToWrite);
    console.log("Sending data to serial port. txDataAsUint8Array=", txDataAsUint8Array);
    await writer?.write(txDataAsUint8Array);

    // Allow the serial port to be closed later.
    writer?.releaseLock();
    this.terminals.txTerminal.parseData(txDataAsUint8Array);
    // Check if local TX echo is enabled, and if so, send the data to
    // the combined single terminal.
    if (this.settings.dataProcessingSettings.localTxEcho) {
      this.terminals.txRxTerminal.parseData(txDataAsUint8Array);
    }

    // Also send this data to the logger, it may need it
    this.logging.handleTxData(txDataAsUint8Array);

    runInAction(() => {
      this.numBytesTransmitted += bytesToWrite.length;
    });
  };

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

  /** Handles any stray key press that was not caught by a child node.
   * For example, pressing "f" while on the Port Configuration settings
   * this cause this function to be called.
   *
   * This is not the function that sends data out the serial port, that
   * is handleTerminalKeyDown(), which is called by the Terminals.
   */
  handleKeyDown(event: React.KeyboardEvent) {
    if (this.shownMainPane === MainPanes.SETTINGS && this.settings.activeSettingsCategory === SettingsCategories.PORT_CONFIGURATION && event.key === "f") {
      this.fakePortController.setIsDialogOpen(true);
    }
  }

  swOnNeedRefresh(updateSw: (reloadPage?: boolean | undefined) => Promise<void>) {
    console.log("onNeedRefresh() called.");
    this.snackbar.sendToSnackbar(
      "A new version of NinjaTerm is available. Click Reload to update.",
      "info",
      (snackbarId) => (
        <>
          <Button
            onClick={() => {
              updateSw(true);
            }}
            color="info"
            variant="text"
            sx={{
              color: "rgb(33, 150, 243)",
              backgroundColor: "white",
            }}
          >
            Reload
          </Button>
          <Button
            onClick={() => {
              closeSnackbar(snackbarId);
            }}
            color="info"
            variant="text"
            sx={{
              color: "white",
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
    console.log("onOfflineReady() called.");
    this.snackbar.sendToSnackbar("NinjaTerm is offline ready.", "info");
  }

  swOnRegisterError(error: any) {
    console.log("onRegisterError() called.");
    console.error(error.message);
  }
}
