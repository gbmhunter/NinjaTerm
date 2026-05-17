import { expect, test, describe } from 'vitest';

import { Macro, MacroDataType, TxStepBreak, TxStepData } from './Macro';

describe('macro tests', () => {

  test('basic ascii to bytes', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setData('a');
    macro.setSendOnEnterValueForEveryNewLineInTextBox(true);

    const txSequence = macro.dataToTxSequence();
    expect(txSequence.steps.length).toBe(1);
    const step = txSequence.steps[0] as TxStepData;
    expect(step).toBeInstanceOf(TxStepData);
    expect(step.data).toStrictEqual(Uint8Array.from([97, 10]));
  });

  test('new line converted to \n', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setData('a\nb');
    macro.setSendOnEnterValueForEveryNewLineInTextBox(true);

    const txSequence = macro.dataToTxSequence();
    expect(txSequence.steps.length).toBe(1);
    const step = txSequence.steps[0] as TxStepData;
    expect(step).toBeInstanceOf(TxStepData);
    expect(step.data).toStrictEqual(Uint8Array.from([97, 10, 98, 10]));
  });

  test('new line converted to \r\n', () => {
    const macro = new Macro('M1', () => '\r\n');
    macro.setData('a\nb');
    macro.setSendOnEnterValueForEveryNewLineInTextBox(true);

    const txSequence = macro.dataToTxSequence();
    expect(txSequence.steps.length).toBe(1);
    const step = txSequence.steps[0] as TxStepData;
    expect(step).toBeInstanceOf(TxStepData);
    expect(step.data).toStrictEqual(Uint8Array.from([97, 13, 10, 98, 13, 10]));
  });

  test('new line converted to \r', () => {
    const macro = new Macro('M1', () => '\r');
    macro.setData('a\nb');
    macro.setSendOnEnterValueForEveryNewLineInTextBox(true);

    const txSequence = macro.dataToTxSequence();
    expect(txSequence.steps.length).toBe(1);
    const step = txSequence.steps[0] as TxStepData;
    expect(step).toBeInstanceOf(TxStepData);
    expect(step.data).toStrictEqual(Uint8Array.from([97, 13, 98, 13]));
  });

  test('basic hex', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00');

    const txSequence = macro.dataToTxSequence();
    expect(txSequence.steps.length).toBe(1);
    const step = txSequence.steps[0] as TxStepData;
    expect(step).toBeInstanceOf(TxStepData);
    expect(step.data).toStrictEqual(Uint8Array.from([0]));
  });

  test('two bytes of hex', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('0001');

    const txSequence = macro.dataToTxSequence();
    expect(txSequence.steps.length).toBe(1);
    const step = txSequence.steps[0] as TxStepData;
    expect(step).toBeInstanceOf(TxStepData);
    expect(step.data).toStrictEqual(Uint8Array.from([0, 1]));
  });

  test('two bytes of hex with space', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00 01');

    const txSequence = macro.dataToTxSequence();
    expect(txSequence.steps.length).toBe(1);
    const step = txSequence.steps[0] as TxStepData;
    expect(step).toBeInstanceOf(TxStepData);
    expect(step.data).toStrictEqual(Uint8Array.from([0, 1]));
  });

  test('two bytes of hex with new lines', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00\n01');

    const txSequence = macro.dataToTxSequence();
    expect(txSequence.steps.length).toBe(1);
    const step = txSequence.steps[0] as TxStepData;
    expect(step).toBeInstanceOf(TxStepData);
    expect(step.data).toStrictEqual(Uint8Array.from([0, 1]));
  });

  test('make sure odd number of hex chars throws error', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('abc');

    expect(() => macro.dataToTxSequence()).toThrowError();
  });

  test('complicated hex works', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00 ff AB 32\n    689\n1');

    const txSequence = macro.dataToTxSequence();
    expect(txSequence.steps.length).toBe(1);
    const step = txSequence.steps[0] as TxStepData;
    expect(step).toBeInstanceOf(TxStepData);
    expect(step.data).toStrictEqual(Uint8Array.from([0x00, 0xFF, 0xAB, 0x32, 0x68, 0x91]));
  });

  test('send break for hex works with 2 lines', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00\n01');
    macro.setSendBreakAtEndOfEveryLineOfHex(true);

    const txSequence = macro.dataToTxSequence();
    expect(txSequence.steps.length).toBe(4);

    // Step 1
    {
      const step = txSequence.steps[0] as TxStepData;
      expect(step).toBeInstanceOf(TxStepData);
      expect(step.data).toStrictEqual(Uint8Array.from([0x00]));
    }

    // Step 2
    {
      const step = txSequence.steps[1] as TxStepBreak;
      expect(step).toBeInstanceOf(TxStepBreak);
    }

    // Step 3
    {
      const step = txSequence.steps[2] as TxStepData;
      expect(step).toBeInstanceOf(TxStepData);
      expect(step.data).toStrictEqual(Uint8Array.from([0x01]));
    }

    // Step 4
    {
      const step = txSequence.steps[3] as TxStepBreak;
      expect(step).toBeInstanceOf(TxStepBreak);
    }
  });

  test('send break and hex throws error if any line is not valid hex', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00\n0\n02'); // Forget the 1 in the 2nd line
    macro.setSendBreakAtEndOfEveryLineOfHex(true);

    expect(() => macro.dataToTxSequence()).toThrowError();
  });

  test('toConfig() and fromConfig() work', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('1234');
    const macroConfig = macro.toConfig();

    // Create new macro
    const newMacro = new Macro('M1', () => '\n');
    newMacro.loadConfig(macroConfig);

    expect(newMacro.data).toBe(macro.data);
    expect(newMacro.dataType).toBe(macro.dataType);
  });

  //==========================================================================
  // Auto-response trigger fields (issue #364)
  //==========================================================================

  test('rxMatchRegex is null for empty pattern with no error', () => {
    const macro = new Macro('M1', () => '\n');
    expect(macro.rxMatchRegex).toBeNull();
    expect(macro.rxMatchRegexErrorMsg).toBe('');
  });

  test('rxMatchRegex compiles a valid pattern (case-insensitive by default)', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setRxMatchPattern('hello');
    const regex = macro.rxMatchRegex;
    expect(regex).not.toBeNull();
    expect(regex!.test('HELLO world')).toBe(true);
    expect(regex!.flags).toContain('i');
    expect(macro.rxMatchRegexErrorMsg).toBe('');
  });

  test('rxMatchRegex respects rxMatchCaseSensitive=true', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setRxMatchPattern('hello');
    macro.setRxMatchCaseSensitive(true);
    const regex = macro.rxMatchRegex;
    expect(regex).not.toBeNull();
    expect(regex!.test('HELLO')).toBe(false);
    expect(regex!.test('hello')).toBe(true);
    expect(regex!.flags).not.toContain('i');
  });

  test('rxMatchRegex returns null and sets error on invalid regex', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setRxMatchPattern('[unclosed');
    expect(macro.rxMatchRegex).toBeNull();
    expect(macro.rxMatchRegexErrorMsg.length).toBeGreaterThan(0);
  });

  test('auto-response fields round-trip through toConfig/loadConfig', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setSendOnConnect(true);
    macro.setSendOnRxMatch(true);
    macro.setRxMatchPattern('foo\\d+');
    macro.setRxMatchCaseSensitive(true);
    const config = macro.toConfig();

    const fresh = new Macro('M1', () => '\n');
    fresh.loadConfig(config);

    expect(fresh.sendOnConnect).toBe(true);
    expect(fresh.sendOnRxMatch).toBe(true);
    expect(fresh.rxMatchPattern).toBe('foo\\d+');
    expect(fresh.rxMatchCaseSensitive).toBe(true);
  });

  test('loadConfig defaults absent auto-response fields', () => {
    const macro = new Macro('M1', () => '\n');
    // Simulate an old pre-v18 on-disk config that doesn't carry the new fields.
    macro.loadConfig({
      version: 1,
      name: 'M1',
      data: '',
      dataType: MacroDataType.ASCII,
      processEscapeChars: true,
      sendOnEnterValueForEveryNewLineInTextBox: false,
      sendBreakAtEndOfEveryLineOfHex: false,
    } as any);
    expect(macro.sendOnConnect).toBe(false);
    expect(macro.sendOnRxMatch).toBe(false);
    expect(macro.rxMatchPattern).toBe('');
    expect(macro.rxMatchCaseSensitive).toBe(false);
    expect(macro.sendOnInterval).toBe(false);
    expect(macro.intervalMs).toBe('1000');
    expect(macro.intervalMsNumber).toBe(1000);
  });

  test('intervalMsErrorMsg is empty for a positive integer string', () => {
    const macro = new Macro('M1', () => '\n');
    expect(macro.intervalMs).toBe('1000');
    expect(macro.intervalMsErrorMsg).toBe('');
    macro.setIntervalMs('50');
    expect(macro.intervalMsErrorMsg).toBe('');
    expect(macro.intervalMsNumber).toBe(50);
  });

  test('intervalMsErrorMsg flags empty, zero, negative, decimal, and non-numeric input', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setIntervalMs('');
    expect(macro.intervalMsErrorMsg.length).toBeGreaterThan(0);
    expect(macro.intervalMsNumber).toBeNull();
    macro.setIntervalMs('0');
    expect(macro.intervalMsErrorMsg.length).toBeGreaterThan(0);
    macro.setIntervalMs('-1');
    expect(macro.intervalMsErrorMsg.length).toBeGreaterThan(0);
    macro.setIntervalMs('1.5');
    expect(macro.intervalMsErrorMsg.length).toBeGreaterThan(0);
    macro.setIntervalMs('abc');
    expect(macro.intervalMsErrorMsg.length).toBeGreaterThan(0);
    expect(macro.intervalMsNumber).toBeNull();
  });

  test('user can clear the interval field mid-edit (raw input is preserved)', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setIntervalMs('1000');
    // User selects all and deletes — input is empty for a moment.
    macro.setIntervalMs('');
    expect(macro.intervalMs).toBe(''); // not rewritten to 0 or anything else
    expect(macro.intervalMsNumber).toBeNull();
    expect(macro.intervalMsErrorMsg.length).toBeGreaterThan(0);
    // User types a new value.
    macro.setIntervalMs('250');
    expect(macro.intervalMs).toBe('250');
    expect(macro.intervalMsNumber).toBe(250);
    expect(macro.intervalMsErrorMsg).toBe('');
  });

  test('interval fields round-trip through toConfig/loadConfig', () => {
    const macro = new Macro('M1', () => '\n');
    macro.setSendOnInterval(true);
    macro.setIntervalMs('250');
    const config = macro.toConfig();

    const fresh = new Macro('M1', () => '\n');
    fresh.loadConfig(config);
    expect(fresh.sendOnInterval).toBe(true);
    expect(fresh.intervalMs).toBe('250');
    expect(fresh.intervalMsNumber).toBe(250);
  });
});
