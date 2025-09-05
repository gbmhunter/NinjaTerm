import { WhatToNameTheFile, ExistingFileBehaviors } from '../../Logging/Logging';

/**
 * Contains all logging-related settings that are stored per profile.
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class LogSettingsData {
  /**
   * Directory path for storing log files. If null, will use the default directory.
   * This is stored per-profile so different profiles can have different log directories.
   */
  logDirectory: string | null = null;

  /**
   * What naming scheme to use for log files.
   */
  whatToNameTheFile: WhatToNameTheFile = WhatToNameTheFile.CURRENT_DATETIME;

  /**
   * Custom filename to use when whatToNameTheFile is set to CUSTOM.
   * Stored as a simple string (the ApplyableTextField will be reconstructed in the Logging class).
   */
  customFileName: string = 'custom-file-name.log';

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
}