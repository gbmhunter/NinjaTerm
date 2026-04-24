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

/**
 * Helper function for the app data upgrade tests. This upgrades the provided app data that should have been read from disk to the latest version and compares it with a freshly created app data object to make sure they are the same.
 * @param savedAppData App data which has been read from disk. It must be the default app data, i.e. not modified by the user in any way.
 */
function updateAndCompare(savedAppData: any) {
  const app = new App();
  const appDataManager = new AppDataManager(app);

  const savedAppVersion = savedAppData.version;
  let {appData: savedAndUpdatedAppData, wasChanged} = appDataManager._updateAppData(savedAppData);
  let latestCorrectAppData = new AppData();
  const latestAppDataVersion = latestCorrectAppData.version;
  // v10 adds a ["settings"]["logSettings"]["logDirectory"] path in each profile which is specific to the user's machine because it the default directory
  // includes the users home directory (e.g. "logDirectory": "C:\\Users\\geoff\\NinjaTerm\\logs")
  // We need to overwrite these paths before comparing
  function userSpecificReplacer(appData: AppData) {
    for (let i = 0; i < appData.profiles.length; i++) {
      appData.profiles[i].rootConfig.settings.logSettings.logDirectory = '/home/pretend_user/NinjaTerm/logs';
    }
    appData.currentAppConfig.settings.logSettings.logDirectory = '/home/pretend_user/NinjaTerm/logs';
    return appData;
  }
  savedAndUpdatedAppData = userSpecificReplacer(savedAndUpdatedAppData);
  latestCorrectAppData = userSpecificReplacer(latestCorrectAppData);

  // If the app data saved to disk is older than the latest version, we expect the app data to be updated
  if (savedAppVersion !== latestAppDataVersion) {
    expect(wasChanged).toEqual(true);
  }
  expect(savedAndUpdatedAppData.version).toEqual(latestCorrectAppData.version);
  expect(JSON.stringify(savedAndUpdatedAppData, replacer))
    .toEqual(JSON.stringify(latestCorrectAppData, replacer));
}

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

  test('app data can be upgraded from v2', () => {
    const savedAppData = JSON.parse(fs.readFileSync('./local-storage-data/appData-v2-app-v4.19.0-default.json', 'utf8'));
    updateAndCompare(savedAppData);
  });

  test('app data can be upgraded from v8', () => {
    const savedAppData = JSON.parse(fs.readFileSync('./local-storage-data/appData-v8-app-v5.4.0-default.json', 'utf8'));
    updateAndCompare(savedAppData);
  });

  test('app data can be upgraded from v10', () => {
    const savedAppData = JSON.parse(fs.readFileSync('./local-storage-data/appData-v10-app-v5.5.0-default.json', 'utf8'));
    updateAndCompare(savedAppData);
  });

  test('pushRttRecentDevice persists across a reload of AppDataManager', () => {
    // Regression test: `_loadConfig` used to call `applySocketConnTimeout` / `applyRttSpeed`
    // mid-load, both of which save. Because they ran *before* `rttRecentDevices` was read
    // from disk, the save persisted the default `[]` back to localStorage and wiped recent
    // devices on every app start. `_isLoading` makes `_saveConfig` a no-op during load.
    const app1 = new App();
    const deviceA = 'nRF52832_xxAA';
    const deviceB = 'STM32F407VG';

    app1.settings.portConfiguration.pushRttRecentDevice(deviceA);
    app1.settings.portConfiguration.pushRttRecentDevice(deviceB);
    // Re-adding deviceA moves it to the front; should not duplicate.
    app1.settings.portConfiguration.pushRttRecentDevice(deviceA);
    expect(app1.settings.portConfiguration.rttRecentDevices).toEqual([deviceA, deviceB]);

    const app2 = new App();
    expect(app2.settings.portConfiguration.rttRecentDevices).toEqual([deviceA, deviceB]);
  });
});
