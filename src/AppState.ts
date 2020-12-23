import { makeAutoObservable } from "mobx"
const electron = require('electron')
const { remote } = electron
import SerialPort, { PortInfo } from 'serialport'

const {Menu,MenuItem}=remote

// Model the application state.
export default class AppState {

  settingsShown: boolean = false

  serialPortInfos: PortInfo[] = []
  selSerialPort = 'none' // Empty string used to represent no serial port
  serialPortObj: SerialPort | null = null
  selBaudRate = 9600
  selNumDataBits = 8
  selParity = 'none'
  selNumStopBits = 1
  serialPortState = 'Closed'
  rxData = ''

  constructor() {
      makeAutoObservable(this)

      // Setup the application menu
      const menu = new Menu()
      const fileSubMenu = new Menu()
      fileSubMenu.append(new MenuItem({ label: 'Settings', click: () => { this.setSettingsShown(true) } }))
      const fileMenu = new MenuItem({ label: 'File', submenu: fileSubMenu })
      menu.append(fileMenu)
      menu.append(new MenuItem({ type: 'separator' }))
      Menu.setApplicationMenu(menu)

      // Do initial scan for serial ports
      this.rescan()
  }

  setSettingsShown = (trueFalse: boolean) => {
    console.log('setSettingsShown() called with trueFalse=')
    console.log(trueFalse)
    this.settingsShown = trueFalse
  }

  rescan = () => {
    console.log('Rescanning for serial ports...')
    SerialPort.list()
    .then((portInfo) => {
      this.serialPortInfos = portInfo
      if(this.serialPortInfos.length > 0) {
        this.selSerialPort = this.serialPortInfos[0].path
      } else {
        this.selSerialPort = 'none'
      }
      return true;
    })
    .catch((reason) => {
      throw Error(`ERROR: ${reason}`);
    });
  }

  selSerialPortChanged = (
    _0: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    console.log('selSerialPortChanged() called. data.key=')
    console.log(data)
    const selSerialPort = data.value
    if(typeof selSerialPort === 'string') {
      this.selSerialPort = selSerialPort
    } else {
      throw Error('selSerialPort was not a string.')
    }
  };

  selBaudRateChanged = (
    _0: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    this.selBaudRate = data.key
  };

  selNumDataBitsChanged = (
    _0: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    this.selNumDataBits = data.key
  };

  selParityChanged = (
    _0: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    this.selParity = data.key
  };

  selNumStopBitsChanged = (
    _0: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    this.selNumStopBits = data.key
  };

  openCloseButtonClicked = () => {
    console.log('openCloseButtonClicked() called.')
    if(this.serialPortState === 'Closed') {

      if(this.selSerialPort === '')
        throw Error('Selected serial port is null.')
      else {
        console.log('selSerialPort=')
        console.log(this.selSerialPort)

        const serialPortObj = new SerialPort(
          this.selSerialPort,
          {
            baudRate: this.selBaudRate,
            dataBits: this.selNumDataBits,
            parity: this.selParity,
            stopBits: this.selNumStopBits,
            autoOpen: false,
          } as SerialPort.OpenOptions
        )

        serialPortObj.on('open', this.onSerialPortOpened)
        // Switches the port into "flowing mode"
        serialPortObj.on('data', (data) => {
          this.onSerialPortReceivedData(data)
        })

        serialPortObj.open()

        this.serialPortState = 'Open'

        this.serialPortObj = serialPortObj
      }
    } else if (this.serialPortState === 'Open') {
      if(this.serialPortObj === null)
        throw Error('Serial port object was null.')
      this.serialPortObj.close()
      this.serialPortState = 'Closed'
      this.serialPortObj = null
    }
  }

  onSerialPortOpened = () => {
    console.log('Serial port opened!')
  }

  onSerialPortReceivedData = (data: any) => {
    // console.log('Data:', data)
    this.rxData = this.rxData + data.toString()
  }
}
