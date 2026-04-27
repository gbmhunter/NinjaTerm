import { describe, test, expect } from 'vitest';

import { formatTimestamp } from './timestamp';

describe('formatTimestamp', () => {
  // Use a fixed local time to make assertions deterministic. The Date
  // constructor with these arguments uses the local timezone, so the
  // year/month/day/hour values returned by getFullYear() etc. will exactly
  // match the values we pass in here.
  const local = new Date(2026, 0, 5, 14, 7, 9, 42); // 2026-01-05 14:07:09.042

  test('replaces YYYY MM DD HH mm ss SSS', () => {
    expect(formatTimestamp(local, 'YYYY-MM-DDTHH:mm:ss.SSS')).toBe(
      '2026-01-05T14:07:09.042'
    );
  });

  test('YY is the 2-digit year', () => {
    expect(formatTimestamp(local, 'YY-MM-DD')).toBe('26-01-05');
  });

  test('X emits Unix seconds with no padding', () => {
    const epoch = new Date(1234567890 * 1000);
    expect(formatTimestamp(epoch, 'X')).toBe('1234567890');
  });

  test('X.SSS emits Unix seconds.ms', () => {
    // Local-constructor with a millisecond field; the integer-seconds part
    // depends on the local TZ but the millisecond field is always preserved.
    const d = new Date(2026, 0, 5, 14, 7, 9, 42);
    const result = formatTimestamp(d, 'X.SSS');
    expect(result).toMatch(/^\d+\.042$/);
  });

  test('Z emits ±HH:MM matching the local timezone offset', () => {
    const result = formatTimestamp(local, 'Z');
    // Match either +HH:MM, -HH:MM, or +00:00
    expect(result).toMatch(/^[+-]\d{2}:\d{2}$/);
    // Cross-check against the date object itself.
    const offsetMin = -local.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const expected = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
    expect(result).toBe(expected);
  });

  test('non-token characters pass through verbatim', () => {
    expect(formatTimestamp(local, 'YYYY/MM/DD HH:mm:ss')).toBe('2026/01/05 14:07:09');
    expect(formatTimestamp(local, '[start]YYYY[end]')).toBe('[start]2026[end]');
  });

  test('format string with no tokens is unchanged', () => {
    expect(formatTimestamp(local, '')).toBe('');
    expect(formatTimestamp(local, 'hello world')).toBe('hello world');
  });
});
