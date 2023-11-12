import { expect, test, describe, beforeEach } from 'vitest'

import AppStorage from './AppStorage';

beforeEach(() => {
  // Clear local storage, because otherwise jsdom persists storage
  // between tests
  window.localStorage.clear();
})

describe('config tests', () => {
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

  test('can get parent key and see child', () => {
    const appStorage = new AppStorage();
    appStorage.saveConfig(['prop1', 'prop2'], 'hello');
    const value = appStorage.getConfig(['prop1']);
    expect(value).toEqual({ prop2: 'hello' });
  })

  test('can read back root config', () => {
    const appStorage = new AppStorage();
    appStorage.saveConfig(['prop1', 'prop2'], 'hello');
    const value = appStorage.getConfig([]);
    expect(value).toEqual({ prop1: { prop2: 'hello' } });
  })

  test('can set root config', () => {
    const appStorage = new AppStorage();
    appStorage.saveConfig([], 'hello');
    const value = appStorage.getConfig([]);
    expect(value).toEqual('hello');
  })
});
