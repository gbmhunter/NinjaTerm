import { expect, test, describe, beforeEach, vi } from 'vitest';

import { App } from 'src/model/App';
import { MacroController } from './MacroController';
import { Macro, MacroDataType } from './Macro';

/**
 * Convenience: text → UTF-8 Uint8Array for feeding `onRxBytes`.
 */
function bytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/**
 * Reset a default macro to a known-good ASCII state before tests touch it.
 * The shipped defaults preset macro[1] to HEX `deadbeef`, which would make
 * `setData('any ascii')` fail validation — easier to fully reset than to
 * mirror those quirks in every test.
 */
function asciiMacro(macro: Macro, data: string): void {
  macro.setDataType(MacroDataType.ASCII);
  macro.setData(data);
}

describe('MacroController auto-response triggers (issue #364)', () => {
  let app: App;
  let macroController: MacroController;
  let writeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.localStorage.clear();
    app = new App();
    macroController = app.terminals.rightDrawer.macroController;
    // Intercept the actual serial-port write so we can assert what would
    // have been sent without needing an open port.
    writeSpy = vi.fn(async (_bytes: Uint8Array) => {});
    app.writeBytesToSerialPort = writeSpy as any;
  });

  //==========================================================================
  // onRxBytes / line matching
  //==========================================================================

  test('a matching finalised line fires the macro once', async () => {
    const macro = macroController.macrosArray[0];
    asciiMacro(macro, 'response\n');
    macro.setSendOnRxMatch(true);
    macro.setRxMatchPattern('ping');

    macroController.onRxBytes(bytes('ping\n'));
    // `send` is async but fire-and-forget; let any pending microtasks resolve.
    await Promise.resolve();
    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  test('a non-matching line does not fire', async () => {
    const macro = macroController.macrosArray[0];
    asciiMacro(macro, 'response\n');
    macro.setSendOnRxMatch(true);
    macro.setRxMatchPattern('ping');

    macroController.onRxBytes(bytes('nope\n'));
    await Promise.resolve();
    expect(writeSpy).not.toHaveBeenCalled();
  });

  test('disabled trigger does not fire even on a matching line', async () => {
    const macro = macroController.macrosArray[0];
    asciiMacro(macro, 'response\n');
    macro.setSendOnRxMatch(false);
    macro.setRxMatchPattern('ping');

    macroController.onRxBytes(bytes('ping\n'));
    await Promise.resolve();
    expect(writeSpy).not.toHaveBeenCalled();
  });

  test('two macros matching the same line both fire', async () => {
    const m0 = macroController.macrosArray[0];
    asciiMacro(m0, 'a\n');
    m0.setSendOnRxMatch(true);
    m0.setRxMatchPattern('hi');

    const m1 = macroController.macrosArray[1];
    asciiMacro(m1, 'b\n');
    m1.setSendOnRxMatch(true);
    m1.setRxMatchPattern('hi');

    macroController.onRxBytes(bytes('hi there\n'));
    await Promise.resolve();
    expect(writeSpy).toHaveBeenCalledTimes(2);
  });

  test('partial line is buffered and only fires once newline arrives', async () => {
    const macro = macroController.macrosArray[0];
    asciiMacro(macro, 'r\n');
    macro.setSendOnRxMatch(true);
    macro.setRxMatchPattern('hello');

    macroController.onRxBytes(bytes('hel'));
    await Promise.resolve();
    expect(writeSpy).not.toHaveBeenCalled();

    macroController.onRxBytes(bytes('lo\n'));
    await Promise.resolve();
    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  test('CRLF and LF line endings both finalise a line', async () => {
    const macro = macroController.macrosArray[0];
    asciiMacro(macro, 'r\n');
    macro.setSendOnRxMatch(true);
    macro.setRxMatchPattern('^foo$');

    macroController.onRxBytes(bytes('foo\r\n'));
    await Promise.resolve();
    expect(writeSpy).toHaveBeenCalledTimes(1);

    writeSpy.mockClear();
    macroController.onRxBytes(bytes('foo\n'));
    await Promise.resolve();
    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  test('invalid regex pattern causes no fires', async () => {
    const macro = macroController.macrosArray[0];
    asciiMacro(macro, 'r\n');
    macro.setSendOnRxMatch(true);
    macro.setRxMatchPattern('[unclosed');

    macroController.onRxBytes(bytes('anything\n'));
    await Promise.resolve();
    expect(writeSpy).not.toHaveBeenCalled();
  });

  //==========================================================================
  // onConnect
  //==========================================================================

  test('onConnect fires every macro flagged with sendOnConnect', async () => {
    const m0 = macroController.macrosArray[0];
    asciiMacro(m0, 'init0\n');
    m0.setSendOnConnect(true);

    const m1 = macroController.macrosArray[1];
    asciiMacro(m1, 'init1\n');
    m1.setSendOnConnect(true);

    const m2 = macroController.macrosArray[2];
    asciiMacro(m2, 'not-auto\n');
    m2.setSendOnConnect(false);

    macroController.onConnect();
    await Promise.resolve();
    expect(writeSpy).toHaveBeenCalledTimes(2);
  });

  //==========================================================================
  // onDisconnect
  //==========================================================================

  test('onDisconnect clears the line buffer so a stale prefix cannot bleed', async () => {
    const macro = macroController.macrosArray[0];
    asciiMacro(macro, 'r\n');
    macro.setSendOnRxMatch(true);
    macro.setRxMatchPattern('^abc$');

    // Stash a partial prefix.
    macroController.onRxBytes(bytes('ab'));
    macroController.onDisconnect();

    // After disconnect, sending `c\n` alone should NOT match `^abc$`
    // (since the buffer was cleared, the line is just `c`).
    macroController.onRxBytes(bytes('c\n'));
    await Promise.resolve();
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
