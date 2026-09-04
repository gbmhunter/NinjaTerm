import { App } from '../../App';
import { ConnectionType } from '../../Settings/PortSettings/PortSettings';
import { OpenOutcome, Transport, TransportCallbacks } from './Transport';

/**
 * A raw TCP socket, opened in the main process.
 *
 * Polls slowly on reconnect compared to serial and RTT: a failed connect has
 * to wait out a TCP timeout, so retrying every 500ms would just pile up
 * in-flight attempts.
 */
export class SocketTransport implements Transport {
  readonly kind = ConnectionType.SOCKET;
  readonly supportsFlowControl = false;
  readonly reconnectIntervalMs = 5000;
  readonly openAnalyticsEvent = 'socket_connect';
  readonly selfManagesReconnection = false;
  readonly selfManagesState = false;

  private app: App;

  /** Id of the live connection, or null. Also filters incoming events. */
  private connectionId: string | null = null;

  /**
   * Host and port captured at open time.
   *
   * Reconnection deliberately targets what was actually connected to rather
   * than re-reading the settings, so editing the host field while a connection
   * is dropped doesn't silently redirect the retry.
   */
  private connectedTo: { host: string; port: number } | null = null;

  private disposers: Array<() => void> = [];

  constructor(app: App) {
    this.app = app;
  }

  validate(): string | null {
    const { socketHost, socketPort } = this.app.settings.portConfiguration;
    if (!socketHost || socketPort <= 0 || socketPort > 65535) {
      return 'Invalid socket host or port. Please check the Connection Configuration.';
    }
    return null;
  }

  async open(callbacks: TransportCallbacks): Promise<OpenOutcome> {
    // On a reconnect, prefer the endpoint we were connected to; on a first
    // open there is nothing captured yet, so read the settings.
    const target = this.connectedTo ?? {
      host: this.app.settings.portConfiguration.socketHost,
      port: this.app.settings.portConfiguration.socketPort,
    };

    try {
      const result = await window.electronAPI.socket.connect(target);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      this.connectionId = result.connectionId!;
      this.connectedTo = target;
    } catch (error) {
      return { success: false, error: `${error}` };
    }

    this.subscribe(callbacks);
    return { success: true };
  }

  private subscribe(callbacks: TransportCallbacks) {
    this.disposers.push(
      window.electronAPI.socket.onDataReceived((connectionId: string, data: Buffer) => {
        if (connectionId !== this.connectionId) return;
        // Buffer can be used directly as Uint8Array - much faster than conversion
        callbacks.onData(new Uint8Array(data));
      })
    );

    this.disposers.push(
      window.electronAPI.socket.onError((connectionId: string, error: string) => {
        if (connectionId !== this.connectionId) return;
        callbacks.onError(`Socket error: ${error}`);
      })
    );

    this.disposers.push(
      window.electronAPI.socket.onClosed((connectionId: string) => {
        if (connectionId !== this.connectionId) return;
        callbacks.onClosed();
      })
    );
  }

  async close(): Promise<void> {
    if (this.connectionId !== null) {
      const result = await window.electronAPI.socket.disconnect(this.connectionId);
      if (!result.success) {
        console.error('Error disconnecting socket:', result.error);
      }
    }
    this.connectionId = null;
    this.disposeListeners();
  }

  async write(bytes: Uint8Array): Promise<void> {
    const result = await window.electronAPI.socket.writeData(this.connectionId!, bytes);
    if (!result.success) {
      throw new Error(result.error || 'Failed to write data');
    }
  }

  disposeListeners(): void {
    for (const dispose of this.disposers) {
      try {
        dispose();
      } catch (error) {
        console.error('Error disposing socket listener:', error);
      }
    }
    this.disposers = [];
  }

  forgetConnection(): void {
    this.connectionId = null;
  }

  openedMessage() {
    const { host, port } = this.connectedTo!;
    return `Socket connected to ${host}:${port}.`;
  }

  closedMessage() {
    return 'Socket disconnected.';
  }

  reconnectedMessage() {
    const { host, port } = this.connectedTo!;
    return `Automatically reconnected to socket: ${host}:${port}`;
  }

  /** Nothing to check up front — the connect attempt is the test. */
  async canAttemptReconnect(): Promise<boolean> {
    return this.connectedTo !== null;
  }
}
