import { expect, test, describe, beforeEach } from 'vitest';

import { AppData, AppDataManager } from './AppDataManager';
import { App } from '../App';

import { AppDataV1, AppDataV2 } from './DataClasses/AppData';

beforeEach(() => {
  // Clear local storage, because otherwise jsdom persists storage
  // between tests
  window.localStorage.clear();
});

/**
 * JSON replacer function which sorts the keys of objects.
 *
 * @param key
 * @param value
 * @returns
 */
const replacer = (key: string, value: any) =>
  value instanceof Object && !(value instanceof Array) ?
      Object.keys(value)
      .sort()
      .reduce((sorted: any, key: string) => {
          sorted[key] = value[key];
          return sorted
      }, {}) :
      value;

describe('app data manager tests', () => {
  test('default profile should be created', () => {
    const app = new App();
    const profileManager = new AppDataManager(app);
    expect(profileManager.appData.profiles.length).toEqual(1);
    expect(profileManager.appData.profiles[0].name).toEqual('Default profile');
  });

  test('new profile can be created', () => {
    const app = new App();
    const profileManager = new AppDataManager(app);
    profileManager.newProfile();
    expect(profileManager.appData.profiles.length).toEqual(2);
    expect(profileManager.appData.profiles[1].name).toEqual('New profile 1');
  });

  test('app data can be upgraded from v1', () => {
    const app = new App();
    const appDataManager = new AppDataManager(app);
    const appDataV1 = new AppDataV1();
    const {appData: appDataUpdated, wasChanged} = appDataManager._updateAppData(appDataV1);
    const latestCorrectAppData = new AppData();
    expect(wasChanged).toEqual(true);
    expect(appDataUpdated.version).toEqual(latestCorrectAppData.version);
    expect(JSON.stringify(appDataUpdated, replacer)).toEqual(JSON.stringify(latestCorrectAppData, replacer));
  });
});
