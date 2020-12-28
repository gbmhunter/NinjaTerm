import React, { Component } from 'react'
import { Menu } from 'semantic-ui-react'

export default class MenuExampleVerticalPointing extends Component {
  state = { activeItem: 'serial-port-config' }

  handleItemClick = (e, { name }) => this.setState({ activeItem: name })

  render() {
    const { activeItem } = this.state

    return (
      <Menu pointing vertical>
        <Menu.Item
          name='serial-port-config'
          active={activeItem === 'serial-port-config'}
          onClick={this.handleItemClick}
        />
        <Menu.Item
          name='terminal-view'
          active={activeItem === 'terminal-view'}
          onClick={this.handleItemClick}
        />
      </Menu>
    )
  }
}
