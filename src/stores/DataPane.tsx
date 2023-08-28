import { makeAutoObservable } from 'mobx';

export default class DataPane {
  // If true, the data pane scroll will be locked at the bottom
  scrollLock = true;

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  setScrollLock(trueFalse: boolean) {
    this.scrollLock = trueFalse;
  }
}
