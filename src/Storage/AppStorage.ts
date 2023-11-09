import { App, PortState } from "src/App";

export default class AppStorage {

  app: App;

  data = {
    lastUsedSerialPort: {
      serialPortInfo: null,
      portState: PortState.CLOSED,
    }
  }

  constructor(app: App) {
    this.app = app;

    const dataStr = window.localStorage.getItem('data');
    if (dataStr !== null) {
      this.data = JSON.parse(dataStr);
    }
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

  saveData = () => {
    window.localStorage.setItem('data', JSON.stringify(this.data));
  }

}
