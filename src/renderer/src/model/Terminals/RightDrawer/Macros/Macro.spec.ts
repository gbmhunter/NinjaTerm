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
});
