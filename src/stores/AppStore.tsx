import { makeAutoObservable } from 'mobx';
import { SerialPort } from 'serialport';

import { SettingsStore } from './SettingsStore';

export enum PortState {
  CLOSED,
  OPENED,
}

export enum PortStatusMsgType {
  OK,
  ERROR,
}

export interface PortStatusMsg {
  text: string;
  type: PortStatusMsgType;
}

export type PortStateToButtonPropsItem = {
  text: string;
  color: string;
};

export const portStateToButtonProps: {
  [key in PortState]: PortStateToButtonPropsItem;
} = {
  [PortState.CLOSED]: {
    text: 'Open Port',
    color: 'success',
  },
  [PortState.OPENED]: {
    text: 'Close Port',
    color: 'error',
  },
};

export class AppStore {
  settings = new SettingsStore();

  settingsDialogOpen = false;

  // If true, the settings dialog will be automatically closed on port open or close
  closeSettingsDialogOnPortOpenOrClose = true;

  logText = '';

  serialPort: null | SerialPort = null;

  portState = PortState.CLOSED;

  // Displayed on the port settings dialog box
  portStatusMsg: PortStatusMsg = {
    text: 'Port Closed',
    type: PortStatusMsgType.OK,
  };

  txRxText = '';

  // If true, the TX/RX panel scroll will be locked at the bottom
  txRxTextScrollBottom = true;

  constructor() {
    makeAutoObservable(this);

    SerialPort.list()
      .then((ports) => {
        this.settings.setAvailablePortInfos(ports);
        // Set the selected port, this doesn't fire automatically if setting
        // the ports via code
        if (ports.length > 0) {
          this.settings.setSelectedPortPath(ports[0].path);
        }
        return 0;
      })
      .catch((error) => {
        console.log(error);
      });

    this.log('Started NinjaTerm.');
  }

  setSettingsDialogOpen(trueFalse: boolean) {
    this.settingsDialogOpen = trueFalse;
  }

  setCloseSettingsDialogOnPortOpenOrClose(trueFalse: boolean) {
    this.closeSettingsDialogOnPortOpenOrClose = trueFalse;
  }

  openPort() {
    this.log('Attempting to open port....');
    this.setPortStatusMsg({
      text: 'Opening port...',
      type: PortStatusMsgType.OK,
    });
    this.serialPort = new SerialPort({
      path: this.settings.selectedPortPath,
      baudRate: this.settings.selectedBaudRate,
      dataBits: this.settings.selectedNumDataBits as 5 | 6 | 7 | 8,
      parity: this.settings.selectedParity as
        | 'none'
        | 'even'
        | 'odd'
        | 'mark'
        | 'space',
      // stopBits: this.settings.sele
      autoOpen: false, // Prevent serial port from opening until we call open()
    });

    // The open event is always emitted
    this.serialPort.on('open', () => {
      // open logic
      this.setPortState(PortState.OPENED);
      this.setPortStatusMsg({
        text: 'Port opened successfully.',
        type: PortStatusMsgType.OK,
      });
      // This will automatically close the settings window if the user is currently in it,
      // clicks "Open" and the port opens successfully.
      if (this.closeSettingsDialogOnPortOpenOrClose) {
        this.setSettingsDialogOpen(false);
      }
      this.log('Serial port opened successfully.');
    });

    if (this.serialPort.isOpen) {
      console.log('WARNING: Serial port already open!!!');
    }
    this.serialPort.open((error) => {
      if (error) {
        console.log(error);
        this.log('Error occurred.');
        // Error already says "Error" at the start
        this.setPortStatusMsg({
          text: `${error}`,
          type: PortStatusMsgType.ERROR,
        });
      }
    });

    // Switches the port into "flowing mode"
    this.serialPort.on('data', (data) => {
      this.addNewRxData(data);
    });
  }

  closePort() {
    if (!this.serialPort?.isOpen) {
      this.log('closePort() called but port was not open.');
      return;
    }
    this.serialPort?.close(() => {
      this.setPortState(PortState.CLOSED);
      // This will automatically close the settings window if the user is currently in it,
      // clicks "Close" and the port closes successfully.
      if (this.closeSettingsDialogOnPortOpenOrClose) {
        this.setSettingsDialogOpen(false);
      }
      this.log('Serial port successfully closed.');
      this.setPortStatusMsg({
        text: 'Port closed.',
        type: PortStatusMsgType.OK,
      });
    });
  }

  setPortState(newPortState: PortState) {
    this.portState = newPortState;
  }

  setPortStatusMsg(portStatusMsg: PortStatusMsg) {
    this.portStatusMsg = portStatusMsg;
  }

  log(msg: string) {
    // Insert new line unless it's the first line ever
    if (this.logText.length === 0) {
      this.logText = `${this.logText}${msg}`;
    } else {
      this.logText = `${this.logText}\n${msg}`;
    }
  }

  /**
   * Adds newly received data to the received data buffer for displaying.
   */
  addNewRxData(rxData: Buffer) {
    this.txRxText += rxData;
  }
}
