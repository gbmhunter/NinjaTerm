import { action, makeAutoObservable } from "mobx"
import { DropdownProps } from 'semantic-ui-react'
import SerialPort, { PortInfo } from 'serialport'

import App from './App'

export default class Settings {

  activeSettingsItem = 'serial-port-config'

  serialPortInfos: PortInfo[] = []

  selSerialPort = 'none' // Empty string used to represent no serial port

  selBaudRate = 9600

  selNumDataBits = 8

  selParity = 'none'

  selNumStopBits = 1

  // Width that the terminal data is displayed in. Units depend on ...
  terminalWidth = 80

  app: App

  constructor(app: App) {
    makeAutoObservable(this)
    this.app = app
  }

  setActiveSettingsItem(activeSettingsItem: string) {
    this.activeSettingsItem = activeSettingsItem
  }

  rescan = () => {
    console.log('Rescanning for serial ports...')
    this.app.addStatusBarMsg('Rescanning for serial ports...', 'ok')
    SerialPort.list().then(
      action('listPortSuccess', (portInfo: SerialPort.PortInfo[]) => {
        this.serialPortInfos = portInfo
        if(this.serialPortInfos.length > 0) {
          this.selSerialPort = this.serialPortInfos[0].path
          this.app.addStatusBarMsg(`Found ${this.serialPortInfos.length} serial ports.`, 'ok')
        } else {
          this.selSerialPort = 'none'
          this.app.addStatusBarMsg(`Found no serial ports.`, 'ok')
        }
        return true;
      })
    )
    .catch((reason) => {
      throw Error(`ERROR: ${reason}`);
    });
  }

  selSerialPortChanged = (
    _0: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps
  ) => {
    const selSerialPort = data.value
    if(typeof selSerialPort === 'string') {
      this.selSerialPort = selSerialPort
    } else {
      throw Error('selSerialPort was not a string.')
    }
  };

  selBaudRateChanged = (
    _0: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps
  ) => {
    this.selBaudRate = data.key
  };

  selNumDataBitsChanged = (
    _0: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps
  ) => {
    this.selNumDataBits = data.key
  };

  selParityChanged = (
    _0: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps
  ) => {
    this.selParity = data.key
  };

  selNumStopBitsChanged = (
    _0: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps
  ) => {
    this.selNumStopBits = data.key
  }

  setTerminalWidth = (value: string) => {
    this.terminalWidth = Number.parseInt(value)
  }
}
