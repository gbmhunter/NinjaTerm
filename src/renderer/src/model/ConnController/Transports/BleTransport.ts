import { App } from '../../App';
import { PortType } from '../ConnController';
import { BluetoothLEController } from '../BluetoothLEController';
import { OpenOutcome, Transport, TransportCallbacks } from './Transport';

/**
 * Bluetooth LE, delegating to `BluetoothLEController`.
 *
 * This is a thin adapter rather than a reimplementation: BLE needs device
 * scanning, service and characteristic discovery, and a scan-based reconnect,
 * all of which already live in that controller. It exists so `ConnController`
 * can treat every connection type the same way.
 *
 * `selfManagesReconnection` is true because reconnecting to a peripheral means
 * re-scanning for it, not retrying a known address — the shared poller in
 * `ConnController` has nothing useful to do here, and the controller runs its
 * own loop instead.
 */
export class BleTransport implements Transport {
  readonly kind = PortType.BLUETOOTH;
  readonly openAnalyticsEvent = null;
  readonly selfManagesReconnection = true;
  readonly selfManagesState = true;
  /** Unused: the controller owns its own polling cadence. */
  readonly reconnectIntervalMs = 0;

  private controller: BluetoothLEController;

  constructor(_app: App, controller: BluetoothLEController) {
    this.controller = controller;
  }

  /** The controller reports its own problems via snackbars as it scans. */
  validate(): string | null {
    return null;
  }

  async open(_callbacks: TransportCallbacks): Promise<OpenOutcome> {
    // The controller wires its own data listeners straight through to
    // `App.parseRxData`, so the callbacks are unused here. Bringing it under
    // the same callback contract as the other transports would mean unpicking
    // its scan/discover flow, which is a separate piece of work.
    const result = await this.controller.connect();
    if (!result.success) {
      // The controller has already shown a snackbar explaining why.
      return { success: false };
    }
    return { success: true };
  }

  async close(): Promise<void> {
    await this.controller.close();
  }

  async write(bytes: Uint8Array): Promise<void> {
    this.controller.sendData(bytes);
  }

  /** The controller owns its listeners' lifetimes. */
  disposeListeners(): void {}

  forgetConnection(): void {}

  openedMessage() {
    return 'Bluetooth device connected.';
  }

  closedMessage() {
    return 'Bluetooth device disconnected.';
  }

  reconnectedMessage() {
    return 'Automatically reconnected to Bluetooth device.';
  }

  async canAttemptReconnect(): Promise<boolean> {
    return false;
  }

  /** Stops the controller's own reconnection loop. */
  stopSelfManagedReconnection() {
    this.controller.stopPollingForReconnection();
  }
}
