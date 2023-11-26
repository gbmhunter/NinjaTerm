import { makeAutoObservable } from 'mobx';

import { App } from 'src/App';

export enum PortState {
  CLOSED,
  CLOSED_BUT_WILL_REOPEN,
  OPENED
}

export default class PortConfiguration {

  app: App;

  connectToSerialPortAsSoonAsItIsSelected = true;

  resumeConnectionToLastSerialPortOnStartup = true;

  reopenSerialPortIfUnexpectedlyClosed = true;

  constructor(app: App) {
    this.app = app;
    makeAutoObservable(this);
    this.loadConfig();
  }

  setConnectToSerialPortAsSoonAsItIsSelected = (value: boolean) => {
    this.connectToSerialPortAsSoonAsItIsSelected = value;
    this.saveConfig();
  }

  setResumeConnectionToLastSerialPortOnStartup = (value: boolean) => {
    this.resumeConnectionToLastSerialPortOnStartup = value;
    this.saveConfig();
  }

  setReopenSerialPortIfUnexpectedlyClosed = (value: boolean) => {
    this.reopenSerialPortIfUnexpectedlyClosed = value;
    this.saveConfig();
  }

  saveConfig = () => {
    const config = {
      connectToSerialPortAsSoonAsItIsSelected: this.connectToSerialPortAsSoonAsItIsSelected,
      resumeConnectionToLastSerialPortOnStartup: this.resumeConnectionToLastSerialPortOnStartup,
      reopenSerialPortIfUnexpectedlyClosed: this.reopenSerialPortIfUnexpectedlyClosed,
    };

    this.app.appStorage.saveConfig(['settings', 'portConfiguration'], config);
  }

  loadConfig = () => {
    const config = this.app.appStorage.getConfig(['settings', 'portConfiguration']);
    if (config === null) {
      return;
    }
    if (config.connectToSerialPortAsSoonAsItIsSelected !== undefined) {
    this.connectToSerialPortAsSoonAsItIsSelected = config.connectToSerialPortAsSoonAsItIsSelected;
    }
    if (config.resumeConnectionToLastSerialPortOnStartup !== undefined) {
    this.resumeConnectionToLastSerialPortOnStartup = config.resumeConnectionToLastSerialPortOnStartup;
    }
    if (config.reopenSerialPortIfUnexpectedlyClosed !== undefined) {
    this.reopenSerialPortIfUnexpectedlyClosed = config.reopenSerialPortIfUnexpectedlyClosed;
    }
  }

}


