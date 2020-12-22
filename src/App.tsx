import React from 'react';
import { connect } from 'react-redux'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Dropdown, DropdownProps, Button } from 'semantic-ui-react';
import SerialPort from 'serialport';
import { makeAutoObservable } from "mobx"
import { observer } from "mobx-react"
import {createContext, useContext} from "react"

const styles = require('./App.css'); // Use require here to dodge "cannot find module" errors in VS Code
import Settings from './Settings'

interface IProps {}

interface HelloState {
  serialPortInfos: SerialPort.PortInfo[];
  selSerialPort: string;
  selBaudRate: number;
  selNumDataBits: number;
  selParity: string;
  selNumStopBits: number;
  serialPortState: string;
  rxData: string;
}

interface IHello extends React.Component<IProps, HelloState> {
  serialPortObj: SerialPort | null;
}



const HelloView = observer(
  class Hello extends React.Component<IProps, HelloState> implements IHello {

    serialPortObj: SerialPort | null;

    constructor(props: IProps) {
      super(props);
      console.log('this.props=')
      console.log(this.props)
      const timer = this.props.timer
      console.log(timer)


      this.state = {
        serialPortInfos: [],
        selSerialPort: '', // Empty string used for "null"
        selBaudRate: 9600,
        selNumDataBits: 8,
        selParity: 'none',
        selNumStopBits: 1,
        serialPortState: 'Closed',
        rxData: '',
      };
      this.serialPortObj = null
    }

    componentDidMount() {
      // console.log(SerialPort);
      this.rescan()
    }

    rescan = () => {
      console.log('Rescanning for serial ports...')
      SerialPort.list()
      .then((portInfo) => {
        this.setState({
          serialPortInfos: portInfo,
        });
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
        this.setState({
          selSerialPort,
        });
      } else {
        throw Error('selSerialPort was not a string.')
      }
    };

    selBaudRateChanged = (
      _0: React.SyntheticEvent<HTMLElement, Event>,
      data: DropdownProps
    ) => {
      this.setState({
        selBaudRate: data.key,
      });
    };

    selNumDataBitsChanged = (
      _0: React.SyntheticEvent<HTMLElement, Event>,
      data: DropdownProps
    ) => {
      this.setState({
        selNumDataBits: data.key,
      });
    };

    selParityChanged = (
      _0: React.SyntheticEvent<HTMLElement, Event>,
      data: DropdownProps
    ) => {
      this.setState({
        selParity: data.key,
      });
    };

    selNumStopBitsChanged = (
      _0: React.SyntheticEvent<HTMLElement, Event>,
      data: DropdownProps
    ) => {
      this.setState({
        selNumStopBits: data.key,
      });
    };

    openCloseButtonClicked = () => {
      console.log('openCloseButtonClicked() called.')
      const { serialPortState } = this.state
      if(serialPortState === 'Closed') {

        const { selSerialPort } = this.state
        if(selSerialPort === '')
          throw Error('Selected serial port is null.')
        else {
          console.log('selSerialPort=')
          console.log(selSerialPort)

          const { selBaudRate, selNumDataBits, selParity, selNumStopBits } = this.state
          const serialPortObj = new SerialPort(
            selSerialPort,
            {
              baudRate: selBaudRate,
              dataBits: selNumDataBits,
              parity: selParity,
              stopBits: selNumStopBits,
              autoOpen: false,
            } as SerialPort.OpenOptions
          )

          serialPortObj.on('open', this.onSerialPortOpened)
          // Switches the port into "flowing mode"
          serialPortObj.on('data', (data) => {
            this.onSerialPortReceivedData(data)
          })

          serialPortObj.open()

          this.setState({
            serialPortState: 'Open',
          })

          this.serialPortObj = serialPortObj
        }
      } else if (serialPortState === 'Open') {
        if(this.serialPortObj === null)
          throw Error('Serial port object was null.')
        this.serialPortObj.close()
        this.setState({
          serialPortState: 'Closed',
        })
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

    render() {
      const parameterNameWidth = 100;

      const {
        serialPortInfos,
        selSerialPort,
        selBaudRate,
        selNumDataBits,
        selParity,
        selNumStopBits,
        serialPortState,
        rxData,
      } = this.state;

      const serialPortInfoRows = serialPortInfos.map((serialPortInfo) => {
        return {
          key: serialPortInfo.path,
          text: serialPortInfo.path,
          value: serialPortInfo.path,
          content: (
            <div>
              <span style={{ display: 'inline-block', width: '70px' }}>{serialPortInfo.path}</span>
              <span style={{ display: 'inline-block', width: '150px' }}>{serialPortInfo.manufacturer}</span>
              <span style={{ display: 'inline-block', width: '150px' }}>{serialPortInfo.locationId}</span>
            </div>
          )
        };
      });
      if (serialPortInfoRows.length === 0) {
        serialPortInfoRows.push({
          key: '',
          text: 'none',
          value: 'none',
          content: (
            <div>
              <span>No serial ports found</span>
            </div>
          )
        })
      }

      return (
        <div>
          {/* <Settings /> */}
          <h1>NinjaTerm</h1>

          <div>
            <textarea value={rxData} style={{ width: '500px', height: '300px' }} readOnly/>
          </div>
        </div>
      );
    }
  }
)

// const mapStateToProps = (state, ownProps) => {
//   // ... computed data from state and optionally ownProps
//   return {
//     count: state,
//   }
// }

// const HelloWrapped = connect(
//   mapStateToProps,
//   null,
// )(Hello)

// import { Provider } from 'react-redux'
// import { configureStore, createStore } from '@reduxjs/toolkit'

// import { createSlice } from '@reduxjs/toolkit'

// export const counterSlice = createSlice({
//   name: 'counter',
//   initialState: {
//     value: 0
//   },
//   reducers: {
//     increment: state => {
//       // Redux Toolkit allows us to write "mutating" logic in reducers. It
//       // doesn't actually mutate the state because it uses the immer library,
//       // which detects changes to a "draft state" and produces a brand new
//       // immutable state based off those changes
//       state.value += 1
//     },
//     decrement: state => {
//       state.value -= 1
//     },
//     incrementByAmount: (state, action) => {
//       state.value += action.payload
//     }
//   }
// })

// const { increment, decrement, incrementByAmount } = counterSlice.actions

// export const countReducer = function (state = 0, action) {
//   switch (action.type) {
//     case "INCREMENT":
//       return state + 1;
//     case "DECREMENT":
//       return state - 1;
//     default:
//       return state;
//   }
// };

// const store = configureStore({
//   reducer: counterSlice.reducer
// })



// Model the application state.
class Timer {
  secondsPassed = 0

  constructor() {
      makeAutoObservable(this)
  }

  increase() {
      this.secondsPassed += 1
  }

  reset() {
      this.secondsPassed = 0
  }
}

const TimerContext = createContext<Timer>()

const TimerView = observer(() => {
  // Grab the timer from the context.
  const timer = useContext(TimerContext) // See the Timer definition above.
  return (
      <span>Seconds passed: {timer.secondsPassed}</span>
  )
})

const myTimer = new Timer()

setInterval(() => {
  myTimer.increase()
}, 1000)


export default function App() {
  return (
    <Router>
      <Switch>
        {/* <Provider store={store}>
          <Route path="/" component={HelloWrapped} />
        </Provider> */}
        <TimerContext.Provider value={myTimer}>
          <Route path="/" component={TimerView} />
        </TimerContext.Provider>
      </Switch>
    </Router>
  );
}
