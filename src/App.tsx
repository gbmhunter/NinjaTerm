import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Dropdown, DropdownProps, Button } from 'semantic-ui-react';
import SerialPort from 'serialport';

import styles from './App.css';

interface IProps {}

interface HelloState {
  serialPortInfos: SerialPort.PortInfo[];
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

const parities = ['No', 'Yes'];

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
      selBaudRate: 9600,
      selNumDataBits: 8,
      selParity: 'No',
      selNumStopBits: 1,
    };
  }

  componentDidMount() {
    console.log(SerialPort);
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

  openClicked = () => {};

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
      selBaudRate,
      selNumDataBits,
      selParity,
      selNumStopBits
    } = this.state;

    const serialPortInfoRows = serialPortInfos.map((serialPortInfo) => {
      return (
        <tr key={serialPortInfo.path}>
          <td>{serialPortInfo.path}</td>
          <td>{serialPortInfo.manufacturer}</td>
          <td>{serialPortInfo.locationId}</td>
        </tr>
      );
    });
    if (serialPortInfoRows.length === 0) {
      serialPortInfoRows.push(
        <tr key="no-com-ports-found">
          <td colSpan={3} style={{ fontStyle: 'italic' }}>
            No COM ports found.
          </td>
        </tr>
      );
    }

    return (
      <div>
        <h1>NinjaTerm</h1>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>COM Ports</h3>
          <table className="left-align">
            <thead>
              <tr>
                <th>Path</th>
                <th>Manufacturer</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>{serialPortInfoRows}</tbody>
          </table>
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
