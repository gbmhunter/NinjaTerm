import { makeAutoObservable } from 'mobx';

import { App } from 'src/App';

export default class PortConfiguration {

  app: App;

  connectToSerialPortAsSoonAsItIsSelected = true;

  resumeConnectionToLastSerialPortOnStartup = true;

  constructor(app: App) {
    this.app = app;
    makeAutoObservable(this);
    // console.log('DEBUG', JSON.stringify(this));
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

  saveConfig = () => {
    const config = {
      connectToSerialPortAsSoonAsItIsSelected: this.connectToSerialPortAsSoonAsItIsSelected,
      resumeConnectionToLastSerialPortOnStartup: this.resumeConnectionToLastSerialPortOnStartup,
    };

    this.app.appStorage.saveConfig('settings.portConfiguration', config);
  }

  loadConfig = () => {
    const config = this.app.appStorage.getConfig('settings.portConfiguration');
    if (config === null) {
      return;
    }
    this.connectToSerialPortAsSoonAsItIsSelected = config.connectToSerialPortAsSoonAsItIsSelected;
    this.resumeConnectionToLastSerialPortOnStartup = config.resumeConnectionToLastSerialPortOnStartup;
  }

}
