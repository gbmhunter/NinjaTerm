import React from 'react';
import { Dropdown, DropdownProps, Button } from 'semantic-ui-react';

const styles = require('./Settings.css'); // Use require here to dodge "cannot find module" errors in VS Code

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

interface IProps {}

interface IState {}

class Settings extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props)
  }

  render = () => {
    const parameterNameWidth = 100;

    return (
      <div id="settings-outer-container" style={{ backgroundColor: '#10101050', top: 0, bottom: 0, left: 0, right: 0, position: 'fixed', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div id="settings-inner-container" style={{ width: '80%', height: '80%', backgroundColor: 'white' }}>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3>Settings</h3>
            <div className={styles.serialPortParamRow}>
              <span style={{ display: 'inline-block', width: parameterNameWidth }}>Serial Port: </span>
              <Dropdown
                selection
                options={serialPortInfoRows}
                value={selSerialPort}
                onChange={this.selSerialPortChanged}
                disabled={serialPortState !== 'Closed'}
                style={{ width: '600px' }} // Make this wide as it displays much serial port info
              />
            </div>
            <div style={{ height: '10px' }} />
            <div className={styles.serialPortParamRow}>
              <span style={{ display: 'inline-block', width: parameterNameWidth }} />
              <Button
                onClick={this.rescan}
                disabled={serialPortState !== 'Closed'}
              >Rescan</Button>
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
                disabled={serialPortState !== 'Closed'}
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
                disabled={serialPortState !== 'Closed'}
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
                disabled={serialPortState !== 'Closed'}
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
                disabled={serialPortState !== 'Closed'}
                onChange={this.selNumStopBitsChanged}
              />
            </div>
            <div style={{ height: '10px' }} />

            {/* OPEN SERIAL PORT */}
            <Button onClick={this.openCloseButtonClicked} style={{ width: '200px' }}>
              { serialPortState === 'Closed' ? 'Open' : 'Close' }
            </Button>
          </div>
        </div>
      </div>
    )
  }

}

export default Settings;
