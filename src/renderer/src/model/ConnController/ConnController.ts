import { makeAutoObservable, runInAction } from 'mobx';
import { PortInfo } from '@serialport/bindings-interface';

import { App, MainPanes } from '../App';
import { ConnState, ConnectionType } from '../Settings/PortSettings/PortSettings';
import { BluetoothLEController } from './BluetoothLEController';
import { log } from '../Util/Log';
import { Transport, TransportCallbacks } from './Transports/Transport';
import { SerialTransport } from './Transports/SerialTransport';
import { SocketTransport } from './Transports/SocketTransport';
import { RttTransport } from './Transports/RttTransport';
import { BleTransport } from './Transports/BleTransport';
import { FakeTransport } from './Transports/FakeTransport';

/**
 * Owns the connection state machine, independent of how bytes actually move.
 *
 * Everything medium-specific lives behind the `Transport` interface — which IPC
 * channel to call, what identifies a connection, and the listeners it
 * registered. This class owns what is common to all of them: the state machine,
 * the progress modal, snackbars, the reconnection timer, and flow control.
 *
 * `openConnection` used to be a ~370-line if/else over five connection types,
 * with `closeConnection`, `handlePortClosed` and the reconnection poller each
 * repeating the same fan-out. Adding a transport now means writing a
 * `Transport` and adding one line to `_buildTransports`.
 */
export class ConnController {

  currentFlowControlState: {
    dtr: boolean; // DTE -> DCE. Data Terminal Ready. Write only (from node serialport).
    dsr: boolean; // DCE -> DTE. Data Set Ready. Read/write.
    rts: boolean; // DTE -> DCE. Request To Send. Write only.
    cts: boolean; // DCE -> DTE. Clear To Send. Read/write.
    dcd: boolean; // DCE -> DTE. Data Carrier Detect. Read only.
  };

  /**
   * One transport per connection type, built once in the constructor.
   * Adding a connection type means adding an entry here and nothing else.
   */
  private transports!: Map<ConnectionType, Transport>;

  /**
   * Stands in for the serial transport while a fake port is running.
   *
   * Kept out of `transports` deliberately: a fake port is not a connection
   * type the user picks, it is a generator impersonating a serial port for
   * testing. Everything user-facing — the status bar, the right drawer's
   * serial sections, the settings pane — should and does keep treating the
   * connection as `SERIAL_PORT` while one is open.
   */
  private fakeTransport!: FakeTransport;

  /** The transport backing the current — or most recent — connection. */
  private activeTransport: Transport | null = null;

  /**
   * The state of the connection.
   *
   * This is used no matter what the connection type is, e.g. it applies to serial ports, sockets, and Bluetooth.
   */
  connState = ConnState.CLOSED;

  /**
   * True while a fake-port generator is standing in for a real serial port.
   *
   * Set by `FakePortsController` when one is opened. Not persisted: a fake
   * port is a debugging aid, and restoring one on the next launch would be
   * surprising.
   */
  useFakeSerialPort = false;

  private app: App;

  // Auto-reconnection polling
  private reconnectionPollingInterval: NodeJS.Timeout | null = null;

  private flowControlPollingTimer: NodeJS.Timeout | null = null;

  /**
   * Gate for the reconnection polling loop.
   *
   * An attempt can take longer than the polling interval — RTT spawns J-Link
   * Commander and waits for it to attach, which is seconds. Without this gate
   * timer ticks stack up parallel attempts that step on each other.
   */
  private reconnectInFlight = false;

  bluetoothLEController: BluetoothLEController;

  /**
   * Creates a new ConnController instance.
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
    this._buildTransports();

    // Make sure to do this at the end of the constructor
    makeAutoObservable(this);
  }

  /** Instantiates one transport per connection type. */
  private _buildTransports() {
    this.transports = new Map<ConnectionType, Transport>([
      [ConnectionType.SERIAL_PORT, new SerialTransport(this.app)],
      [ConnectionType.SOCKET, new SocketTransport(this.app)],
      [ConnectionType.RTT, new RttTransport(this.app)],
      [ConnectionType.BLUETOOTH_LE, new BleTransport(this.app, this.bluetoothLEController)],
    ]);
    this.fakeTransport = new FakeTransport(this.app);
  }

  /**
   * The transport for the currently selected connection type.
   *
   * A straight lookup, with one stand-in: while a fake port is running it
   * backs `SERIAL_PORT` in place of the real serial transport.
   */
  private _selectTransport(): Transport {
    const connectionType = this.app.settings.portConfiguration.connectionType;
    if (connectionType === ConnectionType.SERIAL_PORT && this.useFakeSerialPort) {
      return this.fakeTransport;
    }
    const transport = this.transports.get(connectionType);
    if (transport === undefined) {
      throw Error(`Unsupported connection type. connectionType=${connectionType}.`);
    }
    return transport;
  }

  /**
   * The callbacks handed to every transport. Identical for all of them — which
   * is the point: a transport only has to say *that* data arrived, not what to
   * do about it.
   */
  private _transportCallbacks(): TransportCallbacks {
    return {
      onData: (bytes: Uint8Array) => this.app.parseRxData(bytes),
      onError: (message: string) => {
        this.app.snackbar.sendToSnackbar(message, 'error');
        log.error(message);
      },
      onClosed: () => this.handlePortClosed(),
    };
  }

  /**
   * Path of the open serial port, or null.
   *
   * A read-only view onto the serial transport, which owns the value. Kept
   * because the e2e IPC-mocking suite asserts on it.
   */
  get currentPortPath(): string | null {
    return (this.transports.get(ConnectionType.SERIAL_PORT) as SerialTransport).openPortPath;
  }

  /** Recent JLinkGDBServer output, shown in the Connection Settings pane. */
  get rttServerLogLines(): string[] {
    return (this.transports.get(ConnectionType.RTT) as RttTransport).serverLogLines;
  }

  cleanup() {
    this.stopPollingForReconnection();
    this.disposeConnListeners();
  }

  /**
   * Asks every transport to drop the listeners it registered. Safe to call
   * multiple times.
   */
  private disposeConnListeners() {
    for (const transport of this.transports.values()) {
      transport.disposeListeners();
    }
    this.fakeTransport.disposeListeners();
  }

  /**
   * Opens the selected connection, whatever type it is.
   *
   * @param obj.silenceSnackbar Suppress the success/failure toast. Used by the
   *    reconnection poller, which would otherwise toast on every retry.
   * @param obj.suppressProgressModal Suppress the circular-progress modal,
   *    which is disruptive during background reconnection.
   * @returns True if the connection was opened.
   */
  async openConnection({ silenceSnackbar = false, suppressProgressModal = false } = {}) {
    const transport = this._selectTransport();

    const validationError = transport.validate();
    if (validationError !== null) {
      this.app.snackbar.sendToSnackbar(validationError, 'error');
      return false;
    }

    const showProgressModal = (show: boolean) => {
      if (!suppressProgressModal) this.app.setShowCircularProgressModal(show);
    };

    showProgressModal(true);
    let outcome;
    try {
      outcome = await transport.open(this._transportCallbacks());
    } finally {
      showProgressModal(false);
    }

    if (!outcome.success) {
      // `error === undefined` means the transport has already told the user
      // what went wrong — Bluetooth reports its own failures as it scans.
      if (outcome.error !== undefined) {
        const msg = `Error opening connection: ${outcome.error}`;
        log.error(msg);
        console.error(msg);
        if (!silenceSnackbar) {
          this.app.snackbar.sendToSnackbar(msg, 'error');
        }
      }
      return false;
    }

    this.activeTransport = transport;

    // Fake ports and Bluetooth drive `connState` from inside their own
    // controllers, so setting it again here would fight them.
    if (!transport.selfManagesState) {
      runInAction(() => {
        this.stopPollingForReconnection();
        this.connState = ConnState.OPENED;
      });

      if (!silenceSnackbar) {
        this.app.snackbar.sendToSnackbar(transport.openedMessage(), 'success');
      }
    } else {
      this.stopPollingForReconnection();
    }

    // Flow control signals are the only part of a connection that has to be
    // polled rather than pushed, and only real serial ports have them.
    if (transport.supportsFlowControl) {
      this.startFlowControlPolling();
    }

    if (transport.openAnalyticsEvent !== null) {
      await window.electronAPI.analytics.event(transport.openAnalyticsEvent);
    }

    // A partially-received number from a previous session would otherwise be
    // completed by the first bytes of this one.
    this.app.terminals.txTerminal.clearPartialNumberBuffer();
    this.app.terminals.rxTerminal.clearPartialNumberBuffer();
    this.app.terminals.txRxTerminal.clearPartialNumberBuffer();

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
    const transport = this.activeTransport ?? this._selectTransport();

    await transport.close();

    if (!transport.selfManagesState && !silenceSnackbar) {
      this.app.snackbar.sendToSnackbar(transport.closedMessage(), 'success');
    }

    runInAction(() => {
      if (goToReopenState) {
        this.connState = ConnState.CLOSED_BUT_WILL_REOPEN;
        this.startPollingForReconnection();
      } else {
        this.stopPollingForReconnection();
        this.connState = ConnState.CLOSED;
      }
    });

    this.stopFlowControlPolling();
  }

  stopWaitingToReopenPort() {
    const transport = this.activeTransport ?? this._selectTransport();
    if (transport.selfManagesReconnection) {
      (transport as BleTransport).stopSelfManagedReconnection();
    } else {
      this.stopPollingForReconnection();
    }
    this.connState = ConnState.CLOSED;
  }

  /**
   * Handles the connection going away without us asking, e.g. the device being
   * unplugged or the far end of a socket hanging up.
   */
  private handlePortClosed() {
    console.log('handlePortClosed() called');
    // We might have already closed the port, so don't do anything if it's already closed
    if (this.connState === ConnState.CLOSED || this.connState === ConnState.CLOSED_BUT_WILL_REOPEN) {
      return;
    }

    if (this.app.settings.portConfiguration.reopenSerialPortIfUnexpectedlyClosed) {
      this.setPortState(ConnState.CLOSED_BUT_WILL_REOPEN);
      this.startPollingForReconnection();
    } else {
      this.setPortState(ConnState.CLOSED);
    }

    // The handle is gone; drop it and the listeners bound to it so a stale
    // event can't be mistaken for a live one.
    const transport = this.activeTransport;
    if (transport !== null) {
      (transport as { forgetConnection?: () => void }).forgetConnection?.();
      transport.disposeListeners();
    }

    this.stopFlowControlPolling();
  }

  /**
   * Polls the readable flow control signals across IPC. Serial only — no other
   * transport has them.
   */
  private startFlowControlPolling() {
    this.stopFlowControlPolling();
    this.flowControlPollingTimer = setInterval(async () => {
      const portPath = (this.transports.get(ConnectionType.SERIAL_PORT) as SerialTransport).openPortPath;
      if (portPath === null) {
        return;
      }
      const response = await window.electronAPI.serial.getFlowControlSignals(portPath);
      if (!response.success) {
        console.error('Error getting flow control signals:', response.error);
        return;
      }
      runInAction(() => {
        this.currentFlowControlState.dsr = response.signals!.dsr || false;
        this.currentFlowControlState.cts = response.signals!.cts || false;
        this.currentFlowControlState.dcd = response.signals!.dcd || false;
      });
    }, 1000);
  }

  /** Stops flow control polling and clears the signal state. */
  private stopFlowControlPolling() {
    if (this.flowControlPollingTimer) {
      clearInterval(this.flowControlPollingTimer);
      this.flowControlPollingTimer = null;
    }
    runInAction(() => {
      this.currentFlowControlState.dtr = false;
      this.currentFlowControlState.dsr = false;
      this.currentFlowControlState.rts = false;
      this.currentFlowControlState.cts = false;
      this.currentFlowControlState.dcd = false;
    });
  }

  /**
   * Retries the active transport until it comes back.
   *
   * Every transport reconnects the same way — check a cheap precondition, then
   * just open again. Only the precondition differs: serial waits for its port
   * path to reappear in the OS port list rather than trying to open a device
   * that is not plugged in, while socket and RTT let the attempt itself be the
   * test.
   */
  private startPollingForReconnection() {
    this.stopPollingForReconnection();

    const transport = this.activeTransport;
    if (transport === null || transport.selfManagesReconnection) {
      // Bluetooth runs its own scan-based loop; there is nothing useful for the
      // shared poller to do.
      return;
    }

    console.log(`Starting reconnection polling (${transport.reconnectIntervalMs}ms interval)`);

    this.reconnectionPollingInterval = setInterval(async () => {
      // An attempt can outlast the interval, so never run two at once.
      if (this.reconnectInFlight) return;

      if (this.connState !== ConnState.CLOSED_BUT_WILL_REOPEN) {
        this.stopPollingForReconnection();
        return;
      }

      this.reconnectInFlight = true;
      try {
        if (!(await transport.canAttemptReconnect())) {
          return;
        }
        const reopened = await this.openConnection({
          silenceSnackbar: true,
          suppressProgressModal: true,
        });
        if (reopened) {
          this.stopPollingForReconnection();
          this.app.snackbar.sendToSnackbar(transport.reconnectedMessage(), 'success');
        }
      } catch (error) {
        console.error('Error during reconnection polling:', error);
      } finally {
        this.reconnectInFlight = false;
      }
    }, transport.reconnectIntervalMs);
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
   * Writes the same field `openConnection` reads. It used to set a separate
   * `serialPortInfo` that nothing ever read, so the two callers — a preset that
   * names a port, and the reconnection poller when a port reappears — silently
   * had no effect, and the open used whatever was selected in the UI instead.
   *
   * @param port The serial port info to set as the selected port.
   */
  setSelectedPort = (port: PortInfo) => {
    this.app.settings.portConfiguration.setSelectedSerialPort(port);
  };

  setPortState(newPortState: ConnState) {
    this.connState = newPortState;
  }

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
  async setRts(rts: boolean) {
    this.currentFlowControlState.rts = rts;
    if (!this.currentPortPath) {
      return;
    }
    // Send IPC message to main process to update the flow control state
    await window.electronAPI.serial.setFlowControlSignals(
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
    if (this.connState !== ConnState.CLOSED) {
      return true;
    }

    // If there are baud rate validation errors, can't open
    if (!this.app.settings.portConfiguration.baudRate.isValid) {
      return false;
    }

    // A fake port needs no configuration to be openable.
    if (this.useFakeSerialPort) {
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
      if (!this.app.settings.portConfiguration.socketConnTimeoutMs.isValid) {
        return false;
      }

      return true;
    } else if (connectionType === ConnectionType.BLUETOOTH_LE) {
      // For Bluetooth, need a selected device
      return this.bluetoothLEController.selectedBluetoothDevice !== null;
    } else if (connectionType === ConnectionType.RTT) {
      const portConfig = this.app.settings.portConfiguration;
      if (!portConfig.rttDevice || portConfig.rttDevice.trim() === '') {
        return false;
      }
      if (!portConfig.rttSpeedKHz.isValid) {
        return false;
      }
      return true;
    }

    // Unknown connection type
    return false;
  }

  /**
   * Write data to the current connection.
   *
   * @param bytesToWrite The data to write.
   */
  writeData = async (bytesToWrite: Uint8Array) => {
    // Fake ports have no real underlying connection to write to, but the write
    // must still succeed: typed TX is used for local echo and logging, and
    // throwing "Port not found" here would stop both. `FakeTransport.write` is
    // a deliberate no-op rather than a special case in this method.
    await this._selectTransport().write(bytesToWrite);
  };
}
