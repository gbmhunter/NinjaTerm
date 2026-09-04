import { describe, expect, test, beforeEach } from 'vitest';
import { autorun, runInAction } from 'mobx';

import { App } from 'src/model/App';
import { DataType } from './RxSettings/RxSettings';

/**
 * Guards the assumption the settings classes are built on: that the persisted
 * config tree under `appData.currentAppConfig` is MobX-observable, and is so
 * on *every* path that produces it.
 *
 * It was not. `AppData`, `ProfileConfig` and the `*Data` classes are classes,
 * and MobX's deep conversion skips class instances. So on a fresh install
 * (`new AppData()`) the settings leaves were plain properties nothing could
 * observe — while on every later launch, `JSON.parse` produced plain objects
 * that `AppDataManager`'s `makeAutoObservable` deep-converted, and the same
 * leaves *were* observable. The runtime settings classes kept their own copy
 * of every field to paper over that gap, which is where the sync bugs came
 * from.
 *
 * These tests pin that both paths now yield the same observable tree, by
 * observing the leaves directly rather than through any settings façade.
 */
describe('config tree observability', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  /**
   * Records every value an autorun sees for the given leaf, then writes a new
   * value and reports what was observed. Two entries means the write was seen;
   * one means the leaf is a dead plain property.
   */
  function observeLeafWrite(app: App): DataType[] {
    const rxConfig = app.profileManager.appData.currentAppConfig.settings.rxSettings;
    const seen: DataType[] = [];
    const dispose = autorun(() => {
      seen.push(rxConfig.dataType);
    });
    runInAction(() => {
      rxConfig.dataType = DataType.NUMBER;
    });
    dispose();
    return seen;
  }

  test('fresh install: a write to a settings leaf is observable', () => {
    // localStorage is empty, so this constructs `new AppData()`.
    const app = new App();
    expect(observeLeafWrite(app)).toEqual([DataType.ASCII, DataType.NUMBER]);
  });

  test('loaded from storage: a write to a settings leaf is observable', () => {
    // First App writes defaults to storage; the second loads them back.
    new App();
    const app = new App();
    expect(observeLeafWrite(app)).toEqual([DataType.ASCII, DataType.NUMBER]);
  });

  test('both paths produce the same shape', () => {
    const fresh = new App().profileManager.appData;
    const loaded = new App().profileManager.appData;
    expect(JSON.stringify(fresh)).toBe(JSON.stringify(loaded));
  });
});
