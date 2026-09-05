import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';

import { App } from './App';

describe('App rate-tracking buffers', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Stop the 500ms cleanup interval from running so we can observe the
    // buffer at its peak size, the way it would look mid-burst between cleanup
    // ticks.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('rxDataPoints stays bounded under a tight burst between cleanup ticks', () => {
    // recordRxDataPoint() pushes one entry per RX chunk. With small chunks
    // (e.g. 1 byte over BLE notifications, or unbatched RTT), 100k chunks in
    // a sub-second window are entirely plausible. Today there is no cap, so
    // the array grows linearly until the 500ms cleanup interval fires.
    const app = new App();
    const recordRxDataPoint = (app as any).recordRxDataPoint.bind(app);

    for (let i = 0; i < 100_000; i += 1) {
      recordRxDataPoint(1);
    }

    const length = (app as any).rxDataPoints.length;
    // Recording lets the array overshoot MAX_DATA_POINTS (2048) and trims back
    // in one splice when it reaches DATA_POINT_TRIM_AT (4096), so 4096 is the
    // real ceiling. Asserting that rather than a loose bound means this also
    // catches the trim threshold being raised by accident.
    expect(length).toBeLessThanOrEqual(4096);
  });

  test('txDataPoints stays bounded under a tight burst between cleanup ticks', () => {
    const app = new App();
    const recordTxDataPoint = (app as any).recordTxDataPoint.bind(app);

    for (let i = 0; i < 100_000; i += 1) {
      recordTxDataPoint(1);
    }

    const length = (app as any).txDataPoints.length;
    expect(length).toBeLessThanOrEqual(4096);
  });
});

describe('App cleanup', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('cleanup cancels the CPU-monitor animation frame', () => {
    // jsdom does not implement media playback; cleanup pauses the sound
    // player's <audio> elements, which would otherwise log "Not implemented".
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const app = new App();
    // The constructor scheduled a frame...
    const handle = (app as any).cpuMonitorRafHandle;
    expect(handle).not.toBeNull();

    app.cleanup();

    // ...and cleanup cancelled that exact frame. `stopCpuMonitoring` used to
    // be an empty method, so the loop ran until the window unloaded.
    expect(cancelSpy).toHaveBeenCalledWith(handle);
    expect((app as any).cpuMonitorRafHandle).toBeNull();
    cancelSpy.mockRestore();
  });
});
