import { expect, test } from 'vitest'

import AppStorage from './AppStorage';

test('get config returns null when nothing stored there', () => {
  const appStorage = new AppStorage();
  const value = appStorage.getConfig(['prop1', 'prop2']);
  expect(value).toEqual(null);
})
