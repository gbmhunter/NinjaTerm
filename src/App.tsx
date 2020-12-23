import React from 'react';
import { connect } from 'react-redux'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Dropdown, DropdownProps, Button } from 'semantic-ui-react';
import SerialPort from 'serialport';
import { makeAutoObservable } from "mobx"
import { observer } from "mobx-react"
import { createContext, useContext } from "react"

const styles = require('./App.css'); // Use require here to dodge "cannot find module" errors in VS Code
import AppState from './AppState'
import SettingsView from './Settings'



// interface IProps {}

// interface HelloState {
//   serialPortInfos: SerialPort.PortInfo[];
//   selSerialPort: string;
//   selBaudRate: number;
//   selNumDataBits: number;
//   selParity: string;
//   selNumStopBits: number;
//   serialPortState: string;
//   rxData: string;
// }

// interface IHello extends React.Component<IProps, HelloState> {
//   serialPortObj: SerialPort | null;
// }



// const HelloView = observer(
//   class Hello extends React.Component<IProps, HelloState> implements IHello {

//     serialPortObj: SerialPort | null;

//     constructor(props: IProps) {
//       super(props);
//       console.log('this.props=')
//       console.log(this.props)
//       const timer = this.props.timer
//       console.log(timer)


//       this.state = {
//         serialPortInfos: [],
//         selSerialPort: '', // Empty string used for "null"
//         selBaudRate: 9600,
//         selNumDataBits: 8,
//         selParity: 'none',
//         selNumStopBits: 1,
//         serialPortState: 'Closed',
//         rxData: '',
//       };
//       this.serialPortObj = null
//     }

//     componentDidMount() {
//       // console.log(SerialPort);
//       this.rescan()
//     }



//     render() {
//       return (
//         <div>
//           <h1>NinjaTerm</h1>


//         </div>
//       );
//     }
//   }
// )

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


const AppContext = createContext<AppState>()

const MainView = observer(() => {
  // Grab the timer from the context.
  const app = useContext(AppContext) // See the Timer definition above.
  return (
    <div>
      <SettingsView app={app} />
      <div>
        <textarea value={app.rxData} style={{ width: '500px', height: '300px' }} readOnly/>
      </div>
    </div>
  )
})

const appState = new AppState()

export default function App() {
  return (
    <Router>
      <Switch>
        {/* <Provider store={store}>
          <Route path="/" component={HelloWrapped} />
        </Provider> */}
        <AppContext.Provider value={appState}>
          <Route path="/" component={MainView} />
        </AppContext.Provider>
      </Switch>
    </Router>
  );
}
