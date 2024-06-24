import { expect, test, describe, beforeEach } from 'vitest';

import { AppDataManager } from './AppDataManager';
import { App } from '../App';

beforeEach(() => {
  // Clear local storage, because otherwise jsdom persists storage
  // between tests
  window.localStorage.clear();
});

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
});
