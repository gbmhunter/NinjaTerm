import { describe, expect, test } from 'vitest';

import { RxStreamBuffer } from './RxStreamBuffer';

describe('RxStreamBuffer', () => {
  test('drain returns what was appended and empties the buffer', () => {
    const buf = new RxStreamBuffer(100);
    buf.append('hello ');
    buf.append('world');
    expect(buf.drain()).toBe('hello world');
    expect(buf.drain()).toBe('');
    expect(buf.length).toBe(0);
  });

  test('never grows past the cap plus the amortisation slack', () => {
    const buf = new RxStreamBuffer(1000);
    for (let i = 0; i < 10_000; i += 1) {
      buf.append('0123456789');
    }
    // Trim runs when a quarter over the cap, so the buffer can sit a little
    // above it between trims, but it must never run away.
    expect(buf.length).toBeLessThanOrEqual(1250);
  });

  test('drops the oldest data and says so once on the next drain', () => {
    const buf = new RxStreamBuffer(10);
    buf.append('aaaaaaaaaa'); // 10, at cap
    buf.append('bbbbbbbbbb'); // 20, over the 12-char trim threshold -> keep last 10
    const out = buf.drain();
    expect(out.startsWith('[NinjaTerm: 10 characters of received data were dropped')).toBe(true);
    expect(out.endsWith('\nbbbbbbbbbb')).toBe(true);
    // The notice is not repeated on a clean read.
    buf.append('cc');
    expect(buf.drain()).toBe('cc');
  });

  test('a drain never returns more than the cap, even inside the slack window', () => {
    const buf = new RxStreamBuffer(10);
    buf.append('aaaaaaaaaaaa'); // 12: over cap, but at the threshold, so not yet trimmed
    expect(buf.length).toBe(12);
    const out = buf.drain();
    const data = out.slice(out.indexOf('\n') + 1);
    expect(data).toBe('aaaaaaaaaa');
    expect(out).toContain('2 characters');
  });

  test('rejects a nonsensical cap', () => {
    expect(() => new RxStreamBuffer(0)).toThrow();
    expect(() => new RxStreamBuffer(1.5)).toThrow();
  });
});
