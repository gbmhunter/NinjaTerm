import { action, makeAutoObservable } from "mobx"
import { DropdownProps } from 'semantic-ui-react'
import SerialPort, { PortInfo } from 'serialport'

import StatusMsg from './StatusMsg'

const electron = require('electron')

// These are mocked for jest in __mocks__/electron.js
const { remote } = electron
const { Menu, MenuItem } = remote

function areWeTestingWithJest() {
  return process.env.JEST_WORKER_ID !== undefined;
}

// Model the application state.
export default class AppState {

  settingsShown = false

  serialPortInfos: PortInfo[] = []

  selSerialPort = 'none' // Empty string used to represent no serial port

  serialPortObj: SerialPort | null = null

  selBaudRate = 9600

  selNumDataBits = 8

  selParity = 'none'

  selNumStopBits = 1

  serialPortState = 'Closed'

  rxData = ''

  /** Contains the text data for the status textarea. */
  statusMsgs: StatusMsg[] = []

  /** If true, the RX textarea will always be kept scrolled to the bottom. If false, scroll position keeps
   * current received data in view.
   */
  autoScroll = true

  constructor() {
      makeAutoObservable(this)

      // Setup the application menu. Electron doesn't seem to run in the render process
      // when invoked by jest, so we don't run this code when doing testing
      if(!areWeTestingWithJest()) {
        const menu = new Menu()
        const fileSubMenu = new Menu()
        fileSubMenu.append(new MenuItem({ label: 'Settings', click: () => { this.setSettingsShown(true) } }))
        const fileMenu = new MenuItem({ label: 'File', submenu: fileSubMenu })
        menu.append(fileMenu)
        menu.append(new MenuItem({ type: 'separator' }))
        Menu.setApplicationMenu(menu)
      }

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
    SerialPort.list().then(
      action('listPortSuccess', (portInfo: SerialPort.PortInfo[]) => {
        this.serialPortInfos = portInfo
        if(this.serialPortInfos.length > 0) {
          this.selSerialPort = this.serialPortInfos[0].path
        } else {
          this.selSerialPort = 'none'
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
  };

  openCloseButtonClicked = () => {
    console.log('openCloseButtonClicked() called.')
    if(this.serialPortState === 'Closed') {

      if(this.selSerialPort === '')
        throw Error('Selected serial port is null.')
      else {
        const serialPortObj = new SerialPort(
          this.selSerialPort,
          {
            baudRate: this.selBaudRate,
            dataBits: this.selNumDataBits,
            parity: this.selParity,
            stopBits: this.selNumStopBits,
            autoOpen: false,
          } as SerialPort.OpenOptions,
        )

        this.serialPortObj = serialPortObj

        serialPortObj.on('open', this.onSerialPortOpened)
        // Switches the port into "flowing mode"
        serialPortObj.on('data', (data) => {
          this.onSerialPortReceivedData(data)
        })
        // All errors (incl. open errors) will be emitted as an error event
        serialPortObj.on('error', (err) => {
          console.log('Error: ', err.message)
          this.addStatusBarMsg(err.message, 'error')
        })

        serialPortObj.open()

      }
    } else if (this.serialPortState === 'Open') {
      if(this.serialPortObj === null)
        throw Error('Serial port object was null.')
      this.serialPortObj.close()
      this.serialPortState = 'Closed'
      this.serialPortObj = null
      this.addStatusBarMsg(`Serial port "${this.selSerialPort}" closed.\n`, 'ok')
    }
  }

  onSerialPortOpened = () => {
    this.addStatusBarMsg(`Serial port "${this.selSerialPort}" opened.\n`, 'ok')
    this.serialPortState = 'Open'
  }

  onSerialPortReceivedData = (data: any) => {
    // console.log('Data:', data)
    this.rxData += data.toString()
  }

  setAutoScroll = (trueFalse: boolean) => {
    this.autoScroll = trueFalse
  }

  /**
   * Call this to add a message to the status bar at the bottom of the main view.
   *
   * @param msg Message to output to the status bar. Message should include new line character.
   */
  addStatusBarMsg = (msg: string, severity: string) => {
    this.statusMsgs.push(new StatusMsg(msg, severity))
  }
}
