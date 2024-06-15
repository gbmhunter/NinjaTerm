import { makeAutoObservable } from 'mobx';

import { DisplaySettingsConfig } from '../Settings/DisplaySettings/DisplaySettings';
import { GeneralSettingsConfig } from '../Settings/GeneralSettings/GeneralSettings';
import { PortConfigurationConfig, PortState } from '../Settings/PortConfigurationSettings/PortConfigurationSettings';
import { RxSettingsConfig } from '../Settings/RxSettings/RxSettings';
import { TxSettingsConfig } from '../Settings/TxSettings/TxSettings';
import { MacroControllerConfig } from '../Terminals/RightDrawer/Macros/MacroController';
import { App } from '../App';
import { VariantType } from 'notistack';
import { RightDrawerConfig } from '../Terminals/RightDrawer/RightDrawer';

export class LastUsedSerialPort {
  serialPortInfo: Partial<SerialPortInfo> = {};
  portState: PortState = PortState.CLOSED;
}

/**
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class RootConfig {
  version = 2;

  terminal = {
    macroController: new MacroControllerConfig(),
    rightDrawer: new RightDrawerConfig(),
  };

  lastUsedSerialPort: LastUsedSerialPort = new LastUsedSerialPort();

  settings = {
    portSettings: new PortConfigurationConfig(),
    txSettings: new TxSettingsConfig(),
    rxSettings: new RxSettingsConfig(),
    displaySettings: new DisplaySettingsConfig(),
    generalSettings: new GeneralSettingsConfig(),
  };
}

/**
 * This class represents all the data stored in a user profile. It is used to store use-specific
 * settings for the application (e.g. all the settings to talk to a particular
 * embedded device). The class is serializable to JSON.
 */
export class Profile {
  name: string = '';
  rootConfig: RootConfig = new RootConfig();

  constructor(name: string) {
    this.name = name;
    makeAutoObservable(this);
  }
}

/**
 * This class represents all the data that the app needs to store/load from
 * local storage (i.e. the root object). It must be serializable to JSON.
 */
export class AppData {

  version = 1;

  profiles: Profile[] = [];

  /**
   * Represents the current application configuration. This is saved regularly so that when the app reloads,
   * it can restore the last known configuration.
   */
  currentAppConfig: RootConfig = new RootConfig();

  constructor() {
    makeAutoObservable(this);
  }
}

const APP_DATA_STORAGE_KEY = 'appData';

export class ProfileManager {
  app: App;

  appData: AppData = new AppData();

  _profileChangeCallbacks: (() => void)[] = [];

  /**
   * Represents the name of the last profile that was applied to the app. Used for displaying
   * in various places such as the toolbar.
   */
  lastAppliedProfileName: string = 'No profile';

  constructor(app: App) {
    this.app = app;

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
      console.log('App data not found in local storage. Creating default app data.');
      appData = new AppData();
      appData.profiles = [];
      appData.profiles.push(new Profile('Default profile'));
      // Save just-created config back to store.
      window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData));
    } else {
      // A version of app data was found in local storage. Load it.
      let appDataUnknownVersion = JSON.parse(appDataAsJson);
      if (appDataUnknownVersion.version == 1) {
        // Latest version, don't need to convert anything
        // or save it back
        appData = appDataUnknownVersion;
      } else {
        console.error('Unknown app data version found: ', appDataUnknownVersion.version);
        appData = new AppData();
        appData.profiles = [];
        appData.profiles.push(new Profile('Default profile'));
        // Save just-created config back to store.
        window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData));
      }
    }

    // Load data into class
    this.appData = appData;
  };

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
      console.log('Setting selected port...', matchedAvailablePorts[0]);
      this.app.setSelectedPort(matchedAvailablePorts[0]);
      console.log('Opening port...');
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

    // Post message to snackbar
    if (!noSnackbar) {
      this.app.snackbar.sendToSnackbar('Profile "' + profile.name + '" saved.', 'success');
    }
  };
}
