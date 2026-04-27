import { makeAutoObservable, runInAction, toJS } from 'mobx';
import { z } from 'zod';

import { App } from 'src/model/App';
import { ApplyableTextField } from 'src/view/Components/ApplyableTextField';

export enum WhatToNameTheFile {
  CURRENT_DATETIME,
  CUSTOM,
}

export enum ExistingFileBehaviors {
  APPEND,
  OVERWRITE,
}

/**
 * This class uses Electron's native file system API for logging functionality.
 */
export default class Logging {
  app: App;

  /**
   * If dirPath is null, then no directory has been selected yet.
   */
  dirPath: string | null = null;

  /**
   * Full path to the active log file when logging is in progress.
   */
  activeFilePath: string | null = null;

  isLogging = false;

  intervalId: NodeJS.Timeout | null = null;

  /**
   * Stored data to be written to the file, until the next file write
   * is scheduled
   */
  bufferedData: number[] = [];

  /**
   * ApplyableTextField for custom filename. Initialized from profile data.
   */
  customFileName!: ApplyableTextField;

  /**
   * What naming scheme to use for log files. This is a cached observable copy
   * of the value stored in the profile.
   */
  whatToNameTheFile: WhatToNameTheFile = WhatToNameTheFile.CURRENT_DATETIME;

  /**
   * How to handle existing files when logging is started.
   */
  existingFileBehavior: ExistingFileBehaviors = ExistingFileBehaviors.APPEND;

  /**
   * Whether to log raw transmitted data to the log file.
   */
  logRawTxData: boolean = false;

  /**
   * Whether to log raw received data to the log file.
   */
  logRawRxData: boolean = true;

  activeFilename: string | null = null;

  numBytesWritten: number | null = null;

  fileSizeBytes: number | null = null;

  constructor(app: App) {
    this.app = app;

    makeAutoObservable(this);

    // Initialize logging settings from profile
    this.initializeFromProfile();

    // Register for profile changes to update log directory when profiles are switched
    this.app.profileManager.registerOnProfileLoad(() => {
      this.onProfileChanged();
    });
  }

  /**
   * Initializes all logging settings from the current profile config.
   */
  private async initializeFromProfile() {
    try {
      const logSettings = this.app.profileManager.appData.currentAppConfig.settings.logSettings;

      // Initialize all logging properties from profile
      runInAction(() => {
        this.whatToNameTheFile = logSettings.whatToNameTheFile;
        this.existingFileBehavior = logSettings.existingFileBehavior;
        this.logRawTxData = logSettings.logRawTxData;
        this.logRawRxData = logSettings.logRawRxData;
      });

      // Initialize the ApplyableTextField for custom filename
      this.customFileName = new ApplyableTextField(
        logSettings.customFileName,
        z.string().min(1).regex(new RegExp(/^[\w,\s.-]+$/), 'Filename should contain only alphanumeric characters, spaces, periods, and dashes.'),
      );

      // Set up a listener to save custom filename changes back to profile
      this.customFileName.setOnApplyChanged(() => {
        this.saveSettingsToProfile();
      });

      // Initialize log directory
      if (logSettings.logDirectory) {
        // Use the directory from the profile
        runInAction(() => {
          this.dirPath = logSettings.logDirectory!;
        });
      } else {
        // No directory set in profile, use and save the default
        const result = await window.electronAPI.fs.getDefaultLogDirectory();
        if (result.success && result.path) {
          runInAction(() => {
            this.dirPath = result.path!;
          });
          // Save the default directory to the profile so it's remembered
          this.saveSettingsToProfile();
        }
      }
    } catch (error) {
      console.error('Failed to initialize logging settings from profile:', error);
    }
  }

  /**
   * Opens Electron's native directory picker to select a directory to save logs to.
   * The selected directory is saved to the current profile.
   */
  async openDirPicker() {
    try {
      const result = await window.electronAPI.fs.selectDirectory();

      if (result.success && result.path) {
        runInAction(() => {
          this.dirPath = result.path!;
        });
        // Save all settings to the current profile
        this.saveSettingsToProfile();
      }
      // If canceled, result.canceled will be true, but we don't need to handle it
    } catch (e) {
      console.error('Failed to open directory picker:', e);
    }
  }

  setWhatToNameTheFile(value: WhatToNameTheFile) {
    this.whatToNameTheFile = value;
    this.saveSettingsToProfile();
  }

  setExistingFileBehavior(value: ExistingFileBehaviors) {
    this.existingFileBehavior = value;
    this.saveSettingsToProfile();
  }

  setLogRawTxData(value: boolean) {
    this.logRawTxData = value;
    this.saveSettingsToProfile();
  }

  setLogRawRxData(value: boolean) {
    this.logRawRxData = value;
    this.saveSettingsToProfile();
  }

  get canStartStopLogging() {
    return this.dirPath !== null && (this.whatToNameTheFile === WhatToNameTheFile.CUSTOM ? this.customFileName.isValid : true);
  }

  async startLogging() {
    if (this.dirPath === null) {
      throw Error('startLogging() called but dirPath is null');
    }

    const fileNamingMode = this.whatToNameTheFile;

    if (fileNamingMode === WhatToNameTheFile.CURRENT_DATETIME) {
      // Generate a file name based on the current datetime
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const date = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      this.activeFilename = `NinjaTerm Logs - ${year}-${month}-${date} ${hours}-${minutes}-${seconds}.txt`;
    } else if (fileNamingMode === WhatToNameTheFile.CUSTOM) {
      this.activeFilename = this.customFileName.appliedValue;
    } else {
      throw Error(`Unknown value for whatToNameTheFile: ${fileNamingMode} (type: ${typeof fileNamingMode})`);
    }

    // Create full file path
    this.activeFilePath = `${this.dirPath}/${this.activeFilename}`;

    let fileSizeBytes = 0;

    // Handle existing file behavior
    const fileBehavior = this.existingFileBehavior;
    if (fileBehavior === ExistingFileBehaviors.APPEND) {
      // Check if file exists and get its size
      const fileExistsResult = await window.electronAPI.fs.fileExists(this.activeFilePath);
      if (fileExistsResult.success && fileExistsResult.exists) {
        const fileSizeResult = await window.electronAPI.fs.getFileSize(this.activeFilePath);
        if (fileSizeResult.success) {
          fileSizeBytes = fileSizeResult.size!;
        }
      }
    } else if (fileBehavior === ExistingFileBehaviors.OVERWRITE) {
      // Overwrite by writing empty content to the file
      await window.electronAPI.fs.writeFile(this.activeFilePath, [], false);
    } else {
      throw Error(`Unknown value for existingFileBehavior: ${fileBehavior} (type: ${typeof fileBehavior})`);
    }

    runInAction(() => {
      this.isLogging = true;
      this.numBytesWritten = 0;
      this.fileSizeBytes = fileSizeBytes;
    });

    // Setup regular 1s interval to write buffered data to this file
    this.intervalId = setInterval(() => {
      this.writeBufferedDataToDisk();
    }, 1000);
  }

  handleRxData(rxData: Uint8Array) {
    // Only buffer data if logging is enabled AND user has enabled logging of RX data
    if (this.isLogging === false || this.logRawRxData === false) {
      return;
    }
    this.bufferedData.push(...rxData);
  }

  handleTxData(txData: Uint8Array) {
    // Only buffer data if logging is enabled AND user has enabled logging of TX data
    if (this.isLogging === false || this.logRawTxData === false) {
      return;
    }
    this.bufferedData.push(...txData);
  }

  async writeBufferedDataToDisk() {
    if (this.activeFilePath === null || this.bufferedData.length === 0) {
      return;
    }

    try {
      // Write the buffered data to the file (append mode)
      const result = await window.electronAPI.fs.writeFile(
        this.activeFilePath,
        toJS(this.bufferedData), // Convert Mobx to plain JS array for serialization
        true);

      if (result.success) {
        runInAction(() => {
          this.numBytesWritten! += this.bufferedData.length;
          this.fileSizeBytes! += this.bufferedData.length;
          // Clear the buffer
          this.bufferedData = [];
        });
      } else {
        console.error('Failed to write to log file:', result.error);
        this.app.snackbar.sendToSnackbar(`Failed to write to log file: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error writing buffered data to disk:', error);
      this.app.snackbar.sendToSnackbar(`Error writing to log file: ${error}`, 'error');
    }
  }

  async stopLogging() {
    // Stop the repeated writing to disk of buffered data in the future
    clearInterval(this.intervalId!);

    // Write the last of the buffered data to disk
    await this.writeBufferedDataToDisk();

    runInAction(() => {
      this.isLogging = false;
      this.activeFilename = null;
      this.activeFilePath = null;
      this.numBytesWritten = null;
      this.fileSizeBytes = null;
    });
  }

  /**
   * Called when a profile is changed/loaded. Updates all logging settings from the new profile.
   */
  private async onProfileChanged() {
    // Don't change settings if currently logging, as this could cause issues
    if (this.isLogging) {
      console.log('Profile changed while logging is active. Logging settings will not be changed.');
      return;
    }

    // Reinitialize all settings from the new profile
    await this.initializeFromProfile();
  }

  /**
   * Saves all logging settings to the current profile config.
   */
  private saveSettingsToProfile() {
    const logSettings = this.app.profileManager.appData.currentAppConfig.settings.logSettings;

    // Update all logging settings
    logSettings.logDirectory = this.dirPath;
    logSettings.whatToNameTheFile = this.whatToNameTheFile;
    logSettings.existingFileBehavior = this.existingFileBehavior;
    logSettings.logRawTxData = this.logRawTxData;
    logSettings.logRawRxData = this.logRawRxData;
    logSettings.customFileName = this.customFileName.appliedValue;

    // Save to storage
    this.app.profileManager.saveAppData();
  }
}
