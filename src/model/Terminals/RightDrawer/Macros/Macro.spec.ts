import { expect, test, describe } from 'vitest';

import { Macro, MacroDataType } from './Macro';

describe('macro tests', () => {

  test('basic ascii to bytes', () => {
    let macro = new Macro('M1', () => '\n');
    macro.setData('a');
    const bytes = macro.dataToBytes();
    expect(bytes).toStrictEqual(Uint8Array.from([97]));
  });

  test('new line converted to \n', () => {
    let macro = new Macro('M1', () => '\n');
    macro.setData('a\nb');
    const bytes = macro.dataToBytes();
    expect(bytes).toStrictEqual(Uint8Array.from([97, 10, 98]));
  });

  test('new line converted to \r\n', () => {
    let macro = new Macro('M1', () => '\r\n');
    macro.setData('a\nb');
    const bytes = macro.dataToBytes();
    expect(bytes).toStrictEqual(Uint8Array.from([97, 13, 10, 98]));
  });

  test('new line converted to \r', () => {
    let macro = new Macro('M1', () => '\r');
    macro.setData('a\nb');
    const bytes = macro.dataToBytes();
    expect(bytes).toStrictEqual(Uint8Array.from([97, 13, 98]));
  });

  test('basic hex', () => {
    let macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00');
    const bytes = macro.dataToBytes();
    expect(bytes).toStrictEqual(Uint8Array.from([0]));
  });

  test('two bytes of hex', () => {
    let macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('0001');
    const bytes = macro.dataToBytes();
    expect(bytes).toStrictEqual(Uint8Array.from([0, 1]));
  });

  test('two bytes of hex with space', () => {
    let macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00 01');
    const bytes = macro.dataToBytes();
    expect(bytes).toStrictEqual(Uint8Array.from([0, 1]));
  });

  test('two bytes of hex with new lines', () => {
    let macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00\n01');
    const bytes = macro.dataToBytes();
    expect(bytes).toStrictEqual(Uint8Array.from([0, 1]));
  });

  test('make sure odd number of hex chars throws error', () => {
    let macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('abc');
    expect(() => macro.dataToBytes()).toThrowError();
  });

  test('complicated hex works', () => {
    let macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00 ff AB 32\n    689\n1');
    const bytes = macro.dataToBytes();
    expect(bytes).toStrictEqual(Uint8Array.from([0x00, 0xFF, 0xAB, 0x32, 0x68, 0x91]));
  });

  test('toJSON() and fromJSON() work', () => {
    let macro = new Macro('M1', () => '\n');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('1234');
    const json = JSON.stringify(macro);

    // Create new macro
    let newMacro = new Macro('M1', () => '\n');
    newMacro.fromJSON(json);

    expect(newMacro.data).toBe(macro.data);
    expect(newMacro.dataType).toBe(macro.dataType);
  });
});
