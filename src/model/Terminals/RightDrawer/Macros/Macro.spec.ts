import { expect, test, describe } from 'vitest';

import { Macro, MacroDataType } from './Macro';

describe('macro tests', () => {

  test('basic ascii to bytes', () => {
    let macro = new Macro('M1');
    macro.setData('a');
    const bytes = macro.textAreaToBytes('\n');
    expect(bytes).toStrictEqual(Uint8Array.from([97]));
  });

  test('new line converted to \n', () => {
    let macro = new Macro('M1');
    macro.setData('a\nb');
    const bytes = macro.textAreaToBytes('\n');
    expect(bytes).toStrictEqual(Uint8Array.from([97, 10, 98]));
  });

  test('new line converted to \r\n', () => {
    let macro = new Macro('M1');
    macro.setData('a\nb');
    const bytes = macro.textAreaToBytes('\r\n');
    expect(bytes).toStrictEqual(Uint8Array.from([97, 13, 10, 98]));
  });

  test('new line converted to \r', () => {
    let macro = new Macro('M1');
    macro.setData('a\nb');
    const bytes = macro.textAreaToBytes('\r');
    expect(bytes).toStrictEqual(Uint8Array.from([97, 13, 98]));
  });

  test('basic hex', () => {
    let macro = new Macro('M1');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00');
    const bytes = macro.textAreaToBytes('');
    expect(bytes).toStrictEqual(Uint8Array.from([0]));
  });

  test('two bytes of hex', () => {
    let macro = new Macro('M1');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('0001');
    const bytes = macro.textAreaToBytes('');
    expect(bytes).toStrictEqual(Uint8Array.from([0, 1]));
  });

  test('two bytes of hex with space', () => {
    let macro = new Macro('M1');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00 01');
    const bytes = macro.textAreaToBytes('');
    expect(bytes).toStrictEqual(Uint8Array.from([0, 1]));
  });

  test('two bytes of hex with new lines', () => {
    let macro = new Macro('M1');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00\n01');
    const bytes = macro.textAreaToBytes('');
    expect(bytes).toStrictEqual(Uint8Array.from([0, 1]));
  });

  test('make sure odd number of hex chars throws error', () => {
    let macro = new Macro('M1');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('abc');
    expect(() => macro.textAreaToBytes('')).toThrowError();
  });

  test('complicated hex works', () => {
    let macro = new Macro('M1');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('00 ff AB 32\n    689\n1');
    const bytes = macro.textAreaToBytes('');
    expect(bytes).toStrictEqual(Uint8Array.from([0x00, 0xFF, 0xAB, 0x32, 0x68, 0x91]));
  });

  test('toJSON() and fromJSON() work', () => {
    let macro = new Macro('M1');
    macro.setDataType(MacroDataType.HEX);
    macro.setData('1234');
    const json = JSON.stringify(macro);
    const newMacro = Macro.fromJSON(json);

    expect(newMacro.data).toBe(macro.data);
    expect(newMacro.dataType).toBe(macro.dataType);
  });
});
