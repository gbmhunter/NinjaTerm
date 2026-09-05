import { runInAction } from 'mobx';

import type { Session } from '../../Session/Session';
import { ConnectionType } from '../../Settings/PortSettings/PortSettings';
import { OpenOutcome, Transport, TransportCallbacks } from './Transport';

/** Cap on the server log ring buffer shown in the Connection Settings pane. */
export const RTT_SERVER_LOG_MAX_LINES = 100;

/**
 * Segger RTT, via a JLinkGDBServer process spawned by the main process.
 *
 * Polls fast on reconnect: when no probe is plugged in, the J-Link DLL returns
 * an empty probe list synchronously with no I/O, so a tight cadence is cheap.
 * `ConnController` gates overlapping attempts, which matters here because a
 * successful attach can take several seconds — longer than the interval.
 */
export class RttTransport implements Transport {
  readonly kind = ConnectionType.RTT;
  readonly supportsFlowControl = false;
  readonly reconnectIntervalMs = 500;
  readonly openAnalyticsEvent = 'rtt_connect';
  readonly selfManagesReconnection = false;
  readonly selfManagesState = false;

  private session: Session;

  private connectionId: string | null = null;

  private disposers: Array<() => void> = [];

  /**
   * Ring buffer of recent JLinkGDBServer output, shown in Connection Settings
   * so users can diagnose target-detection failures. Capped so a long-running
   * session emitting periodic noise doesn't bloat memory or re-render cost.
   */
  serverLogLines: string[] = [];

  constructor(session: Session) {
    this.session = session;
  }

  validate(): string | null {
    const device = this.session.settings.portConfiguration.rttDevice;
    if (!device || device.trim() === '') {
      return 'No RTT target device specified. Set the device (e.g. nRF52832_xxAA) in Connection Settings.';
    }
    return null;
  }

  async open(callbacks: TransportCallbacks): Promise<OpenOutcome> {
    const portConfig = this.session.settings.portConfiguration;

    // Clear the previous attempt's log so the user sees only this one.
    runInAction(() => {
      this.serverLogLines = [];
    });

    // Registered before connect so startup messages are captured. If the
    // attempt fails it is disposed along with everything else — without that,
    // each retry stacks another listener and every line is emitted N times.
    this.disposers.push(
      window.electronAPI.rtt.onServerLog((connectionId: string, line: string) => {
        // `connectionId === null` covers lines emitted before connect returns.
        if (this.connectionId !== null && connectionId !== this.connectionId) return;
        runInAction(() => {
          this.serverLogLines.push(line);
          const overflow = this.serverLogLines.length - RTT_SERVER_LOG_MAX_LINES;
          if (overflow > 0) {
            this.serverLogLines.splice(0, overflow);
          }
        });
      })
    );

    try {
      const result = await window.electronAPI.rtt.connect({
        device: portConfig.rttDevice,
        interfaceType: portConfig.rttInterface as 'SWD' | 'JTAG',
        speedKHz: portConfig.rttSpeedKHz.appliedValue,
        serverExePath: portConfig.rttServerExePath,
        jLinkSerialNumber: portConfig.rttJLinkSerialNumber,
        channel: portConfig.rttChannel.appliedValue,
      });

      if (!result.success) {
        this.disposeListeners();
        return { success: false, error: result.error };
      }
      this.connectionId = result.connectionId!;
    } catch (error) {
      this.disposeListeners();
      return { success: false, error: `${error}` };
    }

    this.subscribe(callbacks);

    // Promote the device to the top of the recently-used list now we know it works.
    this.session.settings.portConfiguration.pushRttRecentDevice(portConfig.rttDevice);

    return { success: true };
  }

  private subscribe(callbacks: TransportCallbacks) {
    this.disposers.push(
      window.electronAPI.rtt.onDataReceived((connectionId: string, data: Buffer) => {
        if (connectionId !== this.connectionId) return;
        callbacks.onData(new Uint8Array(data));
      })
    );

    this.disposers.push(
      window.electronAPI.rtt.onError((connectionId: string, error: string) => {
        if (connectionId !== this.connectionId) return;
        callbacks.onError(`RTT error: ${error}`);
      })
    );

    this.disposers.push(
      window.electronAPI.rtt.onClosed((connectionId: string) => {
        if (connectionId !== this.connectionId) return;
        callbacks.onClosed();
      })
    );
  }

  async close(): Promise<void> {
    if (this.connectionId !== null) {
      const result = await window.electronAPI.rtt.disconnect(this.connectionId);
      if (!result.success) {
        console.error('Error disconnecting RTT:', result.error);
      }
    }
    this.connectionId = null;
    this.disposeListeners();
  }

  async write(bytes: Uint8Array): Promise<void> {
    const result = await window.electronAPI.rtt.writeData(this.connectionId!, bytes);
    if (!result.success) {
      throw new Error(result.error || 'Failed to write data');
    }
  }

  disposeListeners(): void {
    for (const dispose of this.disposers) {
      try {
        dispose();
      } catch (error) {
        console.error('Error disposing RTT listener:', error);
      }
    }
    this.disposers = [];
  }

  forgetConnection(): void {
    this.connectionId = null;
  }

  openedMessage() {
    return `RTT connected (${this.session.settings.portConfiguration.rttDevice}).`;
  }

  closedMessage() {
    return 'RTT disconnected.';
  }

  reconnectedMessage() {
    return `Automatically reconnected RTT to "${this.session.settings.portConfiguration.rttDevice}".`;
  }

  /** Nothing cheap to probe first — the connect attempt is the test. */
  async canAttemptReconnect(): Promise<boolean> {
    return true;
  }
}
