import { makeAutoObservable } from "mobx";

import { App } from 'src/App';

export default class Logging {
  app: App;

  /**
   * If dirHandle is null, then directory permissions have not been granted yet.
   */
  dirHandle: FileSystemDirectoryHandle | null = null;

  isLogging = false;

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

  startLogging() {
    if (this.dirHandle === null) {
      throw Error('startLogging() called but dirHandle is null');
    }

    // Create file with name based on current datetime

    this.isLogging = true;
  }

  stopLogging() {
    this.isLogging = false;
  }
}
