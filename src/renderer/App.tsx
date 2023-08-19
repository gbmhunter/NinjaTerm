import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import { Button, ButtonPropsColorOverrides, Typography } from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { observer } from 'mobx-react-lite';

import {
  AppStore,
  PortState,
  portStateToButtonProps,
} from '../stores/AppStore';
import './App.css';
import SettingsDialog from './SettingsDialog';

// Create dark theme for MUI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

interface Props {
  appStore: AppStore;
}

const MainRoute = observer((props: Props) => {
  // const appModel = useContext(AppStoreContext);
  const { appStore } = props;

  const txRxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Only scroll to bottom if enabled in app model
    if (txRxRef.current && appStore.txRxTextScrollBottom) {
      txRxRef.current.scrollTop = txRxRef.current.scrollHeight;
    }
  }, [appStore.txRxText, appStore.txRxTextScrollBottom]);

  const messageRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollTop = messageRef.current.scrollHeight;
    }
  }, [appStore.logText]);

  return (
    /* ThemeProvider sets theme for all MUI elements */
    <ThemeProvider theme={darkTheme}>
      <div id="outer-border" style={{ height: '100%', padding: '10px' }}>
        {/* SettingsDialog is a modal */}
        <SettingsDialog appStore={appStore} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            // flex: 1,
            // width: '100%',
            height: '100%',
            // margin: '30px',
            // padding: '30px',
          }}
        >
          {/* =============== TOP MENU BAR ================ */}
          <div id="menu" style={{ height: '50px' }}>
            <Button
              variant="text"
              onClick={() => {
                appStore.setSettingsDialogOpen(true);
              }}
            >
              Settings
            </Button>
            <Button
              variant="text"
              color={
                portStateToButtonProps[appStore.portState]
                  .color as OverridableStringUnion<
                  | 'inherit'
                  | 'primary'
                  | 'secondary'
                  | 'success'
                  | 'error'
                  | 'info'
                  | 'warning',
                  ButtonPropsColorOverrides
                >
              }
              onClick={() => {
                if (appStore.portState === PortState.CLOSED) {
                  appStore.openPort();
                } else if (appStore.portState === PortState.OPENED) {
                  appStore.closePort();
                } else {
                  throw Error(
                    `Unsupported port state. portState=${appStore.portState}`
                  );
                }
              }}
            >
              {portStateToButtonProps[appStore.portState].text}
            </Button>
          </div>
          {/* ================== TX/RX TEXT ==================== */}
          <div
            id="input-output-text"
            ref={txRxRef}
            style={{
              flexGrow: '1',
              backgroundColor: '#161616',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap', // This allows \n to create new lines
              overflowY: 'scroll',
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            {appStore.txRxText}
          </div>
          <div id="footer">
            <div
              id="log-text"
              ref={messageRef}
              style={{
                height: '200px',
                backgroundColor: '#161616',
                whiteSpace: 'pre-wrap', // This allows \n to create new lines
                overflowY: 'scroll',

                padding: '10px',
                marginBottom: '10px',
              }}
            >
              <Typography>{appStore.logText}</Typography>
            </div>
          </div>
          <div id="bottom-status-bar" style={{ height: '20px' }}>
            <Typography>
              Port: {appStore.settings.selectedPortPath} | Port Status:{' '}
              {PortState[appStore.portState]}
            </Typography>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
});

const appStore = new AppStore();
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainRoute appStore={appStore} />} />
      </Routes>
    </Router>
  );
}
