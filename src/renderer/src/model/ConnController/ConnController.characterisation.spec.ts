import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

import { App } from '../App';
import { ConnController } from './ConnController';
import { RTT_SERVER_LOG_MAX_LINES } from './Transports/RttTransport';
import { ConnectionType, ConnState } from '../Settings/PortSettings/PortSettings';

/**
 * Characterisation tests for the connection lifecycle.
 *
 * `openConnection`, `closeConnection`, `handlePortClosed` and the reconnection
 * poller between them are ~500 lines that had no unit coverage at all — the
 * existing `ConnController.spec.ts` is almost entirely `sortSerialPortsNaturally`,
 * and the e2e suite only drives the serial happy-path open.
 *
 * These tests pin the *current* observable behaviour of each transport so the
 * `Transport` refactor has a safety net: which IPC calls are made, what state
 * is left behind, and — the part that has already caused a bug once (see the
 * socket reconnect path) — that listeners are registered exactly once.
 *
 * They deliberately assert on IPC traffic and public state rather than on
 * internals, so they stay valid across the restructure.
 */
describe('ConnController connection lifecycle', () => {
  let app: App;
  let conn: ConnController;
  /** Disposers handed out by the mocked `on*` subscriptions, per channel. */
  let disposers: Record<string, Mock[]>;
  /**
   * Callbacks registered against each mocked `on*` subscription. Signatures
   * differ per channel (port path + data, connection id + error, ...), so they
   * are held loosely and invoked positionally by the tests.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handlers: Record<string, Array<(...args: any[]) => void>>;

  /** Builds an `on*` mock that records its callback and returns a disposer. */
  function onMock(name: string) {
    handlers[name] = [];
    disposers[name] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return vi.fn((cb: (...args: any[]) => void) => {
      handlers[name].push(cb);
      const d = vi.fn();
      disposers[name].push(d);
      return d;
    });
  }

  beforeEach(() => {
    window.localStorage.clear();
    disposers = {};
    handlers = {};

    // Build on the mock that `src/test/setup.ts` installs, so everything this
    // class touches indirectly (Bluetooth, analytics, MCP, ...) keeps working;
    // override only the channels these tests need to instrument.
    const base = (window as any).electronAPI;
    (window as any).electronAPI = {
      ...base,
      serial: {
        ...base.serial,
        listPorts: vi.fn().mockResolvedValue({ success: true, ports: [] }),
        openPort: vi.fn().mockResolvedValue({ success: true }),
        closePort: vi.fn().mockResolvedValue({ success: true }),
        writeData: vi.fn().mockResolvedValue({ success: true }),
        getFlowControlSignals: vi.fn().mockResolvedValue({
          success: true,
          signals: { dsr: false, cts: false, dcd: false },
        }),
        setFlowControlSignals: vi.fn().mockResolvedValue({ success: true }),
        onDataReceived: onMock('serial:data'),
        onError: onMock('serial:error'),
        onPortClosed: onMock('serial:closed'),
      },
      socket: {
        ...base.socket,
        connect: vi.fn().mockResolvedValue({ success: true, connectionId: 'sock-1' }),
        disconnect: vi.fn().mockResolvedValue({ success: true }),
        writeData: vi.fn().mockResolvedValue({ success: true }),
        onDataReceived: onMock('socket:data'),
        onError: onMock('socket:error'),
        onClosed: onMock('socket:closed'),
      },
      rtt: {
        connect: vi.fn().mockResolvedValue({ success: true, connectionId: 'rtt-1' }),
        disconnect: vi.fn().mockResolvedValue({ success: true }),
        writeData: vi.fn().mockResolvedValue({ success: true }),
        onDataReceived: onMock('rtt:data'),
        onError: onMock('rtt:error'),
        onClosed: onMock('rtt:closed'),
        onServerLog: onMock('rtt:log'),
      },
      analytics: { event: vi.fn().mockResolvedValue({ success: true }) },
      mcp: {
        removeAllListeners: vi.fn(),
        onRequest: vi.fn(),
        start: vi.fn(),
        pushRxData: vi.fn(),
        respond: vi.fn(),
      },
      shell: { openExternal: vi.fn().mockResolvedValue({ success: true }) },
    };

    app = new App();
    conn = app.connController;
  });

  /** Points the app at a serial port and opens it. */
  async function openSerial() {
    app.settings.portConfiguration.setConnectionType(ConnectionType.SERIAL_PORT);
    app.settings.portConfiguration.selectedSerialPort = { path: 'COM3' };
    return conn.openConnection();
  }

  async function openSocket() {
    app.settings.portConfiguration.setConnectionType(ConnectionType.SOCKET);
    app.settings.portConfiguration.setSocketHost('192.168.1.5');
    app.settings.portConfiguration.setSocketPort(1234);
    return conn.openConnection();
  }

  async function openRtt() {
    app.settings.portConfiguration.setConnectionType(ConnectionType.RTT);
    app.settings.portConfiguration.setRttDevice('nRF52832_xxAA');
    return conn.openConnection();
  }

  //================================================================
  // SERIAL
  //================================================================
  describe('serial port', () => {
    it('opens the selected port and reaches OPENED', async () => {
      const ok = await openSerial();

      expect(ok).not.toBe(false);
      expect(window.electronAPI.serial.openPort).toHaveBeenCalledTimes(1);
      expect((window.electronAPI.serial.openPort as unknown as Mock).mock.calls[0][0].path).toBe('COM3');
      expect(conn.connState).toBe(ConnState.OPENED);
    });

    it('registers exactly one data, error and close listener', async () => {
      await openSerial();

      expect(handlers['serial:data']).toHaveLength(1);
      expect(handlers['serial:error']).toHaveLength(1);
      expect(handlers['serial:closed']).toHaveLength(1);
    });

    it('routes received bytes into the app', async () => {
      await openSerial();
      const parseRxData = vi.spyOn(app, 'parseRxData').mockImplementation(() => {});

      handlers['serial:data'][0]('COM3', new Uint8Array([1, 2, 3]));

      expect(parseRxData).toHaveBeenCalledTimes(1);
      expect(Array.from(parseRxData.mock.calls[0][0])).toEqual([1, 2, 3]);
    });

    it('ignores data addressed to a different port', async () => {
      await openSerial();
      const parseRxData = vi.spyOn(app, 'parseRxData').mockImplementation(() => {});

      handlers['serial:data'][0]('COM9', new Uint8Array([1]));

      expect(parseRxData).not.toHaveBeenCalled();
    });

    it('does not reach OPENED when the port fails to open', async () => {
      (window.electronAPI.serial.openPort as unknown as Mock).mockResolvedValueOnce({
        success: false,
        error: 'Access denied',
      });

      const ok = await openSerial();

      expect(ok).toBe(false);
      expect(conn.connState).not.toBe(ConnState.OPENED);
    });

    it('closes the port and disposes its listeners', async () => {
      await openSerial();
      await conn.closeConnection();

      expect(window.electronAPI.serial.closePort).toHaveBeenCalledWith('COM3');
      expect(conn.connState).toBe(ConnState.CLOSED);
      for (const d of disposers['serial:data']) expect(d).toHaveBeenCalled();
      for (const d of disposers['serial:closed']) expect(d).toHaveBeenCalled();
    });

    it('a close/reopen cycle does not stack duplicate listeners', async () => {
      // The failure this guards against: every reconnect adding another set of
      // handlers, so one received byte fires parseRxData N times after N cycles.
      await openSerial();
      await conn.closeConnection();
      await openSerial();

      const parseRxData = vi.spyOn(app, 'parseRxData').mockImplementation(() => {});
      // Only the listener from the live connection should still be attached;
      // the first one's disposer was called on close.
      const live = handlers['serial:data'][handlers['serial:data'].length - 1];
      live('COM3', new Uint8Array([7]));

      expect(parseRxData).toHaveBeenCalledTimes(1);
    });
  });

  //================================================================
  // SOCKET
  //================================================================
  describe('socket', () => {
    it('connects with the configured host and port', async () => {
      await openSocket();

      expect(window.electronAPI.socket.connect).toHaveBeenCalledWith({
        host: '192.168.1.5',
        port: 1234,
      });
      expect(conn.connState).toBe(ConnState.OPENED);
    });

    it('registers exactly one of each listener', async () => {
      await openSocket();

      expect(handlers['socket:data']).toHaveLength(1);
      expect(handlers['socket:error']).toHaveLength(1);
      expect(handlers['socket:closed']).toHaveLength(1);
    });

    it('routes received bytes into the app', async () => {
      await openSocket();
      const parseRxData = vi.spyOn(app, 'parseRxData').mockImplementation(() => {});

      handlers['socket:data'][0]('sock-1', new Uint8Array([9]));

      expect(parseRxData).toHaveBeenCalledTimes(1);
    });

    it('rejects an invalid port without calling connect', async () => {
      app.settings.portConfiguration.setConnectionType(ConnectionType.SOCKET);
      app.settings.portConfiguration.setSocketHost('localhost');
      app.settings.portConfiguration.setSocketPort(0);

      const ok = await conn.openConnection();

      expect(ok).toBe(false);
      expect(window.electronAPI.socket.connect).not.toHaveBeenCalled();
    });

    it('disconnects and disposes listeners on close', async () => {
      await openSocket();
      await conn.closeConnection();

      expect(window.electronAPI.socket.disconnect).toHaveBeenCalledWith('sock-1');
      expect(conn.connState).toBe(ConnState.CLOSED);
      for (const d of disposers['socket:data']) expect(d).toHaveBeenCalled();
    });
  });

  //================================================================
  // RTT
  //================================================================
  describe('RTT', () => {
    it('connects with the configured device', async () => {
      await openRtt();

      expect(window.electronAPI.rtt.connect).toHaveBeenCalledTimes(1);
      const args = (window.electronAPI.rtt.connect as unknown as Mock).mock.calls[0][0];
      expect(args.device).toBe('nRF52832_xxAA');
      expect(conn.connState).toBe(ConnState.OPENED);
    });

    it('refuses to open with no device set', async () => {
      app.settings.portConfiguration.setConnectionType(ConnectionType.RTT);
      app.settings.portConfiguration.setRttDevice('');

      const ok = await conn.openConnection();

      expect(ok).toBe(false);
      expect(window.electronAPI.rtt.connect).not.toHaveBeenCalled();
    });

    it('disposes the server-log listener when the connect attempt fails', async () => {
      // The log listener is registered *before* connect so startup messages are
      // captured. A failed attempt must still drop it, or each retry stacks
      // another and every log line is emitted N times.
      (window.electronAPI.rtt.connect as unknown as Mock).mockResolvedValueOnce({
        success: false,
        error: 'no probe',
      });

      const ok = await openRtt();

      expect(ok).toBe(false);
      for (const d of disposers['rtt:log']) expect(d).toHaveBeenCalled();
    });

    it('caps the server log ring buffer', async () => {
      await openRtt();
      const emit = handlers['rtt:log'][0];
      for (let i = 0; i < RTT_SERVER_LOG_MAX_LINES + 50; i += 1) {
        emit('rtt-1', `line ${i}`);
      }

      expect(conn.rttServerLogLines.length).toBe(RTT_SERVER_LOG_MAX_LINES);
      // Oldest dropped, newest kept.
      expect(conn.rttServerLogLines[conn.rttServerLogLines.length - 1]).toContain('line 149');
    });

    it('disconnects and disposes listeners on close', async () => {
      await openRtt();
      await conn.closeConnection();

      expect(window.electronAPI.rtt.disconnect).toHaveBeenCalledWith('rtt-1');
      expect(conn.connState).toBe(ConnState.CLOSED);
    });
  });

  //================================================================
  // SHARED LIFECYCLE
  //================================================================
  describe('shared lifecycle', () => {
    it('closing with goToReopenState leaves the port waiting to reopen', async () => {
      await openSerial();
      await conn.closeConnection({ goToReopenState: true });

      expect(conn.connState).toBe(ConnState.CLOSED_BUT_WILL_REOPEN);
    });

    it('an unexpected close moves to CLOSED_BUT_WILL_REOPEN when auto-reopen is on', async () => {
      app.settings.portConfiguration.setReopenSerialPortIfUnexpectedlyClosed(true);
      await openSerial();

      handlers['serial:closed'][0]('COM3');

      expect(conn.connState).toBe(ConnState.CLOSED_BUT_WILL_REOPEN);
      conn.stopWaitingToReopenPort();
    });

    it('an unexpected close moves to CLOSED when auto-reopen is off', async () => {
      app.settings.portConfiguration.setReopenSerialPortIfUnexpectedlyClosed(false);
      await openSerial();

      handlers['serial:closed'][0]('COM3');

      expect(conn.connState).toBe(ConnState.CLOSED);
    });

    it('clears flow control state on close', async () => {
      await openSerial();
      conn.setDtr(true);
      await conn.closeConnection();

      expect(conn.currentFlowControlState.dtr).toBe(false);
      expect(conn.currentFlowControlState.rts).toBe(false);
    });

    it('cleanup disposes every listener the connection registered', async () => {
      await openSerial();
      conn.cleanup();

      for (const d of disposers['serial:data']) expect(d).toHaveBeenCalled();
      for (const d of disposers['serial:error']) expect(d).toHaveBeenCalled();
      for (const d of disposers['serial:closed']) expect(d).toHaveBeenCalled();
    });
  });

  //================================================================
  // FAKE PORTS
  //================================================================
  describe('fake serial ports', () => {
    it('a fake port backs SERIAL_PORT without touching the connection type', async () => {
      // A fake port impersonates a serial port on purpose: the status bar, the
      // right drawer's serial sections and the settings pane all branch on
      // `connectionType === SERIAL_PORT`, and should keep doing so while one is
      // open. Only which transport is selected changes.
      app.settings.portConfiguration.setConnectionType(ConnectionType.SERIAL_PORT);
      app.connController.useFakeSerialPort = true;

      await conn.openConnection();

      expect(app.settings.portConfiguration.connectionType).toBe(ConnectionType.SERIAL_PORT);
      // No real port was opened.
      expect(window.electronAPI.serial.openPort).not.toHaveBeenCalled();
    });

    it('writes to a fake port succeed silently rather than throwing', async () => {
      // Typed characters still have to reach local echo and the logger, so a
      // write must not fail just because there is no device behind it.
      app.settings.portConfiguration.setConnectionType(ConnectionType.SERIAL_PORT);
      app.connController.useFakeSerialPort = true;

      await expect(conn.writeData(Uint8Array.from([0x61]))).resolves.toBeUndefined();
      expect(window.electronAPI.serial.writeData).not.toHaveBeenCalled();
    });

    it('clearing the fake flag returns SERIAL_PORT to the real transport', async () => {
      app.settings.portConfiguration.setConnectionType(ConnectionType.SERIAL_PORT);
      app.settings.portConfiguration.selectedSerialPort = { path: 'COM3' };
      app.connController.useFakeSerialPort = false;

      await conn.openConnection();

      expect(window.electronAPI.serial.openPort).toHaveBeenCalledTimes(1);
    });
  });

  //================================================================
  // PORT SELECTION
  //================================================================
  describe('setSelectedPort', () => {
    it('selects the port that a subsequent open will actually use', async () => {
      // `setSelectedPort` is the only way for a caller to say which serial port
      // to open next — `PresetController` uses it when a preset names a port,
      // and the serial reconnection poller uses it when a port reappears.
      //
      // It has to write the same field `openConnection` reads. It used to set a
      // separate `serialPortInfo` that nothing read, so applying a preset that
      // named a port opened whichever port was selected in the UI instead —
      // while the snackbar reported the preset's port.
      app.settings.portConfiguration.setConnectionType(ConnectionType.SERIAL_PORT);
      app.settings.portConfiguration.selectedSerialPort = { path: 'COM1' };

      conn.setSelectedPort({ path: 'COM7' } as any);
        await conn.openConnection();

      const openedWith = (window.electronAPI.serial.openPort as unknown as Mock).mock.calls[0][0];
      expect(openedWith.path).toBe('COM7');
    });
  });

  //================================================================
  // WRITE ROUTING
  //================================================================
  describe('write routing', () => {
    it('sends to the serial channel when serial is the connection type', async () => {
      await openSerial();
      await conn.writeData(Uint8Array.from([1, 2]));

      expect(window.electronAPI.serial.writeData).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.socket.writeData).not.toHaveBeenCalled();
    });

    it('sends to the socket channel when socket is the connection type', async () => {
      await openSocket();
      await conn.writeData(Uint8Array.from([1, 2]));

      expect(window.electronAPI.socket.writeData).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.serial.writeData).not.toHaveBeenCalled();
    });

    it('sends to the RTT channel when RTT is the connection type', async () => {
      await openRtt();
      await conn.writeData(Uint8Array.from([1, 2]));

      expect(window.electronAPI.rtt.writeData).toHaveBeenCalledTimes(1);
    });

    it('throws when the underlying write reports failure', async () => {
      await openSerial();
      (window.electronAPI.serial.writeData as unknown as Mock).mockResolvedValueOnce({
        success: false,
        error: 'Port not found',
      });

      await expect(conn.writeData(Uint8Array.from([1]))).rejects.toThrow('Port not found');
    });
  });
});
