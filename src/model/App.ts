import { makeAutoObservable } from "mobx"
import SerialPort from 'serialport'

import StatusMsg from './StatusMsg'
import Settings from './Settings'
import NewLineParser from "../util/NewLineParser/NewLineParser"
import StreamedData from "../util/StreamedData/StreamedData"


const electron = require('electron')

// These are mocked for jest in __mocks__/electron.js
const { remote } = electron
const { Menu, MenuItem } = remote

function areWeTestingWithJest() {
  return process.env.JEST_WORKER_ID !== undefined;
}

/**
 * Use this to validate that a string is exactly a positive integer.
 *
 * @param str The string to check if integer.
 * @returns Returns true only if provided string is exactly a positive integer, with no leading whitespace, else returns false.
 */
function isNormalPositiveInteger(str : string) {
  const n = Math.floor(Number(str))
  return n !== Infinity && String(n) === str && n >= 0
}

class TextSegment {
  text: string = ''
  color: string = ''
  key: number
  constructor(text: string, color: string, key: number) {
    makeAutoObservable(this)
    this.text = text
    this.color = color
    this.key = key
  }
}

// Model the application state.
export default class App {

  settingsShown = false

  /** One of 'Open' or 'Closed' */
  serialPortState = 'Closed'

  serialPortObj: SerialPort | null = null

  rxData = ''

  input: StreamedData

  newLineParser: NewLineParser

  output: StreamedData

  rxSegments: TextSegment[] = []

  /** Contains the text data for the status textarea. */
  statusMsgs: StatusMsg[] = []

  /** If true, the RX textarea will always be kept scrolled to the bottom. If false, scroll position keeps
   * current received data in view.
   */
  autoScroll = true

  settings = new Settings(this)

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

      this.input = new StreamedData()
      this.newLineParser = new NewLineParser('\n')
      this.output = new StreamedData()

      this.rxSegments.push(new TextSegment('', '#000000', 0))

      // Do initial scan for serial ports
      this.addStatusBarMsg('NinjaTerm started.', 'ok')
      this.settings.rescan()
  }

  setSettingsShown = (trueFalse: boolean) => {
    this.settingsShown = trueFalse
  }

  openCloseButtonClicked = () => {
    if(this.serialPortState === 'Closed') {

      if(this.settings.selSerialPort === '')
        throw Error('Selected serial port is null.')
      else {

        // Determine baud rate based on whether user has selected
        // 'standard' or 'custom'
        let selBaudRate = null
        if(this.settings.selBaudRateStyle === 'standard')
          selBaudRate = this.settings.selBaudRateStandard
        else if(this.settings.selBaudRateStyle === 'custom') {
          // Validate user entered custom baud rate
          if(!isNormalPositiveInteger(this.settings.selBaudRateCustom.value)) {
            this.settings.selBaudRateCustom.error = 'Value must be a positive integer.'
            return
          }
          // If we get here, custom baud rate passed validation checks
          const convertedBaudRate = Number.parseInt(this.settings.selBaudRateCustom.value, 10)
          this.settings.selBaudRateCustom.error = null
          selBaudRate = convertedBaudRate
        }
        else
          throw Error('selBaudRateStyle unrecognized.')

        const serialPortObj = new SerialPort(
          this.settings.selSerialPort,
          {
            baudRate: selBaudRate,
            dataBits: this.settings.selNumDataBits,
            parity: this.settings.selParity,
            stopBits: this.settings.selNumStopBits,
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
      this.addStatusBarMsg(`Serial port "${this.settings.selSerialPort}" closed.\n`, 'ok')
    }
  }

  onSerialPortOpened = () => {
    this.addStatusBarMsg(`Serial port "${this.settings.selSerialPort}" opened.\n`, 'ok')
    this.serialPortState = 'Open'
  }

  onSerialPortReceivedData = (data: any) => {
    console.log('Received data from serial port. Data:', data)
    this.rxData += data.toString()

    this.input.append(data.toString())
    this.newLineParser.parse(this.input, this.output)
    // this.output contains the new data needed to be add to the RX terminal window

    const lastRxSegment = this.rxSegments[this.rxSegments.length - 1]
    lastRxSegment.text += this.output.text
    lastRxSegment.key += 1

    this.output.clear()

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
    const currDate = new Date()
    this.statusMsgs.push(new StatusMsg(this.statusMsgs.length, `${currDate.toISOString()}: ${msg}`, severity))
  }

  handleKeyPress = (event: KeyboardEvent) => {
    console.log('keypress detected. event=')
    console.log(event)
    if(this.serialPortState === 'Open') {
      // Send keypress to serial port
      this.serialPortObj?.write([event.keyCode])
    }
  }
}
