import { makeAutoObservable } from 'mobx';

import { PortState } from '../Settings/PortSettings/PortSettings';
import { App } from '../App';
import { VariantType } from 'notistack';
import { AppData } from './DataClasses/AppData';
import { Profile } from './DataClasses/Profile';
import { TerminalHeightMode } from '../Settings/DisplaySettings/DisplaySettings';
import { TimestampFormat } from '../Settings/RxSettings/RxSettings';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_TX_COLOR, DEFAULT_RX_COLOR } from './DataClasses/DisplaySettingsData';

export class LastUsedSerialPort {
  serialPortInfo: Partial<SerialPortInfo> = {};
  portState: PortState = PortState.CLOSED;
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

    addEventListener('storage', this.onStorageEvent);

    // Load app data from storage
    this._loadAppDataFromStorage();

    makeAutoObservable(this);
  }

  /**
   * Function should be registered as a listener for the 'storage' event. It will check
   * to see if the profile data in storage has changed and if so, reload the profiles.
   * @param event The storage event.
   * @returns
   */
  onStorageEvent = (event: StorageEvent) => {
    console.log('Caught storage event. event.key: ', event.key, ' event.newValue: ', event.newValue);

    if (event.key === APP_DATA_STORAGE_KEY) {
      console.log('App data changed from another process. Checking if profiles changed...');
      // Check if the profiles changed
      const appDataAsJson = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
      if (appDataAsJson === null) {
        console.error('App data not found in local storage.');
        return;
      }
      const appDataInStorage = JSON.parse(appDataAsJson);
      // Compare the JSON strings of the profiles to work out if they are different
      if (JSON.stringify(appDataInStorage.profiles) !== JSON.stringify(this.appData.profiles)) {
        console.log('Profiles changed. Reloading profiles...');
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
      console.log('App data not found in local storage. Creating default app data...');
      appData = new AppData();
      // Save just-created config back to store.
      window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData));
    } else {
      // A version of app data was found in local storage. Load it.
      let appDataUnknownVersion = JSON.parse(appDataAsJson);
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
   * @param appData The app data object to update.
   * @returns An object containing the updated app data and a boolean indicating if the app data was changed.
   */
  _updateAppData = (appData: any): { appData: AppData, wasChanged: boolean } => {
    let wasChanged = false;
    let updatedAppData = JSON.parse(JSON.stringify(appData)) as any;

    //=============================================================================
    // VERSION 1 -> VERSION 2
    //=============================================================================
    if (updatedAppData.version === 1) {
      console.log('Updating app data from version 1 to version 2...');
      // Convert to v2
      // Port settings got a new field, display settings got two new fields
      let upgradeRootConfig = (rootConfig: any) => {
        console.log('Upgrading profile: ', rootConfig);
        rootConfig.settings.portSettings.allowSettingsChangesWhenOpen = false;
        rootConfig.settings.displaySettings.terminalHeightMode = TerminalHeightMode.AUTO_HEIGHT;
        rootConfig.settings.displaySettings.terminalHeightChars = 25;
      }
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        upgradeRootConfig(updatedAppData.profiles[i].rootConfig);
      }
      upgradeRootConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 2;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 2 -> VERSION 3
    //=============================================================================
    if (updatedAppData.version === 2) {
      console.log('Updating app data from version 2 to version 3...');
      let updateRootConfig = (rootConfig: any) => {
        // Add timestamp settings
        rootConfig.settings.rxSettings.addTimestamps = false;
        rootConfig.settings.rxSettings.timestampFormat = TimestampFormat.ISO8601_WITHOUT_TIMEZONE;
        rootConfig.settings.rxSettings.customTimestampFormatString = "YYYY-MM-DD HH:mm:ss.SSS ";
        // Display settings got new color fields
        rootConfig.settings.displaySettings.defaultBackgroundColor = DEFAULT_BACKGROUND_COLOR;
        rootConfig.settings.displaySettings.defaultTxTextColor = DEFAULT_TX_COLOR;
        rootConfig.settings.displaySettings.defaultRxTextColor = DEFAULT_RX_COLOR;
        // Display settings got a new tab stop width field
        rootConfig.settings.displaySettings.tabStopWidth = 8;
        // Display settings gets the new autoScrollLockOnTx field
        rootConfig.settings.displaySettings.autoScrollLockOnTx = true;

        // Remove version for a number of objects as we are now just using the single
        // "app version" in the root data class
        delete rootConfig.settings.rxSettings.version;
        delete rootConfig.terminal.macroController.version;
        delete rootConfig.settings.displaySettings.version;
        delete rootConfig.settings.txSettings.version;
      }
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        updateRootConfig(updatedAppData.profiles[i].rootConfig);
      }
      updateRootConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 3;
      wasChanged = true;
    }

    if (updatedAppData.version === 3) {
      // Nothing to do, already latest version
      console.log(`App data is at latest version (v${updatedAppData.version}).`);
    }

    if (updatedAppData.version !== 3) {
      console.error('Unknown app data version found: ', appData.version);
      updatedAppData = new AppData();
      wasChanged = true;
    }

    return { appData: updatedAppData, wasChanged };
  }

  /**
   * Save the current app configuration to local storage.
   */
  saveAppData = () => {
    console.log('Saving app data. appData: ', this.appData);
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
    const profileSerialPortInfoJson = JSON.stringify(profile.rootConfig.lastUsedSerialPort.serialPortInfo);
    const currentSerialPortInfoJson = JSON.stringify(this.appData.currentAppConfig.lastUsedSerialPort.serialPortInfo);

    let weNeedToConnect = false;
    let matchedAvailablePorts: SerialPort[] = [];
    let snackbarMessage = `Profile "${profile.name}" loaded.`;
    let snackbarVariant: VariantType = 'success';
    if (profileSerialPortInfoJson == '{}') {
      weNeedToConnect = false;
    } else if (profileSerialPortInfoJson === currentSerialPortInfoJson) {
      // Same serial port, no need to disconnect and connect
      // Note there is a chance we are not connected to the right one due to
      // ambiguity...but if already connected it is a better user experience to
      // not disconnect on the high chance it is the correct port
      weNeedToConnect = false;
      snackbarMessage += '\nAlready connected port matches one specified in profile. Leaving port connected.';
    } else {
      // They are both different and the profile one is non-empty. Check to see if the profile ports is available
      console.log('Port infos are both different and non-empty. Checking if ports are available...');
      const availablePorts = await navigator.serial.getPorts();
      matchedAvailablePorts = availablePorts.filter((port) => JSON.stringify(port.getInfo()) === profileSerialPortInfoJson);

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
      if (this.app.portState === PortState.OPENED) {
        await this.app.closePort({ silenceSnackbar: true });
      } else if (this.app.portState === PortState.CLOSED_BUT_WILL_REOPEN) {
        this.app.stopWaitingToReopenPort();
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
      this.app.setSelectedPort(matchedAvailablePorts[0]);
      await this.app.openPort({ silenceSnackbar: true });
      snackbarMessage += '\nConnected to port with info: "' + profileSerialPortInfoJson + '".';
    }

    // Post message to snackbar
    this.app.snackbar.sendToSnackbar(snackbarMessage, snackbarVariant);
  };

  /**
   * Save the current app config to the provided profile and the save the profiles to local storage.
   * @param profileIdx The index of the profile to save the current app config to.
   */
  saveCurrentAppConfigToProfile = (profileIdx: number, noSnackbar = false) => {
    console.log('Saving current app config to profile...');
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
