import React from 'react'
import { observer } from 'mobx-react'
import { Input } from 'semantic-ui-react'
import App from '../model/App'


interface IProps {
  app: App
}

const SettingsTerminalViewView = observer((props: IProps) => {

  const { app } = props

  return (
    <div className="vbox" style={{ }}>
      <span>Terminal Width:</span>
      <Input value={app.settings.terminalWidth} onChange={(_1, data) => { app.settings.setTerminalWidth(data.value) }} />
    </div>
  )
})

export default SettingsTerminalViewView
