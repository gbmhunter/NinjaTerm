import React, { useState } from 'react'
import { observer } from 'mobx-react'
import { Dropdown, Button, Input, Radio, DropdownProps, InputOnChangeData } from 'semantic-ui-react'
import App from '../model/App'

// const styles = require('./SettingsSerialPortConfigView.css'); // Use require here to dodge "cannot find module" errors in VS Code

import styles from './SettingsSerialPortConfigView.css'



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

const SettingsSerialPortConfigView = observer((props: IProps) => {

  const { app } = props

  const parameterNameWidth = 100

  const serialPortInfoRows = app.settings.serialPortInfos.map((serialPortInfo) => {
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

  // Create structure for combobox
  const baudRateOptions = app.settings.baudRates.map((baudRate) => {
    return { key: baudRate, value: baudRate, text: baudRate.toString() };
  });

  return (
    <div id="serial-port-config" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* SERIAL PORT SELECTION */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ display: 'inline-block', width: parameterNameWidth }}>Serial Port: </span>
        <div style={{ display: 'flex' }}>
          <Dropdown
            selection
            options={serialPortInfoRows}
            value={app.settings.selSerialPort}
            onChange={app.settings.selSerialPortChanged}
            disabled={app.serialPortState !== 'Closed'}
            style={{ width: '500px' }} // Make this wide as it displays much serial port info
          />
          <div style={{ width: '10px' }} />
          <Button
            onClick={app.settings.rescan}
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
      </div>
      <div className={styles.serialPortParamRow}>
        <Radio
          label='Standard'
          name='radioGroup'
          value='this'
          checked={app.settings.selBaudRateStyle === 'standard'}
          onChange={() => { app.settings.setSelBaudRateStyle('standard') }}
          style={{ width: parameterNameWidth, paddingLeft: '10px' }}
        />
        <Dropdown
          selection
          placeholder="Select baud rate"
          options={baudRateOptions}
          value={app.settings.selBaudRateStandard}
          disabled={app.serialPortState !== 'Closed' || app.settings.selBaudRateStyle !== 'standard'}
          onChange={(_0: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
            app.settings.setSelBaudRateStandard(data.key)
          }}
        />
      </div>
      <div style={{ height: '5px' }} />
      <div className={styles.serialPortParamRow}>
        <Radio
          label='Custom'
          name='radioGroup'
          value='this'
          checked={app.settings.selBaudRateStyle === 'custom'}
          onChange={() => { app.settings.setSelBaudRateStyle('custom') }}
          style={{ width: parameterNameWidth, paddingLeft: '10px' }}
        />
        <Input
          placeholder="Select baud rate"
          options={baudRateOptions}
          value={app.settings.selBaudRateCustom}
          disabled={app.serialPortState !== 'Closed' || app.settings.selBaudRateStyle !== 'custom'}
          onChange={(_0: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
            app.settings.setSelBaudRateCustom(data.value)
          }}
        />
      </div>
      <div style={{ height: '10px' }} />

      {/* NUM. DATA BITS */}
      <div className={styles.serialPortParamRow}>
        <span style={{ display: 'inline-block', width: parameterNameWidth }}>Num. Data Bits:</span>
        <Dropdown
          selection
          options={numDataBitsAOptions}
          value={app.settings.selNumDataBits}
          disabled={app.serialPortState !== 'Closed'}
          onChange={app.settings.selNumDataBitsChanged}
        />
      </div>
      <div style={{ height: '10px' }} />

      {/* PARITY */}
      <div className={styles.serialPortParamRow}>
        <span style={{ display: 'inline-block', width: parameterNameWidth }}>Parity:</span>
        <Dropdown
          selection
          options={parityOptions}
          value={app.settings.selParity}
          disabled={app.serialPortState !== 'Closed'}
          onChange={app.settings.selParityChanged}
        />
      </div>
      <div style={{ height: '10px' }} />

      {/* NUM. STOP BITS */}
      <div className={styles.serialPortParamRow}>
        <span style={{ display: 'inline-block', width: parameterNameWidth }}>Num. Stop Bits:</span>
        <Dropdown
          selection
          options={numStopBitsAOptions}
          value={app.settings.selNumStopBits}
          disabled={app.serialPortState !== 'Closed'}
          onChange={app.settings.selNumStopBitsChanged}
        />
      </div>
      <div style={{ height: '10px' }} />

      {/* OPEN SERIAL PORT */}
      <Button
        onClick={app.openCloseButtonClicked}
        disabled={app.settings.selSerialPort === 'none'}
        color={ app.serialPortState === 'Closed' ? 'green' : 'red' }
        style={{ width: '200px' }}>
        { app.serialPortState === 'Closed' ? 'Open Port' : 'Close Port' }
      </Button>
    </div>
  )
})

export default SettingsSerialPortConfigView
