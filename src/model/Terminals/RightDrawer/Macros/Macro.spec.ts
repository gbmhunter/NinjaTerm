import { expect, test, describe, beforeEach } from 'vitest';

import { Macro } from './Macro';

describe('util tests', () => {

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

});
