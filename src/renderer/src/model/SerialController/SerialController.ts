import { makeAutoObservable, runInAction } from 'mobx';
import { PortInfo } from '@serialport/bindings-interface';

import { App, MainPanes } from '../App';
import { PortState, ConnectionType } from '../Settings/PortSettings/PortSettings';
import { BluetoothLEController } from './BluetoothLEController';

export enum PortType {
  REAL,
  FAKE,
  SOCKET,
  BLUETOOTH,
}

/**
 * Class responsible for all high-level serial port related functionality.
 *
 * This used to be in App but moved here when the amount of logic was getting large.
 *
 * TODO: Rename to ConnectionController as this now supports different types of connections (serial port, socket, Bluetooth).
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

  // Current socket connection ID for IPC communication
  currentSocketConnectionId: string | null = null;

  // Current Bluetooth device ID for IPC communication
  currentBluetoothDeviceId: string | null = null;

  /**
   * The state of the connection.
   *
   * This is used no matter what the connection type is, e.g. it applies to serial ports, sockets, and Bluetooth.
   */
  portState = PortState.CLOSED;

  // Remembers the last selected port type, so open() and close()
  // know what type of port to operate on
  lastSelectedPortType = PortType.REAL;

  private app: App;

  // Port information for reconnection purposes
  serialPortInfo: Partial<PortInfo> | null = null;

  // Socket information for reconnection purposes
  socketConnectionInfo: { host: string; port: number } | null = null;

  // Bluetooth device information for reconnection purposes
  bluetoothDeviceInfo: { deviceId: string; deviceName?: string } | null = null;

  bluetoothLEController: BluetoothLEController;

  // Auto-reconnection polling
  private reconnectionPollingInterval: NodeJS.Timeout | null = null;
  private readonly RECONNECTION_POLLING_INTERVAL_MS = 500; // Poll every 500ms for serial ports
  private readonly SOCKET_RECONNECTION_INTERVAL_MS = 5000; // Poll every 5 seconds for sockets

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

    this.bluetoothLEController = new BluetoothLEController(app);

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
    // Determine the port type based on connection type
    const connectionType = this.app.settings.portConfiguration.connectionType;

    if (connectionType === ConnectionType.SERIAL_PORT) {
      // Handle fake ports
      if (this.lastSelectedPortType === PortType.FAKE) {
        this.app.fakePortController.openPort();
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

      // Handle real serial ports
      const selectedPort = this.app.settings.portConfiguration.selectedSerialPort;
      if (!selectedPort) {
        this.app.snackbar.sendToSnackbar('No serial port selected. Please select a port from the Port Settings.', 'error');
        return false;
      }

      // Set the port type to REAL since we're opening a real serial port
      this.lastSelectedPortType = PortType.REAL;

      // Show the circular progress modal when trying to open the port
      this.app.setShowCircularProgressModal(true);

      try {
        // Make direct IPC call to open the port
        const result = await window.electronAPI.serial.openPort({
          path: selectedPort.path,
          baudRate: this.app.settings.portConfiguration.baudRate,
          dataBits: this.app.settings.portConfiguration.numDataBits,
          parity: this.app.settings.portConfiguration.parity,
          stopBits: this.app.settings.portConfiguration.stopBits,

          // Flow control settings
          rtscts: this.app.settings.portConfiguration.rtscts,
          xon: this.app.settings.portConfiguration.xon,
          xoff: this.app.settings.portConfiguration.xoff,
          xany: this.app.settings.portConfiguration.xany,
          hupcl: this.app.settings.portConfiguration.hupcl,
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

        // Create timer to poll the readable signals across IPC
        // Save timer to we can clear it when the app is closed
        this.flowControlPollingTimer = setInterval(async () => {
          if (!this.currentPortPath) {
            return;
          }
          const response = await window.electronAPI.serial.getFlowControlSignals(this.currentPortPath);
          // Update the flow control state
          runInAction(() => {
            this.currentFlowControlState.dsr = response.dsr;
            this.currentFlowControlState.cts = response.cts;
            this.currentFlowControlState.dcd = response.dcd;
          });
        }, 1000);

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
    } else if (connectionType === ConnectionType.SOCKET) {
      // Socket connection logic
      const host = this.app.settings.portConfiguration.socketHost;
      const port = this.app.settings.portConfiguration.socketPort;

      if (!host || port <= 0 || port > 65535) {
        this.app.snackbar.sendToSnackbar('Invalid socket host or port. Please check the Connection Configuration.', 'error');
        return false;
      }

      // Show the circular progress modal when trying to connect to socket
      this.app.setShowCircularProgressModal(true);

      try {
        // Make direct IPC call to connect to socket
        const result = await window.electronAPI.socket.connect({
          host: host,
          port: port
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        // Store the current connection ID for IPC communication
        this.currentSocketConnectionId = result.connectionId!;

        // Save socket connection info for reconnection purposes
        this.socketConnectionInfo = { host, port };

        // Set up IPC event listeners for data reception
        window.electronAPI.socket.onDataReceived((connectionId: string, data: Buffer) => {
          if (connectionId === this.currentSocketConnectionId) {
            // Buffer can be used directly as Uint8Array - much faster than conversion
            const uint8Array = new Uint8Array(data);
            this.app.parseRxData(uint8Array);
          }
        });

        // Listen for errors
        window.electronAPI.socket.onError((connectionId: string, error: string) => {
          if (connectionId === this.currentSocketConnectionId) {
            this.app.snackbar.sendToSnackbar(`Socket error: ${error}`, 'error');
            this.handlePortError();
          }
        });

        // Listen for socket close events
        window.electronAPI.socket.onClosed((connectionId: string) => {
          console.log('onSocketClosed() called. connectionId=', connectionId);
          if (connectionId === this.currentSocketConnectionId) {
            this.handlePortClosed();
          }
        });

        runInAction(() => {
          // Stop any existing polling since we're now connected
          this.stopPollingForReconnection();
          this.portState = PortState.OPENED;
          this.lastSelectedPortType = PortType.SOCKET;
        });

        if (!silenceSnackbar) {
          this.app.snackbar.sendToSnackbar(`Socket connected to ${host}:${port}.`, 'success');
        }

        this.app.setShowCircularProgressModal(false);

        // Create custom GA4 event to see how many socket connections have been opened in NinjaTerm
        await window.electronAPI.analytics.event('socket_connect');
      } catch (error) {
        const msg = `Error connecting to socket: ${error}`;
        this.app.snackbar.sendToSnackbar(msg, 'error');
        console.error(msg);
        this.app.setShowCircularProgressModal(false);
        return false;
      }
    } else if (connectionType === ConnectionType.BLUETOOTH) {
      this.bluetoothLEController.open();
    } else {
      throw Error(`Unsupported connection type. connectionType=${connectionType}.`);
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
   * Closes the open connection.
   *
   * @param goToReopenState If true, the port will be set to the CLOSED_BUT_WILL_REOPEN state.
   * @param silenceSnackbar If true, the snackbar will not be shown when the port is closed successfully.
   */
  async closeConnection({ goToReopenState = false, silenceSnackbar = false } = {}) {
    const connectionType = this.app.settings.portConfiguration.connectionType;
    if (connectionType === ConnectionType.SERIAL_PORT) {
      if (this.lastSelectedPortType === PortType.REAL) {
        if (this.currentPortPath) {
          // Make direct IPC call to close the port
          const result = await window.electronAPI.serial.closePort(this.currentPortPath);
          if (!result.success) {
            console.error('Error closing port:', result.error);
          }
        }

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
      }
    } else if (connectionType === ConnectionType.SOCKET) {
      if (this.currentSocketConnectionId) {
        // Make direct IPC call to disconnect the socket
        const result = await window.electronAPI.socket.disconnect(this.currentSocketConnectionId);
        if (!result.success) {
          console.error('Error disconnecting socket:', result.error);
        }
      }

      if (!silenceSnackbar) {
        this.app.snackbar.sendToSnackbar('Socket disconnected.', 'success');
      }

      this.currentSocketConnectionId = null;

      // Disconnect all listeners
      window.electronAPI.socket.removeAllListeners('socket:data-received');
      window.electronAPI.socket.removeAllListeners('socket:error');
      window.electronAPI.socket.removeAllListeners('socket:closed');
    } else if (connectionType === ConnectionType.BLUETOOTH) {
      // The Bluetooth LE controller handles closing the Bluetooth connection
      this.bluetoothLEController.close();
    } else if (connectionType === ConnectionType.FAKE) {
      this.app.fakePortController.closePort();
    } else {
      throw Error('Unsupported port type!');
    }

    //==============================================
    // CODE BELOW IS THE SAME FOR ALL CONNECTION TYPES
    //==============================================

    // Wrap in action
    runInAction(() => {
      if (goToReopenState) {
        this.portState = PortState.CLOSED_BUT_WILL_REOPEN;
        // Start polling for Bluetooth device reconnection
        this.startPollingForReconnection();
      } else {
        // Stop polling if we're explicitly closing the device
        this.stopPollingForReconnection();
        this.portState = PortState.CLOSED;
      }
    });

    // No matter what type, clear the flow control polling timer
    if (this.flowControlPollingTimer) {
      clearInterval(this.flowControlPollingTimer);
      this.flowControlPollingTimer = null;
    }

    // Reset the flow control state
    runInAction(() => {
      this.currentFlowControlState.dtr = false;
      this.currentFlowControlState.dsr = false;
      this.currentFlowControlState.rts = false;
      this.currentFlowControlState.cts = false;
      this.currentFlowControlState.dcd = false;
    });
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
    // Clear connection identifiers and remove appropriate event listeners
    if (this.lastSelectedPortType === PortType.SOCKET) {
      this.currentSocketConnectionId = null;
      // Remove socket event listeners
      window.electronAPI.socket.removeAllListeners('socket:data-received');
      window.electronAPI.socket.removeAllListeners('socket:error');
      window.electronAPI.socket.removeAllListeners('socket:closed');
    } else {
      this.currentPortPath = null;
      // Remove serial port event listeners
      window.electronAPI.serial.removeAllListeners('serial:data-received');
      window.electronAPI.serial.removeAllListeners('serial:error');
      window.electronAPI.serial.removeAllListeners('serial:port-closed');
    }

    // No matter what type, clear the flow control polling timer
    if (this.flowControlPollingTimer) {
      clearInterval(this.flowControlPollingTimer);
      this.flowControlPollingTimer = null;
    }

    // Reset the flow control state
    runInAction(() => {
      this.currentFlowControlState.dtr = false;
      this.currentFlowControlState.dsr = false;
      this.currentFlowControlState.rts = false;
      this.currentFlowControlState.cts = false;
      this.currentFlowControlState.dcd = false;
    });
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

    // Determine connection type and set appropriate polling interval
    const isSocket = this.lastSelectedPortType === PortType.SOCKET;
    const pollingInterval = isSocket ? this.SOCKET_RECONNECTION_INTERVAL_MS : this.RECONNECTION_POLLING_INTERVAL_MS;
    const connectionType = isSocket ? 'socket' : 'port';

    console.log(`Starting polling for ${connectionType} reconnection... (${pollingInterval}ms interval)`);

    this.reconnectionPollingInterval = setInterval(async () => {
      try {
        // Only poll if we're still in the CLOSED_BUT_WILL_REOPEN state
        if (this.portState !== PortState.CLOSED_BUT_WILL_REOPEN) {
          this.stopPollingForReconnection();
          return;
        }

        if (isSocket) {
          // Socket reconnection logic
          if (!this.socketConnectionInfo) {
            console.log('No socket connection info found, stopping polling');
            this.stopPollingForReconnection();
            return;
          }

          console.log(`Attempting to reconnect to socket ${this.socketConnectionInfo.host}:${this.socketConnectionInfo.port}...`);

          try {
            // Attempt to reconnect to the socket (this will not show the modal)
            const result = await window.electronAPI.socket.connect({
              host: this.socketConnectionInfo.host,
              port: this.socketConnectionInfo.port
            });

            if (result.success) {
              console.log('Socket reconnection successful');
              this.stopPollingForReconnection();

              // Store the new connection ID
              this.currentSocketConnectionId = result.connectionId!;

              // Set up IPC event listeners for the reconnected socket
              window.electronAPI.socket.onDataReceived((connectionId: string, data: Buffer) => {
                if (connectionId === this.currentSocketConnectionId) {
                  // Buffer can be used directly as Uint8Array - much faster than conversion
                  const uint8Array = new Uint8Array(data);
                  this.app.parseRxData(uint8Array);
                }
              });

              window.electronAPI.socket.onError((connectionId: string, error: string) => {
                if (connectionId === this.currentSocketConnectionId) {
                  this.app.snackbar.sendToSnackbar(`Socket error: ${error}`, 'error');
                  this.handlePortError();
                }
              });

              window.electronAPI.socket.onClosed((connectionId: string) => {
                console.log('onSocketClosed() called during reconnection. connectionId=', connectionId);
                if (connectionId === this.currentSocketConnectionId) {
                  this.handlePortClosed();
                }
              });

              runInAction(() => {
                this.portState = PortState.OPENED;
              });

              this.app.snackbar.sendToSnackbar(
                `Automatically reconnected to socket: ${this.socketConnectionInfo.host}:${this.socketConnectionInfo.port}`,
                'success'
              );
            }
          } catch (socketError) {
            // Silently continue polling - connection failed but we'll try again
            console.log('Socket reconnection attempt failed:', socketError);
          }
        } else {
          // Serial port reconnection logic (existing)
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
        }
      } catch (error) {
        console.error(`Error during ${connectionType} reconnection polling:`, error);
      }
    }, pollingInterval);
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
    // NOTE: Can't just provide this.currentFlowControlState as the second argument because this gives the React error: "Uncaught Error: An object could not be cloned.". Likely due to MobX.
    window.electronAPI.serial.setFlowControlSignals(
      this.currentPortPath, {
        dtr: this.currentFlowControlState.dtr,
        dsr: this.currentFlowControlState.dsr,
        rts: this.currentFlowControlState.rts,
        cts: this.currentFlowControlState.cts,
        dcd: this.currentFlowControlState.dcd,
    });
  }
  getDtr() {
    return this.currentFlowControlState.dtr;
  }
  setDsr(dsr: boolean) {
    this.currentFlowControlState.dsr = dsr;
    if (!this.currentPortPath) {
      return;
    }
    // Send IPC message to main process to update the flow control state
    window.electronAPI.serial.setFlowControlSignals(
      this.currentPortPath, {
        dtr: this.currentFlowControlState.dtr,
        dsr: this.currentFlowControlState.dsr,
        rts: this.currentFlowControlState.rts,
        cts: this.currentFlowControlState.cts,
        dcd: this.currentFlowControlState.dcd,
    });
  }
  getDsr() {
    return this.currentFlowControlState.dsr;
  }
  setRts(rts: boolean) {
    console.log('setRts() called. rts=', rts);
    this.currentFlowControlState.rts = rts;
    if (!this.currentPortPath) {
      return;
    }
    // Send IPC message to main process to update the flow control state
    window.electronAPI.serial.setFlowControlSignals(
      this.currentPortPath, {
        dtr: this.currentFlowControlState.dtr,
        dsr: this.currentFlowControlState.dsr,
        rts: this.currentFlowControlState.rts,
        cts: this.currentFlowControlState.cts,
        dcd: this.currentFlowControlState.dcd,
    });
  }
  getRts() {
    return this.currentFlowControlState.rts;
  }
  setCts(cts: boolean) {
    this.currentFlowControlState.cts = cts;
    if (!this.currentPortPath) {
      return;
    }
    // Send IPC message to main process to update the flow control state
    window.electronAPI.serial.setFlowControlSignals(
      this.currentPortPath, {
        dtr: this.currentFlowControlState.dtr,
        dsr: this.currentFlowControlState.dsr,
        rts: this.currentFlowControlState.rts,
        cts: this.currentFlowControlState.cts,
        dcd: this.currentFlowControlState.dcd,
    });
  }
  getCts() {
    return this.currentFlowControlState.cts;
  }
  getDcd() {
    return this.currentFlowControlState.dcd;
  }

  /**
   * Function that sorts serial ports naturally by path (handles numeric parts correctly, e.g., "COM6" before "COM16", "/dev/ttyUSB0" before "/dev/ttyUSB10").
   *
   * Works on Windows, Linux, and macOS.
   *
   * @param ports The ports to sort.
   * @returns The sorted ports.
   */
  static sortSerialPortsNaturally(ports: PortInfo[]) {
    const sortedPorts = ports.sort((a, b) => {
      const pathA = a.path;
      const pathB = b.path;

      // Extract numeric parts from the paths for natural sorting
      const matchA = pathA.match(/^(\D*)(\d+)(.*)$/);
      const matchB = pathB.match(/^(\D*)(\d+)(.*)$/);

      if (matchA && matchB) {
        // Both have numeric parts
        const [, prefixA, numA, suffixA] = matchA;
        const [, prefixB, numB, suffixB] = matchB;

        // First compare the prefix (e.g., "COM")
        const prefixCompare = prefixA.localeCompare(prefixB);
        if (prefixCompare !== 0) return prefixCompare;

        // Then compare numerically (e.g., 6 vs 16)
        const numCompare = parseInt(numA, 10) - parseInt(numB, 10);
        if (numCompare !== 0) return numCompare;

        // Finally compare the suffix
        return suffixA.localeCompare(suffixB);
      }

      // Fall back to alphabetical comparison for non-matching patterns
      return pathA.localeCompare(pathB);
    });

    return sortedPorts;
  }

  /**
   * Determines if the connection is ready to be opened based on the current configuration.
   *
   * @returns true if the connection can be opened, false otherwise
   */
  isReadyToOpen(): boolean {
    // If port is not closed, it's either already open or will reopen, so connection control is available
    if (this.portState !== PortState.CLOSED) {
      return true;
    }

    // If there are baud rate validation errors, can't open
    if (this.app.settings.portConfiguration.baudRateErrorMsg !== '') {
      return false;
    }

    // Check if it's a fake port (always ready if fake)
    if (this.lastSelectedPortType === PortType.FAKE) {
      return true;
    }

    // Check based on connection type
    const connectionType = this.app.settings.portConfiguration.connectionType;

    if (connectionType === ConnectionType.SERIAL_PORT) {
      // For serial ports, need a selected port
      return this.app.settings.portConfiguration.selectedSerialPort !== null;
    } else if (connectionType === ConnectionType.SOCKET) {
      const host = this.app.settings.portConfiguration.socketHost;
      if (host === '') {
        return false;
      }

      const port = this.app.settings.portConfiguration.socketPort;
      if (port <= 0 || port > 65535) {
        return false;
      }

      // Check if the socket connection timeout is valid
      if (this.app.settings.portConfiguration.socketConnTimeoutErrorMsg !== '') {
        return false;
      }

      return true;
    } else if (connectionType === ConnectionType.BLUETOOTH) {
      // For Bluetooth, need a selected device
      return this.bluetoothLEController.selectedBluetoothDevice !== null;
    }

    // Unknown connection type
    return false;
  }
}
