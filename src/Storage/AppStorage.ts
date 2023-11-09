import { App } from "src/App";

export default class AppStorage {

  app: App;

  constructor(app: App) {
    this.app = app;
  }

  loadDefaultSettings = () => {
    const settings = window.localStorage.getItem('settings');
    console.log('Default settings: ', settings);
  }

  saveSettings = () => {

    const settings = {
      port: {
        'usbVendorId': this.app.serialPortInfo?.usbVendorId,
        'usbProductId': this.app.serialPortInfo?.usbProductId,
      }
    }
    console.log('Saving settings: ', JSON.stringify(settings));
    window.localStorage.setItem('settings', JSON.stringify(settings));
  }

  setLastUsedPortInfo = (portInfo: Partial<SerialPortInfo>) => {
    console.log('Saving last used port info: ', JSON.stringify(portInfo));
    window.localStorage.setItem('lastUsedPortInfo', JSON.stringify(portInfo));
  }

  getLastUsedPortInfo = (): Partial<SerialPortInfo> | null =>  {
    const lastUsedPortInfoStr = window.localStorage.getItem('lastUsedPortInfo');
    console.log('getLastUsedPortInfo() called. lastUsedPortInfoStr: ', lastUsedPortInfoStr);
    if (lastUsedPortInfoStr === null) return null;
    const lastUsedPortInfo = JSON.parse(lastUsedPortInfoStr);
    return lastUsedPortInfo;
  }
}
