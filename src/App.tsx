import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Button, Checkbox, CheckboxProps } from 'semantic-ui-react'
import { observer } from 'mobx-react'

import AppState from './AppState'
import SettingsView from './Settings'

// const styles = require('./App.css'); // Use require here to dodge "cannot find module" errors in VS Code

const appState = new AppState()
const AppContext = React.createContext<AppState>(appState) // This default context 'appState' should never be used, but keeps lint happy

const MainView = observer(() => {
  // Grab the timer from the context.
  const app = React.useContext(AppContext) // See the Timer definition above.

  const textArea = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    // Keep the textarea scrolled to the bottom as data comes in if the checkbox is ticked
    if(app.autoScroll) {
      if(textArea.current !== null) {
        textArea.current.scrollTop = textArea.current.scrollHeight;
      }
    }
  });

  function handleAutoScrollChanged(_1: React.FormEvent<HTMLInputElement>, data: CheckboxProps) {
    if(data.checked) {
      app.setAutoScroll(data.checked)
    }
  }

  return (
    <div id="main-view" style={{ width: '100%', height: '100%' }}>
      {/* SettingsView is only displayed when settingsShown==true. Modal. */}
      <SettingsView app={app} />

      <div style={{ width: '100%', height: '100%', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div id="top-bar" style={{ height: '50px', display: 'flex', alignItems: 'center' }}>
          <Button onClick={app.openCloseButtonClicked} disabled={app.selSerialPort === 'none'} style={{ height: '40px' }} >{ app.serialPortState === 'Closed' ? 'Open Port' : 'Close Port' }</Button>
          <div style={{ width: '10px' }} />
          <Checkbox label='Auto-scroll' checked={app.autoScroll} onChange={handleAutoScrollChanged} />
        </div>
        <textarea ref={textArea} value={app.rxData} style={{ width: '100%', height: '100%' }} readOnly/>
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
