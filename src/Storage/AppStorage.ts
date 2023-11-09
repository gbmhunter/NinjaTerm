import { App, PortState } from "src/App";

class LastUsedSerialPort {
  serialPortInfo: Partial<SerialPortInfo> = {};
  portState: PortState = PortState.CLOSED;
}

class Data {
  lastUsedSerialPort: LastUsedSerialPort = new LastUsedSerialPort();
}

export default class AppStorage {

  app: App;

  data: Data = new Data();

  constructor(app: App) {
    this.app = app;

    const dataStr = window.localStorage.getItem('data');
    if (dataStr !== null) {
      this.data = JSON.parse(dataStr);
      if (this.data.lastUsedSerialPort === undefined) {
        this.data.lastUsedSerialPort = new LastUsedSerialPort();
      }
    }
  }

  saveData = () => {
    window.localStorage.setItem('data', JSON.stringify(this.data));
  }

}
