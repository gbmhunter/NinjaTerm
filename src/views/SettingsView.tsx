import React from 'react'
import { observer } from 'mobx-react'
import { Button } from 'semantic-ui-react'
import App from '../model/App'

import SettingsMenu from './SettingsMenu'
import SettingsSerialPortConfigView from './SettingsSerialPortConfigView'
import SettingsTerminalViewView from './SettingsTerminalViewView'

interface IProps {
  app: App
}

const SettingsView = observer((props: IProps) => {

  const { app } = props

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

  return (
    <div id="settings-outer-container" style={{ backgroundColor: '#10101050', top: 0, bottom: 0, left: 0, right: 0, position: 'fixed', zIndex: 100, display: app.settingsShown === true ? 'flex' : 'none', justifyContent: 'center', alignItems: 'center' }}>
    <div id="settings-inner-container" style={{ width: '80%', height: '80%', backgroundColor: 'white', padding: '20px' }}>

      <div className="vbox">
        <h3>Settings</h3>
        <div className="hbox">

          <SettingsMenu app={app} />
          <div style={{ width: '20px' }}/>
          {/** Different groups of settings go here. Visible group depends on what menu item is clicked. */}
          { app.settings.activeSettingsItem === 'serial-port-config' ? <SettingsSerialPortConfigView app={app}/> : null }
          { app.settings.activeSettingsItem === 'terminal-view' ? <SettingsTerminalViewView app={app}/> : null }
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
