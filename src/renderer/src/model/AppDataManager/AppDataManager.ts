import { makeAutoObservable } from 'mobx';
import { VariantType } from 'notistack';
import { PortInfo } from '@serialport/bindings-interface';

import { ConnState, ConnectionType, PortSettings } from '../Settings/PortSettings/PortSettings';
import { App } from '../App';
import { AppData } from './DataClasses/AppData';
import { Profile } from './DataClasses/Profile';
import DisplaySettings, { TerminalHeightMode } from '../Settings/DisplaySettings/DisplaySettings';
import { TimestampFormat } from '../Settings/RxSettings/RxSettings';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_TX_COLOR, DEFAULT_RX_COLOR } from './DataClasses/DisplaySettingsData';
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
      log.info('Updating app data from version 1 to version 2...');
      // Convert to v2
      // Port settings got a new field, display settings got two new fields
      let upgradeRootConfig = (rootConfig: any) => {
        log.info('Upgrading profile: ', rootConfig);
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
      log.info('Updating app data from version 2 to version 3...');
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

    //=============================================================================
    // VERSION 3 -> VERSION 4
    //=============================================================================
    if (updatedAppData.version === 3) {
      log.info('Updating app data from version 3 to version 4...');
      // Add auto-updates setting to app data (global setting, not per profile)
      updatedAppData.autoUpdatesEnabled = true;

      // We switched from using Web Serial to the node serialport library here. Now we can get the actual path of
      // the serial port and we use that as the ID.
      // This updates to the new ID format, but will lose all users last used serial port info
      // (this is ok)
      // Need to set lastUsedSerialPort":{"path":"","portState":0}
      let updateProfileConfig = (rootConfig: any) => {
        rootConfig.lastUsedSerialPort = { path: '', portState: ConnState.CLOSED };
        // Add graphing settings to each profile
        rootConfig.settings.graphingSettings = {
          graphingEnabled: false,
          processingTrigger: 'LF (\\n)',
          maxBufferSize: '1000',
          maxNumDataPoints: '500',
          xVarSource: 'Received Time',
          xVarPrefix: 'x=',
          yVarPrefix: 'y=',
          multipleValuesPerBuffer: false,
          valueSeparator: 'Comma (,)',
          customValueSeparator: ',',
          clearPlotOnNewValues: true,
          xAxisRangeMode: 'Auto',
          xAxisRangeMin: '0',
          xAxisRangeMax: '100',
          yAxisRangeMode: 'Auto',
          yAxisRangeMin: '0',
          yAxisRangeMax: '100',
          xVarUnit: 's',
          detectionMode: 'Basic Prefix Mode'
        };
      }
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        updateProfileConfig(updatedAppData.profiles[i].rootConfig);
      }
      updateProfileConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 4;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 4 -> VERSION 5
    //=============================================================================
    if (updatedAppData.version === 4) {
      log.info('Updating app data from version 4 to version 5...');
      // Add detection mode to graphing settings for all profiles
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        const graphingSettings = updatedAppData.profiles[i].rootConfig.settings.graphingSettings;
        if (graphingSettings && !graphingSettings.detectionMode) {
          graphingSettings.detectionMode = 'Basic Prefix Mode';
        }
      }
      updatedAppData.version = 5;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 5 -> VERSION 6
    //=============================================================================
    if (updatedAppData.version === 5) {
      log.info('Updating app data from version 5 to version 6...');
      // Rename bufferDelimiter to processingTrigger in graphing settings for all profiles
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        const graphingSettings = updatedAppData.profiles[i].rootConfig.settings.graphingSettings;
        if (graphingSettings && graphingSettings.bufferDelimiter !== undefined) {
          graphingSettings.processingTrigger = graphingSettings.bufferDelimiter;
          delete graphingSettings.bufferDelimiter;
        }
      }
      // Also update current app config
      const currentGraphingSettings = updatedAppData.currentAppConfig.settings.graphingSettings;
      if (currentGraphingSettings && currentGraphingSettings.bufferDelimiter !== undefined) {
        currentGraphingSettings.processingTrigger = currentGraphingSettings.bufferDelimiter;
        delete currentGraphingSettings.bufferDelimiter;
      }
      updatedAppData.version = 6;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 6 -> VERSION 7
    //=============================================================================
    if (updatedAppData.version === 6) {
      log.info('Updating app data from version 6 to version 7...');
      // Add flow control settings to app data
      let updateProfileConfig = (rootConfig: any) => {
        rootConfig.terminal.rightDrawer.flowControlIsExpanded = true;
      }
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        updateProfileConfig(updatedAppData.profiles[i].rootConfig);
      }
      updateProfileConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 7;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 7 -> VERSION 8
    //=============================================================================
    if (updatedAppData.version === 7) {
      log.info('Updating app data from version 7 to version 8...');
      // Add new flow control parameters and remove old flowControl property
      let updateProfileConfig = (rootConfig: any) => {
        // Remove the old flowControl property
        if (rootConfig.settings.portSettings.flowControl !== undefined) {
          delete rootConfig.settings.portSettings.flowControl;
        }

        // Add new flow control parameters with defaults if not present
        if (rootConfig.settings.portSettings.rtscts === undefined) {
          rootConfig.settings.portSettings.rtscts = false;
        }
        if (rootConfig.settings.portSettings.xon === undefined) {
          rootConfig.settings.portSettings.xon = false;
        }
        if (rootConfig.settings.portSettings.xoff === undefined) {
          rootConfig.settings.portSettings.xoff = false;
        }
        if (rootConfig.settings.portSettings.xany === undefined) {
          rootConfig.settings.portSettings.xany = false;
        }
        if (rootConfig.settings.portSettings.hupcl === undefined) {
          rootConfig.settings.portSettings.hupcl = true; // defaults to true
        }
      }
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        updateProfileConfig(updatedAppData.profiles[i].rootConfig);
      }
      updateProfileConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 8;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 8 -> VERSION 9
    //=============================================================================
    if (updatedAppData.version === 8) {
      log.info('Updating app data from version 8 to version 9...');
      // Create new logSettings structure and move any existing log directory
      let updateProfileConfig = (rootConfig: any) => {
        // Create the new logSettings object with defaults
        const logSettings = {
          logDirectory: null, // No existing logDirectory to migrate from version 8
          whatToNameTheFile: 0, // WhatToNameTheFile.CURRENT_DATETIME
          customFileName: 'custom-file-name.log',
          existingFileBehavior: 0, // ExistingFileBehaviors.APPEND
          logRawTxData: false,
          logRawRxData: true
        };

        // Add the new logSettings to settings
        rootConfig.settings.logSettings = logSettings;
      }
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        updateProfileConfig(updatedAppData.profiles[i].rootConfig);
      }
      updateProfileConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 9;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 9 -> VERSION 10
    //=============================================================================
    if (updatedAppData.version === 9) {
      log.info('Updating app data from version 9 to version 10...');
      // Add socket connection settings to port configuration
      let updateProfileConfig = (rootConfig: any) => {
        rootConfig.settings.portSettings.connectionType = ConnectionType.SERIAL_PORT;
        rootConfig.settings.portSettings.socketHost = '127.0.0.1';
        rootConfig.settings.portSettings.socketPort = 5000;
        rootConfig.settings.portSettings.socketConnTimeoutMs = PortSettings.SOCKET_CONN_TIMEOUT_DEFAULT_MS;
      }
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        updateProfileConfig(updatedAppData.profiles[i].rootConfig);
      }
      updateProfileConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 10;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 10 -> VERSION 11
    //=============================================================================
    if (updatedAppData.version === 10) {
      log.info('Updating app data from version 10 to version 11...');
      // Add tooltip settings to display settings for all profiles
      let updateProfileConfig = (rootConfig: any) => {
        rootConfig.settings.displaySettings.tooltipsEnabled = DisplaySettings.DEFAULT_TOOLTIPS_ENABLED;
        rootConfig.settings.displaySettings.tooltipDelayMs = DisplaySettings.DEFAULT_TOOLTIP_DELAY_MS;
      }
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        updateProfileConfig(updatedAppData.profiles[i].rootConfig);
      }
      updateProfileConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 11;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 11 -> VERSION 12
    //=============================================================================
    // Sound settings were added for the first time in this version.
    if (updatedAppData.version === 11) {
      log.info('Updating app data from version 11 to version 12...');
      // Add sounds settings to settings for all profiles
      let updateProfileConfig = (rootConfig: any) => {
        rootConfig.settings.soundsSettings = {
          playSoundsOnPassFail: false
        };
      }
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        updateProfileConfig(updatedAppData.profiles[i].rootConfig);
      }
      updateProfileConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 12;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 12 -> VERSION 13
    //=============================================================================
    if (updatedAppData.version === 12) {
      log.info('Updating app data from version 12 to version 13...');
      // Add useCtrlCVForCopyPaste to tx settings for all profiles
      let updateProfileConfig = (rootConfig: any) => {
        rootConfig.settings.txSettings.useCtrlCVForCopyPaste = true;
      }
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        updateProfileConfig(updatedAppData.profiles[i].rootConfig);
      }
      updateProfileConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 13;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 13 -> VERSION 14
    //=============================================================================
    if (updatedAppData.version === 13) {
      log.info('Updating app data from version 13 to version 14...');
      // Add MCP server settings at the global app level
      updatedAppData.mcpEnabled = false;
      updatedAppData.mcpPort = 3579;
      updatedAppData.version = 14;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 14 -> VERSION 15
    //=============================================================================
    if (updatedAppData.version === 14) {
      log.info('Updating app data from version 14 to version 15...');
      // Add Segger RTT settings to port configuration
      const updateProfileConfig = (rootConfig: any) => {
        rootConfig.settings.portSettings.rttDevice = '';
        rootConfig.settings.portSettings.rttInterface = 'SWD';
        rootConfig.settings.portSettings.rttSpeedKHz = 4000;
        rootConfig.settings.portSettings.rttServerExePath = '';
        rootConfig.settings.portSettings.rttJLinkSerialNumber = '';
        rootConfig.settings.portSettings.rttChannel = 0;
        rootConfig.settings.portSettings.rttRecentDevices = [];
      };
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        updateProfileConfig(updatedAppData.profiles[i].rootConfig);
      }
      updateProfileConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 15;
      wasChanged = true;
    }

    //=============================================================================
    // VERSION 15 -> VERSION 16
    //=============================================================================
    if (updatedAppData.version === 15) {
      log.info('Updating app data from version 15 to version 16...');
      // Track whether the user has explicitly modified the J-Link Commander path so the
      // RTT pane's auto-detect on first navigation never overwrites a deliberate change.
      const updateProfileConfig = (rootConfig: any) => {
        rootConfig.settings.portSettings.rttServerExePathUserModified = false;
      };
      for (let i = 0; i < updatedAppData.profiles.length; i++) {
        updateProfileConfig(updatedAppData.profiles[i].rootConfig);
      }
      updateProfileConfig(updatedAppData.currentAppConfig);
      updatedAppData.version = 16;
      wasChanged = true;
    }

    if (updatedAppData.version !== 16) {
      log.error('Unknown app data version found: ', appData.version);
      updatedAppData = new AppData();
      wasChanged = true;
    }

    log.info('Updated app data to latest version.');
    return { appData: updatedAppData, wasChanged };
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
