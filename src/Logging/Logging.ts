import { makeAutoObservable } from "mobx";

import { App } from 'src/App';

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

  constructor(app: App) {
    this.app = app;

    makeAutoObservable(this);
  }

  async openDirPicker() {
    try {
      this.dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // User canceled the picker
        return;
      }
    }
  }

  async startLogging() {
    if (this.dirHandle === null) {
      throw Error('startLogging() called but dirHandle is null');
    }

    // Create file with name based on current datetime
    // In this new directory, create a file named "My Notes.txt".
    this.fileHandle = await this.dirHandle.getFileHandle('test.txt', { create: true });

    this.isLogging = true;

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

    this.isLogging = false;
  }
}
