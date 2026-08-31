import { describe, expect, it } from 'vitest';

import { EnterKeyPressBehavior, enterKeyBytes } from 'src/model/Settings/TxSettings/TxSettings';
import TxLineController, { MAX_HISTORY_ENTRIES } from './TxLineController';

describe('enterKeyBytes', () => {
  it('maps each behavior to its line terminator', () => {
    expect(enterKeyBytes(EnterKeyPressBehavior.SEND_LF)).toEqual([0x0a]);
    expect(enterKeyBytes(EnterKeyPressBehavior.SEND_CR)).toEqual([0x0d]);
    expect(enterKeyBytes(EnterKeyPressBehavior.SEND_CRLF)).toEqual([0x0d, 0x0a]);
  });

  it('returns no bytes for a break, which is sent out-of-band', () => {
    expect(enterKeyBytes(EnterKeyPressBehavior.SEND_BREAK)).toEqual([]);
  });
});

describe('TxLineController.buildBytes', () => {
  it('appends the terminator to the line text', () => {
    const c = new TxLineController();
    c.setPendingLine('*IDN?');
    expect(Array.from(c.buildBytes(EnterKeyPressBehavior.SEND_LF))).toEqual([
      0x2a, 0x49, 0x44, 0x4e, 0x3f, 0x0a,
    ]);
  });

  it('uses CRLF when asked, which many SCPI instruments expect', () => {
    const c = new TxLineController();
    c.setPendingLine('AB');
    expect(Array.from(c.buildBytes(EnterKeyPressBehavior.SEND_CRLF))).toEqual([
      0x41, 0x42, 0x0d, 0x0a,
    ]);
  });

  it('sends a bare terminator for an empty line, matching character mode', () => {
    const c = new TxLineController();
    expect(Array.from(c.buildBytes(EnterKeyPressBehavior.SEND_LF))).toEqual([0x0a]);
  });

  it('produces nothing at all for a break on an empty line', () => {
    const c = new TxLineController();
    expect(Array.from(c.buildBytes(EnterKeyPressBehavior.SEND_BREAK))).toEqual([]);
  });
});

describe('TxLineController history', () => {
  const send = (c: TxLineController, line: string) => {
    c.setPendingLine(line);
    c.commitToHistory();
  };

  it('clears the pending line once sent', () => {
    const c = new TxLineController();
    send(c, '*IDN?');
    expect(c.pendingLine).toBe('');
    expect(c.history).toEqual(['*IDN?']);
  });

  it('walks back and forward through previous lines', () => {
    const c = new TxLineController();
    send(c, 'first');
    send(c, 'second');

    c.historyPrev();
    expect(c.pendingLine).toBe('second');
    c.historyPrev();
    expect(c.pendingLine).toBe('first');
    c.historyNext();
    expect(c.pendingLine).toBe('second');
  });

  it('stops at the oldest entry rather than wrapping round', () => {
    const c = new TxLineController();
    send(c, 'only');
    c.historyPrev();
    c.historyPrev();
    c.historyPrev();
    expect(c.pendingLine).toBe('only');
  });

  it('restores a part-typed line when stepping back past the newest entry', () => {
    const c = new TxLineController();
    send(c, 'old');
    c.setPendingLine('half-typed');

    c.historyPrev();
    expect(c.pendingLine).toBe('old');
    c.historyNext();
    expect(c.pendingLine).toBe('half-typed');
  });

  it('does nothing on Down when not walking history', () => {
    const c = new TxLineController();
    c.setPendingLine('typing');
    c.historyNext();
    expect(c.pendingLine).toBe('typing');
  });

  it('collapses consecutive duplicates, since re-sending one query is the normal workflow', () => {
    const c = new TxLineController();
    send(c, '*IDN?');
    send(c, '*IDN?');
    send(c, '*IDN?');
    expect(c.history).toEqual(['*IDN?']);
  });

  it('keeps a non-consecutive repeat', () => {
    const c = new TxLineController();
    send(c, 'a');
    send(c, 'b');
    send(c, 'a');
    expect(c.history).toEqual(['a', 'b', 'a']);
  });

  it('does not record an empty line', () => {
    const c = new TxLineController();
    send(c, '');
    expect(c.history).toEqual([]);
  });

  it('caps the history, dropping the oldest entries', () => {
    const c = new TxLineController();
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 5; i++) {
      send(c, `line${i}`);
    }
    expect(c.history.length).toBe(MAX_HISTORY_ENTRIES);
    expect(c.history[0]).toBe('line5');
  });

  it('abandons the history walk as soon as the user types', () => {
    const c = new TxLineController();
    send(c, 'old');
    c.historyPrev();
    expect(c.pendingLine).toBe('old');

    c.setPendingLine('new text');
    c.historyNext();
    // Already back at the live line, so Down is a no-op rather than blanking it.
    expect(c.pendingLine).toBe('new text');
  });
});
