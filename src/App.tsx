import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Dropdown, DropdownProps, Button } from 'semantic-ui-react';
import SerialPort from 'serialport';

import styles from './App.css';

interface IProps {}

interface HelloState {
  serialPortInfos: SerialPort.PortInfo[];
  selSerialPort: string,
  selBaudRate: number;
  selNumDataBits: number;
  selParity: string;
  selNumStopBits: number;
}

const baudRates = [9600, 57600];

// Create structure for combobox
const baudRateOptions = baudRates.map((baudRate) => {
  return { key: baudRate, value: baudRate, text: baudRate.toString() };
});

const numDataBitsA = [5, 6, 7, 8, 9];

// Create structure for combobox
const numDataBitsAOptions = numDataBitsA.map((numDataBits) => {
  return { key: numDataBits, value: numDataBits, text: numDataBits.toString() };
});

const parities = ['none', 'even', 'mark', 'odd', 'space'];

// Create structure for combobox
const parityOptions = parities.map((parity) => {
  return { key: parity, value: parity, text: parity };
});

const numStopBitsA = [1, 2];

// Create structure for combobox
const numStopBitsAOptions = numStopBitsA.map((numStopBits) => {
  return { key: numStopBits, value: numStopBits, text: numStopBits.toString() };
});

class Hello extends React.Component<IProps, HelloState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      serialPortInfos: [],
      selSerialPort: '', // Empty string used for "null"
      selBaudRate: 9600,
      selNumDataBits: 8,
      selParity: 'none',
      selNumStopBits: 1,
    };

    this.serialPortObj = null;
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

  openClicked = () => {
    console.log('openClicked() called.')
    const { selSerialPort } = this.state
    if(selSerialPort === '')
      throw Error('Selected serial port is null.')
    else {
      console.log('selSerialPort=')
      console.log(selSerialPort)

      const { selBaudRate, selNumDataBits, selParity, selNumStopBits } = this.state
      this.serialPortObj = new SerialPort(
        selSerialPort,
        {
          baudRate: selBaudRate,
          dataBits: selNumDataBits,
          parity: selParity,
          stopBits: selNumStopBits,
        })
    }

  };

  selSerialPortChanged = (
    event: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    console.log('selSerialPortChanged() called. data.key=')
    console.log(data)
    this.setState({
      selSerialPort: data.value,
    });
  };

  selBaudRateChanged = (
    event: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    this.setState({
      selBaudRate: data.key,
    });
  };

  selNumDataBitsChanged = (
    event: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    this.setState({
      selNumDataBits: data.key,
    });
  };

  selParityChanged = (
    event: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    this.setState({
      selParity: data.key,
    });
  };

  selNumStopBitsChanged = (
    event: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    this.setState({
      selNumStopBits: data.key,
    });
  };

  render() {
    const parameterNameWidth = 100;

    const {
      serialPortInfos,
      selSerialPort,
      selBaudRate,
      selNumDataBits,
      selParity,
      selNumStopBits
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
        <h1>NinjaTerm</h1>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>Settings</h3>
          <div className={styles.serialPortParamRow}>
            <span style={{ display: 'inline-block', width: parameterNameWidth }}>Serial Port: </span>
            <Dropdown
              selection
              options={serialPortInfoRows}
              value={selSerialPort}
              onChange={this.selSerialPortChanged}
              style={{ width: '600px' }} // Make this wide as it displays much serial port info
            />
          </div>
          <div style={{ height: '10px' }} />
          <div className={styles.serialPortParamRow}>
            <span style={{ display: 'inline-block', width: parameterNameWidth }} />
            <Button onClick={this.rescan}>Rescan</Button>
          </div>
          <div style={{ height: '10px' }} />

          {/* BAUD RATE */}
          <div className={styles.serialPortParamRow}>
            <span style={{ display: 'inline-block', width: parameterNameWidth }}>Baud rate: </span>
            <Dropdown
              selection
              placeholder="Select baud rate"
              options={baudRateOptions}
              value={selBaudRate}
              onChange={this.selBaudRateChanged}
            />
          </div>
          <div style={{ height: '10px' }} />

          {/* NUM. DATA BITS */}
          <div className={styles.serialPortParamRow}>
            <span style={{ display: 'inline-block', width: parameterNameWidth }}>Num. Data Bits:</span>
            <Dropdown
              selection
              options={numDataBitsAOptions}
              value={selNumDataBits}
              onChange={this.selNumDataBitsChanged}
            />
          </div>
          <div style={{ height: '10px' }} />

          {/* PARITY */}
          <div className={styles.serialPortParamRow}>
            <span style={{ display: 'inline-block', width: parameterNameWidth }}>Parity:</span>
            <Dropdown
              selection
              options={parityOptions}
              value={selParity}
              onChange={this.selParityChanged}
            />
          </div>
          <div style={{ height: '10px' }} />

          {/* NUM. STOP BITS */}
          <div className={styles.serialPortParamRow}>
            <span style={{ display: 'inline-block', width: parameterNameWidth }}>Num. Stop Bits:</span>
            <Dropdown
              selection
              options={numStopBitsAOptions}
              value={selNumStopBits}
              onChange={this.selNumStopBitsChanged}
            />
          </div>
          <div style={{ height: '10px' }} />

          {/* OPEN SERIAL PORT */}
          <Button onClick={this.openClicked} style={{ width: '200px' }}>
            Open
          </Button>
        </div>
      </div>
    );
  }
}

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Hello} />
      </Switch>
    </Router>
  );
}
