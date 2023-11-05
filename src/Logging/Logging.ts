import { makeAutoObservable, runInAction } from "mobx";
import { ZodString, z } from "zod";

import { App } from 'src/App';
import BorderedSection from "src/Components/BorderedSection";

class ApplyableTextField {
  dispValue: string;
  schema: ZodString;
  appliedValue: string;

  isValid = false;
  friendlyName = '';
  errorMsg = '';

  constructor(dispValue: string, schema: ZodString) {
    this.schema = schema;
    this.dispValue = '';
    this.appliedValue = '';
    this.setDispValue(dispValue);
    this.apply();
    makeAutoObservable(this);
  }

  setDispValue = (value: string) => {
    this.dispValue = value;
    const validation = this.schema.safeParse(this.dispValue);
    this.isValid = validation.success;
    console.log(validation);
    if (validation.success) {
      this.errorMsg = '';
    } else {
      this.errorMsg = validation.error.errors[0].message;
    }
  }

  apply() {
    if (this.isValid) {
      this.appliedValue = this.dispValue;
    }
  }
}

export enum WhatToNameTheFile {
  CURRENT_DATETIME,
  CUSTOM,
}

export enum ExistingFileBehaviors {
  APPEND,
  OVERWRITE,
}

/**
 * Ths class used the PWA directory/file API. Best resource for info is
 * https://developer.chrome.com/articles/file-system-access/#stored-file-or-directory-handles-and-permissions
 */
export default class Logging {
  app: App;

  /**
   * If dirHandle is null, then directory permissions have not been granted yet.
   */
  dirHandle: FileSystemDirectoryHandle | null = null;

  fileHandle: FileSystemFileHandle | null = null;

  isLogging = false;

  intervalId: NodeJS.Timer | null = null;

  /**
   * Stored data to be written to the file, until the next file write
   * is scheduled
   */
  bufferedData: number[] = [];

  whatToNameTheFile = WhatToNameTheFile.CURRENT_DATETIME;

  customFileName = new ApplyableTextField(
    'custom-file-name.log',
    z.string().min(1).regex(new RegExp(/^[\w,\s\.-]+$/), 'Filename should contain only alphanumeric characters, spaces, periods, and dashes.'),
  );

  existingFileBehavior = ExistingFileBehaviors.APPEND;

  activeFilename: string | null = null;

  numBytesWritten: number | null = null;

  fileSizeBytes: number | null = null;

  logRawTxData = false;

  logRawRxData = true;

  constructor(app: App) {
    this.app = app;

    makeAutoObservable(this);
  }

  /**
   * Opens a dir picker provided by the browser to the user can select a directory
   * to save logs to.
   *
   * @returns
   */
  async openDirPicker() {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      runInAction(() => {
        this.dirHandle = dirHandle;
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // User canceled the picker
        return;
      }
    }
  }

  setWhatToNameTheFile(value: WhatToNameTheFile) {
    this.whatToNameTheFile = value;
  }

  setExistingFileBehavior(value: ExistingFileBehaviors) {
    this.existingFileBehavior = value;
  }

  setLogRawTxData(value: boolean) {
    this.logRawTxData = value;
  }

  setLogRawRxData(value: boolean) {
    this.logRawRxData = value;
  }

  get canStartStopLogging() {
    return this.dirHandle !== null && (this.whatToNameTheFile === WhatToNameTheFile.CUSTOM ? this.customFileName.isValid : true);
  }

  async startLogging() {
    if (this.dirHandle === null) {
      throw Error('startLogging() called but dirHandle is null');
    }

    if (this.whatToNameTheFile === WhatToNameTheFile.CURRENT_DATETIME) {
      // Generate a file name based on the current datetime
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const date = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      this.activeFilename = `NinjaTerm Logs - ${year}-${month}-${date} ${hours}-${minutes}-${seconds}.txt`;
    } else if (this.whatToNameTheFile === WhatToNameTheFile.CUSTOM) {
      this.activeFilename = this.customFileName.appliedValue;
    } else {
      throw Error('Unknown value for whatToNameTheFile');
    }

    // Create file in the directory we have be allowed to read/write to
    const fileHandle = await this.dirHandle.getFileHandle(this.activeFilename, { create: true });

    if (this.existingFileBehavior === ExistingFileBehaviors.APPEND) {
      // Do nothing, the interval will append data anyway
    } else if (this.existingFileBehavior === ExistingFileBehaviors.OVERWRITE) {
      // Clear the file by creating a new writable stream with keepExistingData set to false
      // (but don't actually write anything to it)
      const writeable = await fileHandle.createWritable({ keepExistingData: false });
      // await writeable.write(Uint8Array.from([ 0x21, 0x21, 0x21 ]));
      await writeable.close();
    } else {
      throw Error('Unknown value for existingFileBehavior');
    }

    const fileSizeBytes = (await fileHandle!.getFile()).size;

    runInAction(() => {
      this.fileHandle = fileHandle;
      this.isLogging = true;
      this.numBytesWritten = 0;
      this.fileSizeBytes = fileSizeBytes;
    });

    // Setup regular 1s interval to write buffered data
    // to this file
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
    // Create a FileSystemWritableFileStream to write to.
    const writeable = await this.fileHandle!.createWritable({ keepExistingData: true });

    // Seek to the end of the file, to append data rather than overwrite existing stuff
    // from the last time this function was called
    let offset = (await this.fileHandle!.getFile()).size
    writeable.seek(offset)

    const dataAsUint8Array = new Uint8Array(this.bufferedData)

    // Write the contents of the file to the stream.
    await writeable.write(dataAsUint8Array);

    runInAction(() => {
      this.numBytesWritten! += dataAsUint8Array.length;
      this.fileSizeBytes! += dataAsUint8Array.length;
      // Clear the buffer
      this.bufferedData = [];
    });

    // Close the file and write the contents to disk.
    await writeable.close();
  }

  async stopLogging() {
    // Stop the repeated writing to disk of buffered data in the future
    clearInterval(this.intervalId!);

    // Write the last of the buffered data to disk
    await this.writeBufferedDataToDisk();

    runInAction(() => {
      this.isLogging = false;
      this.activeFilename = null;
      this.numBytesWritten = null;
      this.fileSizeBytes = null;
    });
  }
}
