import { makeAutoObservable, runInAction } from 'mobx';
import { PortInfo } from '@serialport/bindings-interface';

import { App, MainPanes } from '../App';
import { PortState } from '../Settings/PortSettings/PortSettings';

export enum PortType {
  REAL,
  FAKE,
}

/**
 * Class responsible for all high-level serial port related functionality.
 *
 * This used to be in App but moved here when the amount of logic was getting large.
 */
export class SerialController {

  currentFlowControlState: {
    dtr: boolean; // DTE -> DCE. Data Terminal Ready. Write only (from node serialport).
    dsr: boolean; // DCE -> DTE. Data Set Ready. Read/write.
    rts: boolean; // DTE -> DCE. Request To Send. Write only.
    cts: boolean; // DCE -> DTE. Clear To Send. Read/write.
    dcd: boolean; // DCE -> DTE. Data Carrier Detect. Read only.
  };

  // Current port path for IPC communication
  currentPortPath: string | null = null;

  portState = PortState.CLOSED;

  // Remembers the last selected port type, so open() and close()
  // know what type of port to operate on
  lastSelectedPortType = PortType.REAL;

  private app: App;

  // Port information for reconnection purposes
  serialPortInfo: Partial<PortInfo> | null = null;

  // Auto-reconnection polling
  private reconnectionPollingInterval: NodeJS.Timeout | null = null;
  private readonly RECONNECTION_POLLING_INTERVAL_MS = 500; // Poll every 2 seconds

  private flowControlPollingTimer: NodeJS.Timeout | null = null;

  /**
   * Creates a new SerialController instance.
   *
   * @param app The main app instance.
   */
  constructor(app: App) {
    this.app = app;
    this.currentFlowControlState = {
      dtr: false,
      dsr: false,
      rts: false,
      cts: false,
      dcd: false,
    };

    // Create timer to poll the readable signals across IPC
    // Save timer to we can clear it when the app is closed
    this.flowControlPollingTimer = setInterval(async () => {
      if (!this.currentPortPath) {
        return;
      }
      const response = await window.electronAPI.serial.getFlowControlSignals(this.currentPortPath);
      console.log(response);
      // Update the flow control state
      runInAction(() => {
        this.currentFlowControlState.dsr = response.dsr;
        this.currentFlowControlState.cts = response.cts;
        this.currentFlowControlState.dcd = response.dcd;
      });
    }, 1000);

    // Make sure to do this at the end of the constructor
    makeAutoObservable(this);
  }

  cleanup() {
    this.stopPollingForReconnection();
  }

  /**
   * Opens the selected serial port using settings from the Port Configuration view.
   *
   * @param obj Optional object with the following properties:
   * @param obj.silenceSnackbar If true, the snackbar will not be shown when the port is opened successfully.
   * @returns {Promise<bool>} A promise that contains true if the port was opened successfully, false otherwise.
   */
  async openPort({ silenceSnackbar = false } = {}) {
    if (this.lastSelectedPortType === PortType.REAL) {
      // Get the selected port from PortSettings
      const selectedPort = this.app.settings.portConfiguration.selectedSerialPort;
      if (!selectedPort) {
        this.app.snackbar.sendToSnackbar('No serial port selected. Please select a port from the Port Settings.', 'error');
        return false;
      }

      // Show the circular progress modal when trying to open the port
      this.app.setShowCircularProgressModal(true);

      try {
        // Make direct IPC call to open the port
        const result = await window.electronAPI.serial.openPort(selectedPort.path, {
          baudRate: this.app.settings.portConfiguration.baudRate,
          dataBits: this.app.settings.portConfiguration.numDataBits,
          parity: this.app.settings.portConfiguration.parity,
          stopBits: this.app.settings.portConfiguration.stopBits,
          flowControl: this.app.settings.portConfiguration.flowControl,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        // Store the current port path for IPC communication
        this.currentPortPath = selectedPort.path;

        // Set up IPC event listeners for data reception
        // The listeners are cleared in the app constructor. This is useful during development with hot reloading, if we
        // didn't do this, the listeners would be added multiple times.
        window.electronAPI.serial.onDataReceived((portPath: string, data: Buffer) => {
          if (portPath === this.currentPortPath) {
            // console.log('onDataReceived() called. data.length=', data.length);
            // Buffer can be used directly as Uint8Array - much faster than conversion
            const uint8Array = new Uint8Array(data);
            this.app.parseRxData(uint8Array);
          }
        });

        // Listen for errors
        window.electronAPI.serial.onError((portPath: string, error: string) => {
          if (portPath === this.currentPortPath) {
            this.app.snackbar.sendToSnackbar(`Serial port error: ${error}`, 'error');
            this.handlePortError();
          }
        });

        // Listen for port close events
        // This is called even if we trigger the close with the closePort() function
        window.electronAPI.serial.onPortClosed((portPath: string) => {
          console.log('onPortClosed() called. portPath=', portPath);
          if (portPath === this.currentPortPath) {
            this.handlePortClosed();
          }
        });

        runInAction(() => {
          // Stop any existing polling since we're now connected
          this.stopPollingForReconnection();
          // Save port info for reconnection - selectedPort is already a PortInfo object
          this.serialPortInfo = selectedPort;
          this.portState = PortState.OPENED;
        });

        // Remember this port so it can be reopened if the app is restarted
        const lastUsedSerialPort = this.app.profileManager.appData.currentAppConfig.lastUsedSerialPort;
        lastUsedSerialPort.path = selectedPort.path;
        lastUsedSerialPort.portState = PortState.OPENED;
        this.app.profileManager.saveAppData();

      } catch (error) {
        const msg = `Error opening serial port: ${error}`;
        this.app.snackbar.sendToSnackbar(msg, 'error');
        console.error(msg);
        this.app.setShowCircularProgressModal(false);
        return false;
      }

      if (!silenceSnackbar) {
        this.app.snackbar.sendToSnackbar('Serial port opened.', 'success');
      }

      this.app.setShowCircularProgressModal(false);

      // Create custom GA4 event to see how many ports have been opened in NinjaTerm
      await window.electronAPI.analytics.event('port_open');
    } else if (this.lastSelectedPortType === PortType.FAKE) {
      this.app.fakePortController.openPort();
    } else {
      throw Error('Unsupported port type!');
    }

    // Clear the partial number buffers in all terminals
    this.app.terminals.txTerminal.clearPartialNumberBuffer();
    this.app.terminals.rxTerminal.clearPartialNumberBuffer();
    this.app.terminals.txRxTerminal.clearPartialNumberBuffer();

    // Navigate to the terminal pane if option is selected in Port Configuration settings
    if (this.app.settings.portConfiguration.connectToSerialPortAsSoonAsItIsSelected) {
      this.app.setShownMainPane(MainPanes.TERMINAL);
    }

    return true;
  }

  /**
   * Closes the open serial port.
   *
   * @param goToReopenState If true, the port will be set to the CLOSED_BUT_WILL_REOPEN state.
   * @param silenceSnackbar If true, the snackbar will not be shown when the port is closed successfully.
   */
  async closePort({ goToReopenState = false, silenceSnackbar = false } = {}) {
    if (this.lastSelectedPortType === PortType.REAL) {
      if (this.currentPortPath) {
        // Make direct IPC call to close the port
        const result = await window.electronAPI.serial.closePort(this.currentPortPath);
        if (!result.success) {
          console.error('Error closing port:', result.error);
        }
      }

      // Wrap in action
      runInAction(() => {
        if (goToReopenState) {
          this.portState = PortState.CLOSED_BUT_WILL_REOPEN;
          // Start polling for the port to become available again
          this.startPollingForReconnection();
        } else {
          // Stop polling if we're explicitly closing the port
          this.stopPollingForReconnection();
          this.portState = PortState.CLOSED;
        }
      });

      if (!silenceSnackbar) {
        this.app.snackbar.sendToSnackbar('Serial port closed.', 'success');
      }

      this.currentPortPath = null;
      const lastUsedSerialPort = this.app.profileManager.appData.currentAppConfig.lastUsedSerialPort;
      lastUsedSerialPort.portState = PortState.CLOSED;

      // Disconnect all listeners
      window.electronAPI.serial.removeAllListeners('serial:data-received');
      window.electronAPI.serial.removeAllListeners('serial:error');
      window.electronAPI.serial.removeAllListeners('serial:port-closed');

      this.app.profileManager.saveAppData();
    } else if (this.lastSelectedPortType === PortType.FAKE) {
      this.app.fakePortController.closePort();
    } else {
      throw Error('Unsupported port type!');
    }

    // No matter what type, clear the flow control polling timer
    if (this.flowControlPollingTimer) {
      clearInterval(this.flowControlPollingTimer);
      this.flowControlPollingTimer = null;
    }
  }

  stopWaitingToReopenPort() {
    this.stopPollingForReconnection();
    this.portState = PortState.CLOSED;
  }

  /**
   * Handles serial port errors
   */
  private handlePortError() {
    // Handle various error types here if needed
    console.log('Serial port error occurred');
  }

  /**
   * Handles unexpected port close events
   */
  private handlePortClosed() {
    console.log('handleUnexpectedPortClose() called');
    // We might have already closed the port, so don't do anything if it's already closed
    if (this.portState === PortState.CLOSED || this.portState === PortState.CLOSED_BUT_WILL_REOPEN) {
      return;
    }

    // If the port was closed unexpectedly, we might want to reopen it
    if (this.app.settings.portConfiguration.reopenSerialPortIfUnexpectedlyClosed) {
      this.setPortState(PortState.CLOSED_BUT_WILL_REOPEN);
      // Start polling for the port to become available again
      this.startPollingForReconnection();
    } else {
      this.setPortState(PortState.CLOSED);
    }
    this.currentPortPath = null;
    // Remove all event listeners
    window.electronAPI.serial.removeAllListeners('serial:data-received');
    window.electronAPI.serial.removeAllListeners('serial:error');
    window.electronAPI.serial.removeAllListeners('serial:port-closed');
  }

  setPortState(newPortState: PortState) {
    this.portState = newPortState;
  }

  /**
   * Starts polling for the previously used port to become available again.
   * This is called when the port state is set to CLOSED_BUT_WILL_REOPEN.
   */
  private startPollingForReconnection() {
    if (this.reconnectionPollingInterval) {
      clearInterval(this.reconnectionPollingInterval);
    }

    console.log('Starting polling for port reconnection...');

    this.reconnectionPollingInterval = setInterval(async () => {
      try {
        // Only poll if we're still in the CLOSED_BUT_WILL_REOPEN state
        if (this.portState !== PortState.CLOSED_BUT_WILL_REOPEN) {
          this.stopPollingForReconnection();
          return;
        }

        // Get the last used port path
        const lastUsedPortPath = this.app.profileManager.appData.currentAppConfig.lastUsedSerialPort.path;
        if (!lastUsedPortPath) {
          console.log('No last used port path found, stopping polling');
          this.stopPollingForReconnection();
          return;
        }

        // Check if the port is available
        const result = await window.electronAPI.serial.listPorts();
        if (!result.success) {
          console.error('Failed to list ports during reconnection polling:', result.error);
          return;
        }

        const availablePorts = result.ports || [];
        const matchingPort = availablePorts.find(port => port.path === lastUsedPortPath);

        if (matchingPort) {
          console.log('Found matching port for reconnection:', matchingPort.path);
          this.stopPollingForReconnection();

          // Set the selected port and attempt to reconnect
          this.setSelectedPort(matchingPort);
          await this.openPort({ silenceSnackbar: true });

          this.app.snackbar.sendToSnackbar(`Automatically reconnected to port: ${matchingPort.path}`, 'success');
        }
      } catch (error) {
        console.error('Error during reconnection polling:', error);
      }
    }, this.RECONNECTION_POLLING_INTERVAL_MS);
  }

  /**
   * Stops polling for port reconnection and clears the polling interval.
   */
  private stopPollingForReconnection() {
    if (this.reconnectionPollingInterval) {
      console.log('Stopping polling for port reconnection');
      clearInterval(this.reconnectionPollingInterval);
      this.reconnectionPollingInterval = null;
    }
  }

    /**
   * Set the port which will be used if open() is called.
   *
   * @param port The serial port info to set as the selected port.
   */
    setSelectedPort = (port: PortInfo) => {
      this.serialPortInfo = port;
    };

  setDtr(dtr: boolean) {
    this.currentFlowControlState.dtr = dtr;
    if (!this.currentPortPath) {
      return;
    }
    // Send IPC message to main process to update the flow control state
    window.electronAPI.serial.setFlowControlSignals(this.currentPortPath, this.currentFlowControlState);
  }
  setDsr(dsr: boolean) {
    this.currentFlowControlState.dsr = dsr;
    if (!this.currentPortPath) {
      return;
    }
    // Send IPC message to main process to update the flow control state
    window.electronAPI.serial.setFlowControlSignals(this.currentPortPath, this.currentFlowControlState);
  }
  setRts(rts: boolean) {
    this.currentFlowControlState.rts = rts;
    if (!this.currentPortPath) {
      return;
    }
    // Send IPC message to main process to update the flow control state
    window.electronAPI.serial.setFlowControlSignals(this.currentPortPath, this.currentFlowControlState);
  }
  setCts(cts: boolean) {
    this.currentFlowControlState.cts = cts;
    if (!this.currentPortPath) {
      return;
    }
    // Send IPC message to main process to update the flow control state
    window.electronAPI.serial.setFlowControlSignals(this.currentPortPath, this.currentFlowControlState);
  }
}
