import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Button, Checkbox, CheckboxProps, Icon } from 'semantic-ui-react'
import { observer } from 'mobx-react'

import AppState from './model/App'
import SettingsView from './views/Settings'

// const styles = require('./App.css'); // Use require here to dodge "cannot find module" errors in VS Code

const appState = new AppState()
const AppContext = React.createContext<AppState>(appState) // This default context 'appState' should never be used, but keeps lint happy

const MainView = observer(() => {
  // Grab the timer from the context.
  const app = React.useContext(AppContext) // See the Timer definition above.

  const rxDataDiv = React.useRef<HTMLDivElement>(null)
  const statusContentDiv = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    // Keep the textarea scrolled to the bottom as data comes in if the checkbox is ticked
    if(app.autoScroll) {
      if(rxDataDiv.current !== null) {
        rxDataDiv.current.scrollTop = rxDataDiv.current.scrollHeight
      }
    }
    if(statusContentDiv.current !== null) {
      statusContentDiv.current.scrollTop = statusContentDiv.current.scrollHeight
    }
  });

  function handleAutoScrollChanged(_1: React.FormEvent<HTMLInputElement>, data: CheckboxProps) {
    console.log(data)
    if(typeof data.checked === 'boolean')
      app.setAutoScroll(data.checked)
  }

  const rxDataView = (<div><span style={{ whiteSpace: 'pre' }}>{app.rxData}</span><span id="cursor">█</span></div>)

  const statusMsgsView = app.statusMsgs.map((statusMsg) => {
    if(statusMsg.severity === 'ok') {
      return (<span key={statusMsg.id} style={{ display: 'block' }}>{statusMsg.msg}</span>)
    }
    if(statusMsg.severity === 'error') {
      return (<span key={statusMsg.id} style={{ display: 'block', color: 'red' }}>ERROR: {statusMsg.msg}</span>)
    }

    throw Error('statusMsg.severity not recognized.')
  })

  return (
    <div id="main-view" style={{ width: '100%', height: '100%' }}>
      {/* SettingsView is only displayed when settingsShown==true. Modal. */}
      <SettingsView app={app} />

      <div style={{ width: '100%', height: '100%', padding: '20px', display: 'flex', flexDirection: 'column' }}>

        {/* TOP BAR */}
        <div id="top-bar" style={{ height: '50px', display: 'flex', alignItems: 'center' }}>
          <Button icon onClick={() => {app.setSettingsShown(true)}}>
            <Icon name='settings' size='large' />
          </Button>
          <div style={{ minWidth: '10px' }} />
          <Button
            onClick={app.openCloseButtonClicked}
            disabled={app.selSerialPort === 'none'}
            color={ app.serialPortState === 'Closed' ? 'green' : 'red' }
            style={{ height: '40px' }} >{ app.serialPortState === 'Closed' ? 'Open Port' : 'Close Port' }</Button>
          <div style={{ minWidth: '10px' }} />
          <Checkbox label='Auto-scroll' checked={app.autoScroll} onChange={handleAutoScrollChanged} />
        </div>
        <div style={{ minHeight: '10px' }}/>

        {/* RX DATA */}
        <div id="rx-data"
          ref={rxDataDiv}
          style={{ width: '100%', height: '100%', padding: '10px', fontFamily: 'monospace', borderStyle: 'solid', borderWidth: 'thin', overflowY: 'scroll' }}>
          {rxDataView}
        </div>
        <div style={{ minHeight: '10px' }}/>

        {/* STATUS BAR */}
        <div id="status-bar" style={{ minHeight: '80px', maxHeight: '80px', borderStyle: 'solid', borderWidth: 'thin' }}>
          <div ref={statusContentDiv} style={{ width: '100%', height: '100%', padding: '10px', overflowY: 'scroll' }}>
            {statusMsgsView}
          </div>
        </div>
      </div>
    </div>
  )
})

export default function App() {
  return (
    <Router>
      <Switch>
        <AppContext.Provider value={appState}>
          <Route path="/" component={MainView} />
        </AppContext.Provider>
      </Switch>
    </Router>
  );
}
