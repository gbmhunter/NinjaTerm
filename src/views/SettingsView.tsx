import React from 'react'
import { observer } from 'mobx-react'
import { Dropdown, Button } from 'semantic-ui-react'
import App from '../model/App'

import SettingsMenu from './SettingsMenu'

const styles = require('./SettingsView.css'); // Use require here to dodge "cannot find module" errors in VS Code

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

interface IProps {
  app: App;
}

const SettingsView = observer((props: IProps) => {

  const { app } = props

  const parameterNameWidth = 100;

  const serialPortInfoRows = app.serialPortInfos.map((serialPortInfo) => {
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
      key: 'none',
      text: 'No serial ports found',
      value: 'none',
      content: (
        <div>
          <span>No serial ports found</span>
        </div>
      )
    })
  }

  console.log('app.selSerialPort=', app.selSerialPort)
  return (
    <div id="settings-outer-container" style={{ backgroundColor: '#10101050', top: 0, bottom: 0, left: 0, right: 0, position: 'fixed', zIndex: 100, display: app.settingsShown === true ? 'flex' : 'none', justifyContent: 'center', alignItems: 'center' }}>
    <div id="settings-inner-container" style={{ width: '80%', height: '80%', backgroundColor: 'white', padding: '20px' }}>

      <div className="vbox">
        <h3>Settings</h3>
        <div className="hbox">

          <SettingsMenu app={app} />
          <div style={{ width: '20px' }}/>
          <div id="serial-port-config" style={{ display: app.settings.activeSettingsItem === 'serial-port-config' ? 'flex' : 'none', flexDirection: 'column' }}>
            {/* SERIAL PORT SELECTION */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ display: 'inline-block', width: parameterNameWidth }}>Serial Port: </span>
              <div style={{ display: 'flex' }}>
                <Dropdown
                  selection
                  options={serialPortInfoRows}
                  value={app.selSerialPort}
                  onChange={app.selSerialPortChanged}
                  disabled={app.serialPortState !== 'Closed'}
                  style={{ width: '500px' }} // Make this wide as it displays much serial port info
                />
                <div style={{ width: '10px' }} />
                <Button
                  onClick={app.rescan}
                  disabled={app.serialPortState !== 'Closed'}>
                    Rescan
                </Button>
              </div>
            </div>
            <div style={{ height: '10px' }} />
            <div className={styles.serialPortParamRow}>
              <span style={{ display: 'inline-block', width: parameterNameWidth }} />

            </div>
            <div style={{ height: '10px' }} />

            {/* BAUD RATE */}
            <div className={styles.serialPortParamRow}>
              <span style={{ display: 'inline-block', width: parameterNameWidth }}>Baud rate: </span>
              <Dropdown
                selection
                placeholder="Select baud rate"
                options={baudRateOptions}
                value={app.selBaudRate}
                disabled={app.serialPortState !== 'Closed'}
                onChange={app.selBaudRateChanged}
              />
            </div>
            <div style={{ height: '10px' }} />

            {/* NUM. DATA BITS */}
            <div className={styles.serialPortParamRow}>
              <span style={{ display: 'inline-block', width: parameterNameWidth }}>Num. Data Bits:</span>
              <Dropdown
                selection
                options={numDataBitsAOptions}
                value={app.selNumDataBits}
                disabled={app.serialPortState !== 'Closed'}
                onChange={app.selNumDataBitsChanged}
              />
            </div>
            <div style={{ height: '10px' }} />

            {/* PARITY */}
            <div className={styles.serialPortParamRow}>
              <span style={{ display: 'inline-block', width: parameterNameWidth }}>Parity:</span>
              <Dropdown
                selection
                options={parityOptions}
                value={app.selParity}
                disabled={app.serialPortState !== 'Closed'}
                onChange={app.selParityChanged}
              />
            </div>
            <div style={{ height: '10px' }} />

            {/* NUM. STOP BITS */}
            <div className={styles.serialPortParamRow}>
              <span style={{ display: 'inline-block', width: parameterNameWidth }}>Num. Stop Bits:</span>
              <Dropdown
                selection
                options={numStopBitsAOptions}
                value={app.selNumStopBits}
                disabled={app.serialPortState !== 'Closed'}
                onChange={app.selNumStopBitsChanged}
              />
            </div>
            <div style={{ height: '10px' }} />

            {/* OPEN SERIAL PORT */}
            <Button
              onClick={app.openCloseButtonClicked}
              disabled={app.selSerialPort === 'none'}
              color={ app.serialPortState === 'Closed' ? 'green' : 'red' }
              style={{ width: '200px' }}>
              { app.serialPortState === 'Closed' ? 'Open Port' : 'Close Port' }
            </Button>
          </div>
        </div>
        <div style={{ height: '30px' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => { app.setSettingsShown(false)}} style={{ width: '200px' }}>Close Settings</Button>
        </div>
      </div>
    </div>
  </div>
  )
})

export default SettingsView
