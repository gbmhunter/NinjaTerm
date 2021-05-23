import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Button, Checkbox, CheckboxProps, Icon } from 'semantic-ui-react'
// Another attempt at importing semantic CSS, didn't work, see App.global.css for more info
// import 'semantic-ui-css/semantic.min.css'

import App from '../model/App'
import StatusMsg from '../model/StatusMsg'
import SettingsView from './SettingsView'

// const styles = require('./App.css'); // Use require here to dodge "cannot find module" errors in VS Code

const appState = new App()
const AppContext = React.createContext<App>(appState) // This default context 'appState' should never be used, but keeps lint happy

type IProps = { }

interface MainView {
  rxDataDiv: React.RefObject<HTMLDivElement>,
  statusContentDiv: React.RefObject<HTMLDivElement>,
}

class MainView extends React.Component<IProps> {

  static contextType = AppContext

  constructor(props: IProps) {
    super(props)
    this.rxDataDiv = React.createRef<HTMLDivElement>()
    this.statusContentDiv = React.createRef<HTMLDivElement>()
  }

  componentDidMount = () => {

    const app = this.context
    console.log(app)

      // MONITOR KEYPRESSES, SEND TO SERIAL PORT IF PORT OPEN
  // We should use the 'keypress' event and not 'keydown', as 'keypress'
  // automatically handles control keys like shift/ctrl/alt while with 'keydown'
  // you get a separate event for pressing control keys
    document.addEventListener("keypress", (event) => {
      app.handleKeyPress(event)
    }, false);
  }

  componentDidUpdate = () => {
    const app = this.context
    // Keep the textarea scrolled to the bottom as data comes in if the checkbox is ticked
    if(app.autoScroll) {
      if(this.rxDataDiv.current !== null) {
        this.rxDataDiv.current.scrollTop = this.rxDataDiv.current.scrollHeight
      }
    }
    if(this.statusContentDiv.current !== null) {
      this.statusContentDiv.current.scrollTop = this.statusContentDiv.current.scrollHeight
    }
  }




  handleAutoScrollChanged = (_1: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
    const app = this.context
    console.log(data)
    if(typeof data.checked === 'boolean')
      app.setAutoScroll(data.checked)
  }

  render = () => {
    const app = this.context

    // Need to apply white-space: pre-wrap and word-break: break-all to the element holding serial port data, as we want:
    // 1) White space preserved
    // 2) \n to create a new line
    // 3) Text to wrap once it hits the maximum terminal width
    // Always apply +0.1 to the 'ch' units for terminal width, this prevents rounding errors from chopping
    // const rxSpans = app.rxSegments.map((segment) => {
    //   return <span key={segment.key}>{segment.text}</span>
    // })
    const rxSpans = null
    const rxDataView = (
      <div style={{ width: `${app.settings.terminalWidth}.1ch` }}>
        {/* <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{app.rxData}</span> */}
        {rxSpans}
        <span id="cursor">█</span>
      </div>)

    const statusMsgsView = app.statusMsgs.map((statusMsg: StatusMsg) => {
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
              disabled={app.settings.selSerialPort === 'none'}
              color={ app.serialPortState === 'Closed' ? 'green' : 'red' }
              style={{ height: '40px' }} >{ app.serialPortState === 'Closed' ? 'Open Port' : 'Close Port' }</Button>
            <div style={{ minWidth: '10px' }} />
            <Checkbox label='Auto-scroll' checked={app.autoScroll} onChange={this.handleAutoScrollChanged} />
          </div>
          <div style={{ minHeight: '10px' }}/>

          {/* RX DATA */}
          <div id="rx-data"
            ref={this.rxDataDiv}
            style={{ width: '100%', height: '100%', padding: '10px', fontFamily: 'monospace', borderStyle: 'solid', borderWidth: 'thin', overflowY: 'scroll' }}>
            {rxDataView}
          </div>
          <div style={{ minHeight: '10px' }}/>

          {/* STATUS BAR */}
          <div id="status-bar" style={{ minHeight: '80px', maxHeight: '80px', borderStyle: 'solid', borderWidth: 'thin' }}>
            <div ref={this.statusContentDiv} style={{ width: '100%', height: '100%', padding: '10px', overflowY: 'scroll' }}>
              {statusMsgsView}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default function AppView() {
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
