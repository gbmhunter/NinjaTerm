import { expect, test, describe, beforeEach } from 'vitest';

import { textAreaToBytes } from './Util';

describe('util tests', () => {

  test('basic ascii to bytes', () => {
    const bytes = textAreaToBytes('a', '\n');
    expect(bytes).toStrictEqual(Uint8Array.from([97]));
  });

});
