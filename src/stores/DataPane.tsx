import { makeAutoObservable } from 'mobx';

export default class DataPane {
  // If true, the data pane scroll will be locked at the bottom
  scrollLock = true;

  constructor() {
    makeAutoObservable(this);
  }

  setScrollLock(trueFalse: boolean) {
    this.scrollLock = trueFalse;
  }
}
