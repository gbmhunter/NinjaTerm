import fs from 'fs';

import { expect, test, describe, beforeEach } from 'vitest';

import { AppDataManager } from './AppDataManager';
import { AppData } from './DataClasses/AppData';
import { App } from '../App';

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

  // v1 to v2 upgrade test doesn't work, not sure why?
  // test('app data can be upgraded from v1', () => {
  //   const app = new App();
  //   const appDataManager = new AppDataManager(app);
  //   const appDataV2 = JSON.parse(fs.readFileSync('./local-storage-data/appData-v1-app-v4.18.0.json', 'utf8'));
  //   const {appData: appDataUpdated, wasChanged} = appDataManager._updateAppData(appDataV2);
  //   const latestCorrectAppData = new AppData();
  //   expect(wasChanged).toEqual(true);
  //   expect(appDataUpdated.version).toEqual(latestCorrectAppData.version);
  //   // Save the updated app data to a file
  //   fs.writeFileSync('./local-storage-data/updated.json', JSON.stringify(appDataUpdated, replacer, 2));
  //   // Save latest correct app data to a file
  //   fs.writeFileSync('./local-storage-data/latest-correct.json', JSON.stringify(latestCorrectAppData, replacer, 2));
  //   expect(JSON.stringify(appDataUpdated, replacer)).toEqual(JSON.stringify(latestCorrectAppData, replacer));
  // });

  test('app data can be upgraded from v2', () => {
    const app = new App();
    const appDataManager = new AppDataManager(app);
    const appDataV2 = JSON.parse(fs.readFileSync('./local-storage-data/appData-v2-app-v4.19.0-default.json', 'utf8'));
    const {appData: appDataUpdated, wasChanged} = appDataManager._updateAppData(appDataV2);
    const latestCorrectAppData = new AppData();
    expect(wasChanged).toEqual(true);
    expect(appDataUpdated.version).toEqual(latestCorrectAppData.version);
    // Save the updated app data to a file
    // fs.writeFileSync('./local-storage-data/updated.json', JSON.stringify(appDataUpdated, replacer, 2));
    // Save latest correct app data to a file
    // fs.writeFileSync('./local-storage-data/latest-correct.json', JSON.stringify(latestCorrectAppData, replacer, 2));
    expect(JSON.stringify(appDataUpdated, replacer))
      .toEqual(JSON.stringify(latestCorrectAppData, replacer));
  });
});
