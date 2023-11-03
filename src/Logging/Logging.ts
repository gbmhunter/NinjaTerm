import { makeAutoObservable, runInAction } from "mobx";
import * as Validator from 'validatorjs';

import en from 'validatorjs/src/lang/en';

Validator.setMessages('en', en);

import { App } from 'src/App';
import BorderedSection from "src/Components/BorderedSection";

class ApplyableTextField {
  dispValue: string;
  rule: string | string[];
  appliedValue: string;

  isValid = false;
  friendlyName = '';
  errorMsg = '';

  constructor(dispValue: string, rules: string | string[], friendlyName: string) {
    this.rule = rules;
    this.dispValue = '';
    this.appliedValue = '';
    this.friendlyName = friendlyName;
    this.setDispValue(dispValue);
    this.apply();
    makeAutoObservable(this);
  }

  setDispValue = (value: string) => {
    this.dispValue = value;
    const validator = new Validator(
      {var: value},
      {var: this.rule}
    );
    validator.setAttributeNames({ var: this.friendlyName });
    this.isValid = !validator.fails();
    if (this.isValid) {
      this.errorMsg = '';
    } else {
      this.errorMsg = validator.errors.first('var');
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
    ['required', 'regex:/^[\\w,\\s\.-]+$/'],
    'file name',
  );

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

  async startLogging() {
    if (this.dirHandle === null) {
      throw Error('startLogging() called but dirHandle is null');
    }

    // Create file with name based on current datetime
    // In this new directory, create a file named "My Notes.txt".
    const fileHandle = await this.dirHandle.getFileHandle('test.txt', { create: true });

    runInAction(() => {
      this.fileHandle = fileHandle;
      this.isLogging = true;
    });

    this.intervalId = setInterval(() => {
      this.writeBufferedDataToDisk();
    }, 1000);
  }

  parseData(rxData: Uint8Array) {
    // Only buffer data if logging is enabled
    if (this.isLogging === false) {
      return;
    }

    this.bufferedData.push(...rxData);
  }

  async writeBufferedDataToDisk() {
    console.log('writeBufferedDataToDisk() called.');
    // Create a FileSystemWritableFileStream to write to.
    const writeable = await this.fileHandle!.createWritable({ keepExistingData: true });

    // Seek to the end of the file, to append data rather than overwrite existing stuff
    let offset = (await this.fileHandle!.getFile()).size
    writeable.seek(offset)

    // Write the contents of the file to the stream.
    await writeable.write(new Uint8Array(this.bufferedData));

    // Clear the buffer
    this.bufferedData = [];

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
    });
  }
}
