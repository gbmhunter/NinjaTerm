import { expect, test } from 'vitest'

import AppStorage from './AppStorage';

test('get config returns null when nothing stored there', () => {
  const appStorage = new AppStorage();
  const value = appStorage.getConfig(['prop1', 'prop2']);
  expect(value).toEqual(null);
})

test('basic get and set works', () => {
  const appStorage = new AppStorage();
  appStorage.saveConfig(['prop1', 'prop2'], 'hello');
  const value = appStorage.getConfig(['prop1', 'prop2']);
  expect(value).toEqual('hello');
})
