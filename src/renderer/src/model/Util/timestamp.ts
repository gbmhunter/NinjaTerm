/**
 * Tiny moment-compatible timestamp formatter for the small set of tokens
 * NinjaTerm actually uses. Replaces a `moment` dependency that was otherwise
 * pulling ~70 KB of unmaintained code into the bundle.
 *
 * Supported tokens (matching `moment().format(...)` behaviour):
 *   - `YYYY`  — 4-digit year
 *   - `YY`    — 2-digit year
 *   - `MM`    — 2-digit month (01–12)
 *   - `DD`    — 2-digit day-of-month
 *   - `HH`    — 2-digit hour (00–23)
 *   - `mm`    — 2-digit minute
 *   - `ss`    — 2-digit second
 *   - `SSS`   — 3-digit millisecond
 *   - `X`     — Unix timestamp in seconds (integer, no padding)
 *   - `Z`     — timezone offset in `±HH:MM` form
 *
 * All other characters in the format string pass through verbatim. We do NOT
 * support moment's `[literal]` escape — if a user puts a token character
 * inside a bracket-escape in a custom format string, it will still be
 * substituted. None of the in-app default formats use the escape syntax, and
 * anyone who'd put e.g. `[YYYY]` in a custom format is signing up for the
 * same surprise on moment 3+ anyway.
 */
export function formatTimestamp(date: Date, format: string): string {
  // Token regex sorted longest-first so e.g. `YYYY` is preferred over `YY`.
  return format.replace(/YYYY|YY|SSS|MM|DD|HH|mm|ss|X|Z/g, (match) => {
    switch (match) {
      case 'YYYY':
        return date.getFullYear().toString();
      case 'YY':
        return (date.getFullYear() % 100).toString().padStart(2, '0');
      case 'MM':
        return (date.getMonth() + 1).toString().padStart(2, '0');
      case 'DD':
        return date.getDate().toString().padStart(2, '0');
      case 'HH':
        return date.getHours().toString().padStart(2, '0');
      case 'mm':
        return date.getMinutes().toString().padStart(2, '0');
      case 'ss':
        return date.getSeconds().toString().padStart(2, '0');
      case 'SSS':
        return date.getMilliseconds().toString().padStart(3, '0');
      case 'X':
        return Math.floor(date.getTime() / 1000).toString();
      case 'Z': {
        // getTimezoneOffset() is UTC-minus-local in *minutes*, so flip the
        // sign for the conventional "ahead of UTC is positive" form.
        const tzMin = -date.getTimezoneOffset();
        const sign = tzMin >= 0 ? '+' : '-';
        const abs = Math.abs(tzMin);
        const h = Math.floor(abs / 60).toString().padStart(2, '0');
        const m = (abs % 60).toString().padStart(2, '0');
        return `${sign}${h}:${m}`;
      }
      default:
        return match;
    }
  });
}
