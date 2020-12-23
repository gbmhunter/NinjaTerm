import { makeAutoObservable } from "mobx"

// Model the application state.
export default class AppState {
  serialPortInfos = []
  secondsPassed = 0
  selSerialPort = '' // Empty string used to represent no serial port
  selBaudRate = 9600
  selNumDataBits = 8
  selParity = 'none'
  selNumStopBits = 1
  serialPortState = 'Closed'
  rxData = ''

  constructor() {
      makeAutoObservable(this)
  }

  increase() {
      this.secondsPassed += 1
  }

  reset() {
      this.secondsPassed = 0
  }

  rescan = () => {
    console.log('Rescanning for serial ports...')
    SerialPort.list()
    .then((portInfo) => {
      this.serialPortInfos = portInfo
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
    const { rxData } = this.state
    this.setState({
      rxData: rxData + data.toString()
    })
  }
}
