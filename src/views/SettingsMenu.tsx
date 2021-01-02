import React from 'react'
import { observer } from 'mobx-react'
import { Menu, MenuItemProps } from 'semantic-ui-react'

import App from '../model/App'

interface IProps {
  app: App;
}

const SettingsMenu = observer((props: IProps) => {
  const { app } = props
  const { settings } = app

  const handleMenuItemClick = (_1: any, data: MenuItemProps) => {
    const { name } = data
    if(name === undefined) {
      throw Error('name was undefined in handleMenuClick().')
    } else {
      settings.setActiveSettingsItem(name)
    }
  }

  return (
    <Menu pointing vertical>
      <Menu.Item
        name='serial-port-config'
        active={settings.activeSettingsItem === 'serial-port-config'}
        onClick={handleMenuItemClick}
      />
      <Menu.Item
        name='terminal-view'
        active={settings.activeSettingsItem === 'terminal-view'}
        onClick={handleMenuItemClick}
      />
    </Menu>
  )
})

export default SettingsMenu
