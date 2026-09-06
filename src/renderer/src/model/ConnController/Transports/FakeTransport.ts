import type { Session } from '../../Session/Session';
import { ConnectionType } from '../../Settings/PortSettings/PortSettings';
import { OpenOutcome, Transport, TransportCallbacks } from './Transport';

/**
 * A simulated port that generates its own data, used for exercising the
 * terminal without hardware (press `f` on the Connection Configuration pane).
 *
 * Writes succeed silently rather than failing: there is no device to send to,
 * but typed characters still need to reach local echo and the logger, and
 * `ConnController.writeData` throwing "Port not found" would stop that.
 */
export class FakeTransport implements Transport {
  readonly kind = ConnectionType.SERIAL_PORT;
  readonly supportsFlowControl = false;
  readonly openAnalyticsEvent = null;
  readonly selfManagesReconnection = false;
  readonly selfManagesState = true;
  /** Never reconnects — a fake port cannot go away unexpectedly. */
  readonly reconnectIntervalMs = 0;

  private session: Session;

  constructor(session: Session) {
    this.session = session;
  }

  validate(): string | null {
    return null;
  }

  async open(_callbacks: TransportCallbacks): Promise<OpenOutcome> {
    // The fake port controller pushes generated data straight into
    // `App.parseRxData`, so there are no listeners to register here.
    this.session.fakePortController.openPort();
    return { success: true };
  }

  async close(): Promise<void> {
    this.session.fakePortController.closePort();
  }

  async write(_bytes: Uint8Array): Promise<void> {
    // Deliberately a no-op. See the class comment.
  }

  disposeListeners(): void {}

  forgetConnection(): void {}

  openedMessage() {
    return 'Fake port opened.';
  }

  closedMessage() {
    return 'Fake port closed.';
  }

  reconnectedMessage() {
    return 'Fake port reopened.';
  }

  async canAttemptReconnect(): Promise<boolean> {
    return false;
  }
}
