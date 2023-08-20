import { makeAutoObservable } from 'mobx';
import { SerialPort } from 'serialport';

import { StatusMsg, StatusMsgSeverity } from './StatusMsg';
import { SettingsStore } from './SettingsStore';

export enum PortState {
  CLOSED,
  OPENED,
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

  /** Contains the text data for the status textarea. */
  statusMsgs: StatusMsg[] = [];

  serialPort: null | SerialPort = null;

  portState = PortState.CLOSED;

  txRxText = '';

  // If true, the TX/RX panel scroll will be locked at the bottom
  txRxTextScrollBottom = true;

  constructor() {
    makeAutoObservable(this);

    this.addStatusBarMsg('Started NinjaTerm.', StatusMsgSeverity.INFO);
  }

  setSettingsDialogOpen(trueFalse: boolean) {
    this.settingsDialogOpen = trueFalse;
    // If opening the settings dialog, also scan for ports
    if (trueFalse) {
      this.scanForPorts();
    }
  }

  setCloseSettingsDialogOnPortOpenOrClose(trueFalse: boolean) {
    this.closeSettingsDialogOnPortOpenOrClose = trueFalse;
  }

  /**
   * Scans the computer for available serial ports, and updates availablePortInfos.
   */
  scanForPorts() {
    SerialPort.list()
      .then((ports) => {
        this.settings.setAvailablePortInfos(ports);
        // Set the selected port, this doesn't fire automatically if setting
        // the ports via code
        if (ports.length > 0) {
          this.settings.setSelectedPortPath(ports[0].path);
        }
        // this.setPortStatusMsg({
        //   text: `Port scan complete. Found ${ports.length} ports.`,
        //   type: PortStatusMsgType.OK,
        // });
        this.addStatusBarMsg(
          `Port scan complete. Found ${ports.length} ports.`,
          StatusMsgSeverity.INFO,
          true
        );
        return 0;
      })
      .catch((error) => {
        console.log(error);
        this.addStatusBarMsg(`${error}`, StatusMsgSeverity.ERROR, true);
      });
  }

  openPort() {
    this.addStatusBarMsg('Opening port...', StatusMsgSeverity.INFO, true);
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
      this.addStatusBarMsg(
        'Port opened successfully.',
        StatusMsgSeverity.OK,
        true
      );
      // This will automatically close the settings window if the user is currently in it,
      // clicks "Open" and the port opens successfully.
      if (this.closeSettingsDialogOnPortOpenOrClose) {
        this.setSettingsDialogOpen(false);
      }
    });

    if (this.serialPort.isOpen) {
      console.log('WARNING: Serial port already open!!!');
    }
    this.serialPort.open((error) => {
      if (error) {
        console.log(error);
        // Error already says "Error" at the start
        this.addStatusBarMsg(`${error}`, StatusMsgSeverity.ERROR, true);
      }
    });

    // Switches the port into "flowing mode"
    this.serialPort.on('data', (data) => {
      this.addNewRxData(data);
    });
  }

  closePort() {
    if (!this.serialPort?.isOpen) {
      console.log('closePort() called but port was not open.');
      return;
    }
    this.serialPort?.close(() => {
      this.setPortState(PortState.CLOSED);
      // This will automatically close the settings window if the user is currently in it,
      // clicks "Close" and the port closes successfully.
      if (this.closeSettingsDialogOnPortOpenOrClose) {
        this.setSettingsDialogOpen(false);
      }
      this.addStatusBarMsg(
        'Port successfully closed.',
        StatusMsgSeverity.OK,
        true
      );
    });
  }

  setPortState(newPortState: PortState) {
    this.portState = newPortState;
  }

  /**
   * Call this to add a message to the status bar at the bottom of the main view.
   *
   * @param msg Message to output to the status bar. Message should include new line character.
   */
  addStatusBarMsg = (
    msg: string,
    severity: StatusMsgSeverity,
    showInPortSettings: boolean = false
  ) => {
    const currDate = new Date();
    this.statusMsgs.push(
      new StatusMsg(
        this.statusMsgs.length,
        `${currDate.toISOString()}: ${msg}`,
        severity,
        showInPortSettings
      )
    );
  };

  /**
   * Adds newly received data to the received data buffer for displaying.
   */
  addNewRxData(rxData: Buffer) {
    this.txRxText += rxData;
  }
}
