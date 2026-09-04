import { ConnectionType } from '../../Settings/PortSettings/PortSettings';

/**
 * Callbacks a transport invokes for the lifetime of an open connection.
 *
 * A transport is responsible for filtering out events that belong to a
 * different connection (a stale port path, a superseded connection id) before
 * calling these — `ConnController` assumes anything it receives is for the
 * connection it currently holds.
 */
export interface TransportCallbacks {
  /** Bytes arrived from the device. */
  onData: (bytes: Uint8Array) => void;
  /** The transport reported an error. The message is shown to the user. */
  onError: (message: string) => void;
  /** The connection went away, whether we asked for it or not. */
  onClosed: () => void;
}

/** Result of an open attempt. `error` is only meaningful when `success` is false. */
export interface OpenOutcome {
  success: boolean;
  error?: string;
}

/**
 * One way of moving bytes to and from a device.
 *
 * This exists because `ConnController.openConnection` was a ~370-line if/else
 * over five connection types, each branch repeating the same shape: validate
 * settings, make an IPC call, register data/error/close listeners, set state,
 * show a snackbar, emit an analytics event. `closeConnection`,
 * `handlePortClosed` and the reconnection poller each repeated the same
 * fan-out. The duplication had already produced a real bug — the socket
 * reconnect path re-registered listeners without disposing the previous set,
 * so one received byte fired `parseRxData` once per reconnect.
 *
 * Implementations own everything specific to their medium: which IPC channel
 * to call, what identifies their connection, and the disposers for the
 * listeners they registered. `ConnController` owns everything shared: the
 * connection state machine, the progress modal, snackbars, and the
 * reconnection timer.
 *
 * Adding a transport should mean writing one of these and adding it to the
 * registry in `ConnController`, with no new branches anywhere else.
 */
export interface Transport {
  /**
   * Which connection type this transport provides.
   *
   * Not unique: `FakeTransport` also reports `SERIAL_PORT`, because a fake port
   * impersonates one and every user-facing branch should treat it as such.
   */
  readonly kind: ConnectionType;

  /**
   * True if this transport has RS-232 control lines worth polling.
   *
   * Only a real serial port does. Asking by capability rather than testing the
   * kind keeps the fake transport — which reports `SERIAL_PORT` — from having
   * its non-existent signals polled once a second.
   */
  readonly supportsFlowControl: boolean;

  /**
   * How often the reconnection poller should retry this transport.
   *
   * Serial and RTT poll fast because a failed attempt is cheap — listing ports
   * or asking the J-Link DLL for probes returns immediately when nothing is
   * plugged in. A socket connect has to wait for a TCP timeout, so it polls
   * slowly.
   */
  readonly reconnectIntervalMs: number;

  /** GA4 event emitted after a successful open, or null to emit none. */
  readonly openAnalyticsEvent: string | null;

  /**
   * Checks the current settings are sufficient to attempt an open.
   *
   * @returns An error message to show the user, or null when ready.
   */
  validate(): string | null;

  /**
   * Opens the connection and registers listeners.
   *
   * Implementations must dispose any listeners they registered if the attempt
   * fails, so a retry does not stack another set.
   */
  open(callbacks: TransportCallbacks): Promise<OpenOutcome>;

  /** Closes the connection. Must be safe to call when not open. */
  close(): Promise<void>;

  /** Sends bytes. Rejects if the write fails. */
  write(bytes: Uint8Array): Promise<void>;

  /** Removes every listener this transport registered. Safe to call twice. */
  disposeListeners(): void;

  /** Text for the snackbar shown after a successful open. */
  openedMessage(): string;

  /** Text for the snackbar shown after a successful close. */
  closedMessage(): string;

  /** Text for the snackbar shown after the reconnection poller succeeds. */
  reconnectedMessage(): string;

  /**
   * Whether conditions are right to attempt a reconnect right now.
   *
   * Lets a transport skip an attempt that is certain to fail — serial checks
   * the port has reappeared in the port list rather than trying to open a
   * device that is not plugged in. Returning false leaves the poller running.
   */
  canAttemptReconnect(): Promise<boolean>;

  /**
   * True when the transport's underlying controller already sets `connState`
   * and shows its own snackbars, so `ConnController` must not do either again.
   *
   * Fake ports and Bluetooth both do: `FakePortsController.openPort` and
   * `BluetoothLEController` predate this interface and drive that state
   * directly. Naming the difference here is the honest version of the implicit
   * early-returns that used to be scattered through `openConnection`.
   */
  readonly selfManagesState: boolean;

  /**
   * True when this transport handles its own reconnection and the shared
   * poller in `ConnController` should stay out of the way.
   *
   * Only Bluetooth does: `BluetoothLEController` runs its own scan-and-connect
   * loop, because reconnecting to a BLE peripheral means re-scanning for it
   * rather than retrying a known address.
   */
  readonly selfManagesReconnection: boolean;
}
