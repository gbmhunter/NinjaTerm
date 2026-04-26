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
    // Loose cap; a real fix would use a much smaller ring buffer (e.g. 1024).
    // The point is to fail clearly while there is *no* cap at all.
    expect(length).toBeLessThan(10_000);
  });

  test('txDataPoints stays bounded under a tight burst between cleanup ticks', () => {
    const app = new App();
    const recordTxDataPoint = (app as any).recordTxDataPoint.bind(app);

    for (let i = 0; i < 100_000; i += 1) {
      recordTxDataPoint(1);
    }

    const length = (app as any).txDataPoints.length;
    expect(length).toBeLessThan(10_000);
  });
});
