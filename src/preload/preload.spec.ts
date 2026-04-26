import { expect, test, describe, vi, beforeEach } from 'vitest';

/**
 * Verifies the preload `electronAPI` surface allows per-listener disposal.
 *
 * Today, every transport (serial, socket, rtt, bluetooth) registers
 * `ipcRenderer.on(...)` handlers and returns void. The only documented way to
 * remove them is `removeAllListeners(channel)`, which nukes every subscriber
 * on that channel. That makes a clean reconnect impossible without race
 * conditions: open -> register -> close -> open again -> register again -> now
 * two callbacks fire per byte.
 *
 * The fix is to have each `on*` method return a disposer that removes only
 * its own callback. These tests are written against that desired shape and
 * fail today because `onDataReceived` returns `undefined`.
 */

type Listener = (...args: any[]) => void;

class MockIpcRenderer {
  listeners = new Map<string, Listener[]>();

  on = vi.fn((channel: string, listener: Listener) => {
    const arr = this.listeners.get(channel) ?? [];
    arr.push(listener);
    this.listeners.set(channel, arr);
  });

  off = vi.fn((channel: string, listener: Listener) => {
    const arr = this.listeners.get(channel);
    if (!arr) return;
    const idx = arr.indexOf(listener);
    if (idx >= 0) arr.splice(idx, 1);
  });

  removeListener = this.off;

  removeAllListeners = vi.fn((channel: string) => {
    this.listeners.delete(channel);
  });

  invoke = vi.fn().mockResolvedValue(undefined);
  send = vi.fn();

  emit(channel: string, ...args: any[]) {
    const arr = this.listeners.get(channel) ?? [];
    // Snapshot so listeners that remove themselves don't break iteration.
    [...arr].forEach((l) => l({}, ...args));
  }

  countListeners(channel: string): number {
    return (this.listeners.get(channel) ?? []).length;
  }
}

let mockIpc: MockIpcRenderer;
let exposedApi: any;

vi.mock('electron', () => {
  return {
    contextBridge: {
      exposeInMainWorld: (_name: string, api: any) => {
        exposedApi = api;
      },
    },
    get ipcRenderer() {
      return mockIpc;
    },
  };
});

describe('preload electronAPI listener disposal', () => {
  beforeEach(async () => {
    mockIpc = new MockIpcRenderer();
    exposedApi = undefined;
    vi.resetModules();
    // Importing the preload causes its top-level `contextBridge.exposeInMainWorld`
    // call to populate `exposedApi`.
    await import('./index');
    expect(exposedApi).toBeDefined();
  });

  test('serial.onDataReceived returns a disposer function', () => {
    const dispose = exposedApi.serial.onDataReceived(() => {});
    expect(typeof dispose).toBe('function');
  });

  test('socket.onDataReceived returns a disposer function', () => {
    const dispose = exposedApi.socket.onDataReceived(() => {});
    expect(typeof dispose).toBe('function');
  });

  test('rtt.onDataReceived returns a disposer function', () => {
    const dispose = exposedApi.rtt.onDataReceived(() => {});
    expect(typeof dispose).toBe('function');
  });

  test('bluetooth.onDataReceived returns a disposer function', () => {
    const dispose = exposedApi.bluetooth.onDataReceived(() => {});
    expect(typeof dispose).toBe('function');
  });

  test('disposing one serial listener leaves other listeners intact', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const dispose1 = exposedApi.serial.onDataReceived(cb1);
    exposedApi.serial.onDataReceived(cb2);

    expect(mockIpc.countListeners('serial:data-received')).toBe(2);

    // FAILS today: dispose1 is undefined -> TypeError.
    dispose1();

    expect(mockIpc.countListeners('serial:data-received')).toBe(1);

    mockIpc.emit('serial:data-received', 'COM1', [1, 2, 3]);
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  test('repeated open/close cycles do not stack serial data listeners', () => {
    // Simulates: open port (register), close port (dispose), open port (register).
    // After three open/close cycles there should be exactly one live listener,
    // not three.
    const cb = vi.fn();

    for (let i = 0; i < 3; i += 1) {
      const dispose = exposedApi.serial.onDataReceived(cb);
      // FAILS today: dispose is undefined -> TypeError.
      dispose();
    }

    const dispose = exposedApi.serial.onDataReceived(cb);
    expect(mockIpc.countListeners('serial:data-received')).toBe(1);

    mockIpc.emit('serial:data-received', 'COM1', [42]);
    expect(cb).toHaveBeenCalledTimes(1);

    dispose();
  });
});
