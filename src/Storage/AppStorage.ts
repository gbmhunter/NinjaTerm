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
}
