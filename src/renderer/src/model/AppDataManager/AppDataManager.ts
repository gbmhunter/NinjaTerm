import { makeAutoObservable } from 'mobx';
import { VariantType } from 'notistack';
import { PortInfo } from '@serialport/bindings-interface';

import { ConnState } from '../Settings/PortSettings/PortSettings';
import { App } from '../App';
import { AppData } from './DataClasses/AppData';
import { Profile } from './DataClasses/Profile';
import { migrateAppData } from './appDataMigrations';
import { log } from '@/model/Util/Log';

export class LastUsedSerialPort {
  path: string = '';
  portState: ConnState = ConnState.CLOSED;
}

/**
 * Alias to the up-to-date version of the app data class.
 */
// export const AppData = AppData;

const APP_DATA_STORAGE_KEY = 'appData';

export class AppDataManager {
  app: App;

  appData: AppData;

  _profileChangeCallbacks: (() => void)[] = [];

  /**
   * Represents the name of the last profile that was applied to the app. Used for displaying
   * in various places such as the toolbar.
   */
  lastAppliedProfileName: string = 'No profile';

  constructor(app: App) {
    this.app = app;
    this.appData = new AppData();

    window.addEventListener('storage', this.onStorageEvent);

    // Load app data from storage
    this._loadAppDataFromStorage();

    makeAutoObservable(this);
  }

  /**
   * Removes listeners that this manager registered on the global window.
   * Called from App.cleanup() so a recreated App (e.g. hot reload during dev)
   * does not leave stale `storage`-event handlers attached to the previous
   * instance.
   */
  cleanup = () => {
    window.removeEventListener('storage', this.onStorageEvent);
  };

  /**
   * Function should be registered as a listener for the 'storage' event. It will check
   * to see if the profile data in storage has changed and if so, reload the profiles.
   * @param event The storage event.
   * @returns
   */
  onStorageEvent = (event: StorageEvent) => {
    log.info('Caught storage event. event.key: ', event.key, ' event.newValue: ', event.newValue);

    if (event.key === APP_DATA_STORAGE_KEY) {
      log.info('App data changed from another process. Checking if profiles changed...');
      // Check if the profiles changed
      const appDataAsJson = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
      if (appDataAsJson === null) {
        log.error('App data not found in local storage.');
        return;
      }
      let appDataInStorage: any;
      try {
        appDataInStorage = JSON.parse(appDataAsJson);
      } catch (err) {
        // Another tab/process wrote unparseable data. Skip the cross-tab
        // sync rather than crashing the renderer.
        log.error('Failed to parse app data from storage event. err=', err);
        return;
      }
      // Compare the JSON strings of the profiles to work out if they are different
      if (JSON.stringify(appDataInStorage.profiles) !== JSON.stringify(this.appData.profiles)) {
        log.info('Profiles changed. Reloading profiles...');
        // Reload just the profiles, we don't want to overwrite the current app config
        this.appData.profiles = appDataInStorage.profiles;
      }
    }
  }

  registerOnProfileLoad = (callback: () => void) => {
    this._profileChangeCallbacks.push(callback);
  };

  _loadAppDataFromStorage = () => {
    const appDataAsJson = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
    // let profileManagerData: ProfileManagerData;
    let appData: AppData;
    if (appDataAsJson === null) {
      // No config key found in users store, create one!
      log.info('App data not found in local storage. Creating default app data...');
      appData = new AppData();
      // Save just-created config back to store.
      window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData));
    } else {
      // A version of app data was found in local storage. Load it.
      let appDataUnknownVersion: any;
      try {
        appDataUnknownVersion = JSON.parse(appDataAsJson);
      } catch (err) {
        // Corrupt / truncated localStorage entry. Without this guard, an
        // unparseable value crashes the App constructor and leaves the
        // renderer dead on launch with no way to recover. Fall back to a
        // fresh default and overwrite the bad value.
        log.error('Failed to parse app data from local storage. Falling back to defaults. err=', err);
        appData = new AppData();
        window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData));
        this.appData = appData;
        return;
      }
      let wasChanged;
      ({ appData, wasChanged } = this._updateAppData(appDataUnknownVersion));

      if (wasChanged) {
        window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData));
      }
    }

    // Load data into class
    this.appData = appData;
  };

  /**
   * Use this to update an app data object read from local storage to the latest version.
   *
   * Does not modify the input object, instead returns a new object with the updated version.
   *
   * The actual per-version migration steps live in `./appDataMigrations.ts` —
   * each one is a small typed function so a typo in a settings-tree field name
   * is a TS error rather than the silent runtime no-op the previous
   * `(any) => any` chain produced.
   *
   * @param appData The app data object to update.
   * @returns An object containing the updated app data and a boolean
   *   indicating if the app data was changed.
   */
  _updateAppData = (appData: unknown): { appData: AppData, wasChanged: boolean } => {
    const result = migrateAppData(appData);
    if (result.unknownVersion) {
      log.error('Unknown app data version found. Falling back to a fresh AppData. version=', (appData as any)?.version);
      return { appData: new AppData(), wasChanged: true };
    }
    // The migrated object has the right shape but is a plain object — the
    // class methods on `AppData` / `Profile` aren't reattached. Existing
    // callers treat it as plain JSON anyway (the manager re-saves the whole
    // tree via JSON.stringify), so the cast is safe.
    return { appData: result.appData as unknown as AppData, wasChanged: result.wasChanged };
  }


  /**
   * Save the current app configuration to local storage.
   */
  saveAppData = () => {
    window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(this.appData));
  };

  /**
   * Create a new profile (with default config) and add it to the list of profiles.
   */
  newProfile = () => {
    // Calculate name for new profile, in the form "New profile X" where X is the next number
    let nextProfileNum = 1;
    const newProfileName = 'New profile';
    let newProfileNameToCheck = newProfileName + ' ' + nextProfileNum;
    while (this.appData.profiles.find((profile) => profile.name === newProfileNameToCheck) !== undefined) {
      nextProfileNum++;
      newProfileNameToCheck = newProfileName + ' ' + nextProfileNum;
    }
    // At this point newProfileNameToCheck is the name we want
    const newProfile = new Profile(newProfileNameToCheck);
    this.appData.profiles.push(newProfile);
    this.saveAppData();

    // Automatically save the current app state to the newly created profile
    // and silence the snackbar message
    this.saveCurrentAppConfigToProfile(this.appData.profiles.length - 1, true);
  };

  /**
   * Delete the profile at the provided index and save the profiles to local storage.
   * @param profileIdx The index of the profile to delete.
   */
  deleteProfile = (profileIdx: number) => {
    this.appData.profiles.splice(profileIdx, 1);
    this.saveAppData();
  };

  /**
   * Apply the profile at the provided index to the current app config (i.e. update the app
   * to reflect the profile).
   *
   * Will attempt to connect to the serial port specified in the profile if it is available.
   *
   * @param profileIdx The index of the profile to apply to the app.
   */
  applyProfileToApp = async (profileIdx: number) => {
    const profile = this.appData.profiles[profileIdx];

    // Check the last connected serial port of the profile and compare with
    // currently connected one
    const profileLastUsedPortPath = profile.rootConfig.lastUsedSerialPort.path;
    const currentPortPath = this.appData.currentAppConfig.lastUsedSerialPort.path;

    let weNeedToConnect = false;
    let matchedAvailablePorts: PortInfo[] = [];
    let snackbarMessage = `Profile "${profile.name}" loaded.`;
    let snackbarVariant: VariantType = 'success';
    if (profileLastUsedPortPath == '{}') {
      weNeedToConnect = false;
    } else if (profileLastUsedPortPath === currentPortPath) {
      // Same serial port, no need to disconnect and connect
      // Note there is a chance we are not connected to the right one due to
      // ambiguity...but if already connected it is a better user experience to
      // not disconnect on the high chance it is the correct port
      weNeedToConnect = false;
      snackbarMessage += '\nAlready connected port matches one specified in profile. Leaving port connected.';
    } else {
      // They are both different and the profile one is non-empty. Check to see if the profile ports is available
      log.info('Port infos are both different and non-empty. Checking if ports are available...');
      // const availablePorts = await navigator.serial.getPorts();
      const availablePortsResult = await window.electronAPI.serial.listPorts();
      if (!availablePortsResult.success) {
        throw new Error('Failed to list available ports.');
      }
      const availablePorts = availablePortsResult.ports!;
      matchedAvailablePorts = availablePorts.filter((port) => port.path === profileLastUsedPortPath);

      if (matchedAvailablePorts.length === 0) {
        // The profile port is not available
        weNeedToConnect = false;
        snackbarMessage += '\nNo available port matches the profile port info. No connecting to any.';
        snackbarVariant = 'warning';
      } else if (matchedAvailablePorts.length === 1) {
        // The profile port is available
        weNeedToConnect = true;
      } else {
        // There are multiple ports that match the profile port, too ambiguous, do
        // not connect to any
        weNeedToConnect = false;
        snackbarMessage += '\nMultiple available ports info match the profile port info (ambiguous). Not connecting to any.';
        snackbarVariant = 'warning';
      }
    }

    // Only disconnect if we have found a valid port to connect to
    if (weNeedToConnect) {
      if (this.app.connController.connState === ConnState.OPENED) {
        await this.app.connController.closeConnection({ silenceSnackbar: true });
      } else if (this.app.connController.connState === ConnState.CLOSED_BUT_WILL_REOPEN) {
        this.app.connController.stopWaitingToReopenPort();
      }
    }
    // Update the current app config from the provided profile,
    // and then save this new app config
    this.appData.currentAppConfig = JSON.parse(JSON.stringify(profile.rootConfig));
    this.saveAppData();

    // Need to tell the rest of the app to update
    this._profileChangeCallbacks.forEach((callback) => {
      callback();
    });

    this.lastAppliedProfileName = profile.name;

    // Now connect to the port if we need to
    if (weNeedToConnect) {
      this.app.connController.setSelectedPort(matchedAvailablePorts[0]);
      await this.app.connController.openConnection({ silenceSnackbar: true });
      snackbarMessage += '\nConnected to port with info: "' + profileLastUsedPortPath + '".';
    }

    // Post message to snackbar
    this.app.snackbar.sendToSnackbar(snackbarMessage, snackbarVariant);
  };

  /**
   * Save the current app config to the provided profile and the save the profiles to local storage.
   * @param profileIdx The index of the profile to save the current app config to.
   */
  saveCurrentAppConfigToProfile = (profileIdx: number, noSnackbar = false) => {
    log.info('Saving current app config to profile...');
    const profile = this.appData.profiles[profileIdx];
    profile.rootConfig = JSON.parse(JSON.stringify(this.appData.currentAppConfig));
    this.saveAppData();

    // Although we are not loading a profile, saving the app state to a profile
    // is essentially the same thing, so update the name (this is used in the app title)
    this.lastAppliedProfileName = profile.name;

    // Post message to snackbar
    if (!noSnackbar) {
      this.app.snackbar.sendToSnackbar('Profile "' + profile.name + '" saved.', 'success');
    }
  };
}
