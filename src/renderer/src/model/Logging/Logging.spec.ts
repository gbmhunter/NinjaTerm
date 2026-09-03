import { describe, beforeEach, afterEach, expect, test, vi } from 'vitest';
import type { Mock } from 'vitest';

import { App } from 'src/model/App';
import Logging from './Logging';

/**
 * Tests for the log-file write path.
 *
 * This class had no coverage at all, which is how the data-loss and
 * large-chunk bugs below survived. The assertions here are deliberately about
 * *what reaches disk* rather than about the internal buffer, so they stay
 * valid across changes to how data is held between writes.
 */
describe('Logging', () => {
  let app: App;
  let logging: Logging;

  /** The `data` argument of each `fs.writeFile` call, in order. */
  function writeCalls(): Uint8Array[] {
    const mock = window.electronAPI.fs.writeFile as unknown as Mock;
    return mock.mock.calls.map((call) => call[1]);
  }

  /** Everything handed to `fs.writeFile` so far, concatenated. */
  function bytesWritten(): number[] {
    const out: number[] = [];
    for (const chunk of writeCalls()) {
      out.push(...Array.from(chunk));
    }
    return out;
  }

  beforeEach(async () => {
    window.localStorage.clear();
    app = new App();
    logging = app.logging;
    // `initializeFromProfile` is async and fire-and-forget from the
    // constructor; set the directory directly so tests don't race it.
    logging.dirPath = '/logs';
    await logging.startLogging();
    // Drop the writeFile call that OVERWRITE mode may have made, so each test
    // sees only its own writes.
    (window.electronAPI.fs.writeFile as unknown as Mock).mockClear();
  });

  afterEach(async () => {
    if (logging.isLogging) {
      await logging.stopLogging();
    }
  });

  describe('buffering', () => {
    test('RX data is written when RX logging is on', async () => {
      logging.setLogRawRxData(true);
      logging.handleRxData(new Uint8Array([1, 2, 3]));

      await logging.writeBufferedDataToDisk();

      expect(bytesWritten()).toEqual([1, 2, 3]);
    });

    test('RX data is dropped when RX logging is off', async () => {
      logging.setLogRawRxData(false);
      logging.handleRxData(new Uint8Array([1, 2, 3]));

      await logging.writeBufferedDataToDisk();

      expect(writeCalls()).toHaveLength(0);
    });

    test('TX data is only written when TX logging is on', async () => {
      logging.setLogRawTxData(false);
      logging.handleTxData(new Uint8Array([1, 2]));
      await logging.writeBufferedDataToDisk();
      expect(writeCalls()).toHaveLength(0);

      logging.setLogRawTxData(true);
      logging.handleTxData(new Uint8Array([3, 4]));
      await logging.writeBufferedDataToDisk();
      expect(bytesWritten()).toEqual([3, 4]);
    });

    test('nothing is written when the buffer is empty', async () => {
      await logging.writeBufferedDataToDisk();
      expect(writeCalls()).toHaveLength(0);
    });

    test('multiple chunks are written in arrival order, as one call', async () => {
      logging.handleRxData(new Uint8Array([1, 2]));
      logging.handleRxData(new Uint8Array([3]));
      logging.handleRxData(new Uint8Array([4, 5]));

      await logging.writeBufferedDataToDisk();

      expect(writeCalls()).toHaveLength(1);
      expect(bytesWritten()).toEqual([1, 2, 3, 4, 5]);
    });

    test('a chunk far larger than the JS argument limit is handled', async () => {
      // Regression test. The buffer used to be filled with
      // `bufferedData.push(...rxData)`, which spreads the array into function
      // arguments and throws `RangeError: Maximum call stack size exceeded`
      // somewhere past ~65k elements. One large RTT or socket read gets there.
      const big = new Uint8Array(300_000);
      for (let i = 0; i < big.length; i += 1) big[i] = i & 0xff;

      expect(() => logging.handleRxData(big)).not.toThrow();
      await logging.writeBufferedDataToDisk();

      const written = writeCalls();
      expect(written).toHaveLength(1);
      expect(written[0].length).toBe(300_000);
      expect(written[0][0]).toBe(0);
      expect(written[0][299_999]).toBe(299_999 & 0xff);
    });
  });

  describe('write accounting', () => {
    test('numBytesWritten and fileSizeBytes count what was actually written', async () => {
      logging.handleRxData(new Uint8Array([1, 2, 3]));
      await logging.writeBufferedDataToDisk();

      expect(logging.numBytesWritten).toBe(3);
      expect(logging.fileSizeBytes).toBe(3);

      logging.handleRxData(new Uint8Array([4, 5]));
      await logging.writeBufferedDataToDisk();

      expect(logging.numBytesWritten).toBe(5);
      expect(logging.fileSizeBytes).toBe(5);
    });
  });

  describe('data arriving during an in-flight write', () => {
    /**
     * Hands back a writeFile mock whose promise the test resolves by hand, so
     * data can be pushed while a write is genuinely in flight.
     *
     * The promise and its resolver are created up front rather than inside
     * `mockImplementationOnce`, because the mock body does not run until the
     * write actually starts — capturing the resolver lazily leaves the test
     * holding a no-op.
     */
    function deferredWrite() {
      let release: (value: { success: boolean; error?: string }) => void = () => {};
      const pending = new Promise<{ success: boolean; error?: string }>((resolve) => {
        release = resolve;
      });
      const mock = window.electronAPI.fs.writeFile as unknown as Mock;
      mock.mockImplementationOnce(() => pending);
      return { release };
    }

    /**
     * Lets queued microtasks run. `writeBufferedDataToDisk` chains the write
     * onto a promise, so the write does not begin — and so has not yet taken
     * the buffer — until the current task yields.
     */
    function flush() {
      return new Promise((resolve) => setTimeout(resolve, 0));
    }

    test('data that arrives mid-write is not lost', async () => {
      // The bug: the buffer was cleared *after* awaiting the write, so
      // anything that arrived during the await was silently discarded.
      logging.handleRxData(new Uint8Array([1, 2, 3]));

      const { release } = deferredWrite();
      const firstWrite = logging.writeBufferedDataToDisk();
      await flush(); // the write is now in flight, holding [1, 2, 3]

      // Arrives while the first write is still in flight.
      logging.handleRxData(new Uint8Array([4, 5, 6]));

      release({ success: true });
      await firstWrite;

      // First write carried only what was buffered when it started.
      expect(Array.from(writeCalls()[0])).toEqual([1, 2, 3]);

      // The bytes that arrived mid-write must still be written.
      await logging.writeBufferedDataToDisk();
      expect(bytesWritten()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test('data that arrives mid-write is not double-counted', async () => {
      // The byte counters used to be incremented by the buffer's length *after*
      // the await, so mid-write arrivals inflated them without being written.
      logging.handleRxData(new Uint8Array([1, 2, 3]));

      const { release } = deferredWrite();
      const firstWrite = logging.writeBufferedDataToDisk();
      await flush();
      logging.handleRxData(new Uint8Array([4, 5, 6]));
      release({ success: true });
      await firstWrite;

      expect(logging.numBytesWritten).toBe(3);
    });

    test('overlapping writes neither duplicate nor reorder data', async () => {
      // Two concurrent appends both read the buffer before either cleared it,
      // so the same bytes were written twice — and could land out of order. A
      // tick firing while a write is in flight must queue behind it.
      logging.handleRxData(new Uint8Array([1, 2, 3]));

      const { release } = deferredWrite();
      const firstWrite = logging.writeBufferedDataToDisk();
      await flush();

      logging.handleRxData(new Uint8Array([4, 5, 6]));
      const secondWrite = logging.writeBufferedDataToDisk();

      release({ success: true });
      await Promise.all([firstWrite, secondWrite]);

      expect(bytesWritten()).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('failed writes', () => {
    test('data is retained for retry when the write reports failure', async () => {
      const mock = window.electronAPI.fs.writeFile as unknown as Mock;
      mock.mockResolvedValueOnce({ success: false, error: 'disk full' });

      logging.handleRxData(new Uint8Array([1, 2, 3]));
      await logging.writeBufferedDataToDisk();

      expect(logging.numBytesWritten).toBe(0);

      // The next attempt must carry the same bytes rather than dropping them.
      mock.mockResolvedValue({ success: true });
      await logging.writeBufferedDataToDisk();

      expect(Array.from(writeCalls()[1])).toEqual([1, 2, 3]);
      expect(logging.numBytesWritten).toBe(3);
    });

    test('data is retained for retry when the write throws', async () => {
      const mock = window.electronAPI.fs.writeFile as unknown as Mock;
      mock.mockRejectedValueOnce(new Error('EACCES'));

      logging.handleRxData(new Uint8Array([1, 2, 3]));
      await logging.writeBufferedDataToDisk();

      mock.mockResolvedValue({ success: true });
      await logging.writeBufferedDataToDisk();

      expect(Array.from(writeCalls()[1])).toEqual([1, 2, 3]);
      expect(logging.numBytesWritten).toBe(3);
    });

    test('a retried batch keeps its place ahead of newer data', async () => {
      const mock = window.electronAPI.fs.writeFile as unknown as Mock;
      mock.mockResolvedValueOnce({ success: false, error: 'transient' });

      logging.handleRxData(new Uint8Array([1, 2]));
      await logging.writeBufferedDataToDisk();

      logging.handleRxData(new Uint8Array([3, 4]));
      mock.mockResolvedValue({ success: true });
      await logging.writeBufferedDataToDisk();

      // Order matters in a log file: the failed batch must not end up after
      // the data that arrived while it was being retried.
      expect(Array.from(writeCalls()[1])).toEqual([1, 2, 3, 4]);
    });
  });

  describe('stopLogging', () => {
    test('flushes whatever is still buffered', async () => {
      logging.handleRxData(new Uint8Array([7, 8, 9]));

      await logging.stopLogging();

      expect(bytesWritten()).toEqual([7, 8, 9]);
      expect(logging.isLogging).toBe(false);
    });

    test('waits for an in-flight write before finishing, and flushes what arrived during it', async () => {
      logging.handleRxData(new Uint8Array([1]));

      const mock = window.electronAPI.fs.writeFile as unknown as Mock;
      let release: (v: { success: boolean }) => void = () => {};
      const pending = new Promise<{ success: boolean }>((r) => { release = r; });
      mock.mockImplementationOnce(() => pending);

      const inFlight = logging.writeBufferedDataToDisk();
      await new Promise((r) => setTimeout(r, 0)); // write now in flight
      logging.handleRxData(new Uint8Array([2]));

      const stopped = logging.stopLogging();
      release({ success: true });
      await Promise.all([inFlight, stopped]);

      expect(bytesWritten()).toEqual([1, 2]);
    });

    test('data received after logging stops is discarded', async () => {
      await logging.stopLogging();
      (window.electronAPI.fs.writeFile as unknown as Mock).mockClear();

      logging.handleRxData(new Uint8Array([1, 2, 3]));
      await logging.writeBufferedDataToDisk();

      expect(writeCalls()).toHaveLength(0);
    });
  });
});
