import React from 'react'
import { observer } from 'mobx-react'
import { Menu } from 'semantic-ui-react'

import AppState from '../model/App'

interface IProps {
  app: AppState;
}

const SettingsMenu = observer((props: IProps) => {
  const { app } = props
  const { settings } = app

  return (
    <Menu pointing vertical>
      <Menu.Item
        name='serial-port-config'
        active={settings.activeSettingsItem === 'serial-port-config'}
        onClick={(e, { name }) => settings.setActiveSettingsItem(name)}
      />
      <Menu.Item
        name='terminal-view'
        active={settings.activeSettingsItem === 'terminal-view'}
        onClick={(e, { name }) => settings.setActiveSettingsItem(name)}
      />
    </Menu>
  )
})

export default SettingsMenu
