import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { CSSProperties, useEffect, useRef, WheelEvent } from 'react';
import { observer } from 'mobx-react-lite';

import {
  Box,
  Button,
  ButtonPropsColorOverrides,
  IconButton,
  Typography,
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ClearIcon from '@mui/icons-material/Clear';
import SettingsIcon from '@mui/icons-material/Settings';

import { AppStore, PortState, portStateToButtonProps } from 'stores/App';
import { StatusMsg, StatusMsgSeverity } from 'stores/StatusMsg';
import './App.css';
import SettingsDialog from './Settings/SettingsView';

// Create dark theme for MUI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    // Make all fonts slightly smaller by default for a dense layout
    fontSize: 13,
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          // Override default font size for all tool-tips, as default is a little
          // to small
          fontSize: '0.8rem',
        },
      },
    },
  },
});

interface Props {
  appStore: AppStore;
}

const AppView = observer((props: Props) => {
  // const appModel = useContext(AppStoreContext);
  const { appStore } = props;

  const txRxRef = useRef<HTMLInputElement>(null);

  // Run this after every render, as it's too computationally expensive to
  // do a deep compare of the text segments
  useEffect(() => {
    // Only scroll to bottom if enabled in app model
    if (txRxRef.current && appStore.txRxTextScrollLock) {
      txRxRef.current.scrollTop = txRxRef.current.scrollHeight;
    }
  });

  const statusMsgDivRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (statusMsgDivRef.current && appStore.statusMsgScrollLock) {
      statusMsgDivRef.current.scrollTop = statusMsgDivRef.current.scrollHeight;
    }
  }, [appStore.statusMsgs.length, appStore.statusMsgScrollLock]);

  // Need to apply white-space: pre-wrap and word-break: break-all to the element holding serial port data, as we want:
  // 1) White space preserved
  // 2) \n to create a new line
  // 3) Text to wrap once it hits the maximum terminal width
  // Always apply +0.1 to the 'ch' units for terminal width, this prevents rounding errors from chopping
  const rxSpans = appStore.rxSegments.map((segment) => {
    return (
      <span key={segment.key} style={{ color: segment.color }}>
        {segment.text}
      </span>
    );
  });

  // Generate UI showing the status messages
  const statusMsgs = appStore.statusMsgs.map((statusMsg: StatusMsg) => {
    if (statusMsg.severity === StatusMsgSeverity.INFO) {
      return (
        <span key={statusMsg.id} style={{ display: 'block' }}>
          {statusMsg.msg}
        </span>
      );
      // eslint-disable-next-line no-else-return
    } else if (statusMsg.severity === StatusMsgSeverity.OK) {
      return (
        <span key={statusMsg.id} style={{ display: 'block', color: 'green' }}>
          {statusMsg.msg}
        </span>
      );
      // eslint-disable-next-line no-else-return
    } else if (statusMsg.severity === StatusMsgSeverity.ERROR) {
      return (
        <span key={statusMsg.id} style={{ display: 'block', color: 'red' }}>
          ERROR: {statusMsg.msg}
        </span>
      );
    } else {
      throw Error('Unrecognized severity.');
    }
  });

  // If the width in chars is set to anything but 0, set the width in "ch" units and make
  // sure text will break on anything. Otherwise if width is set to 0, make pane 100% wide and don't
  // break
  let dataPaneWidth = '';
  let dataPaneWordBreak: CSSProperties['wordBreak'];
  if (
    appStore.settings.dataProcessing.appliedData.fields.wrappingWidthChars.value >
    0
  ) {
    dataPaneWidth = `${appStore.settings.dataProcessing.appliedData.fields.wrappingWidthChars.value}ch`;
    dataPaneWordBreak = 'break-all';
  } else {
    dataPaneWidth = '100%';
    dataPaneWordBreak = 'normal';
  }

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
          {/* =============================================================== */}
          {/* ========================== TOP MENU BAR ======================= */}
          {/* =============================================================== */}
          <Box
            id="menu"
            sx={{
              display: 'flex',
              height: '40px',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <Button
              variant="outlined"
              onClick={() => {
                appStore.setSettingsDialogOpen(true);
              }}
              startIcon={<SettingsIcon />}
            >
              Settings
            </Button>
            <Button
              variant="outlined"
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
              startIcon={portStateToButtonProps[appStore.portState].icon}
              disabled={appStore.settings.selectedPortPath === ''}
            >
              {portStateToButtonProps[appStore.portState].text}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={() => {
                appStore.clearRxData();
              }}
            >
              Clear Data
            </Button>
          </Box>
          {/* ================== TX/RX TEXT ==================== */}
          <div
            id="input-output-text"
            onWheel={(e: WheelEvent<HTMLDivElement>) => {
              // Disable scroll lock if enabled and the scroll direction was
              // up (negative deltaY)
              if (e.deltaY < 0 && appStore.txRxTextScrollLock) {
                appStore.setTxRxScrollLock(false);
              }
            }}
            style={{
              flexGrow: '1',
              backgroundColor: '#161616',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap', // This allows \n to create new lines
              // overflowY: 'scroll',
              // padding: '10px',
              marginBottom: '10px',
              position: 'relative', // This is so we can use position: absolute for the down icon
            }}
          >
            <div
              ref={txRxRef}
              style={{
                height: '100%',
                width: '100%',
                position: 'absolute',
                overflowY: 'scroll',
                padding: '10px',
              }}
            >
              <div
                id="limiting-text-width"
                style={{ wordBreak: dataPaneWordBreak, width: dataPaneWidth }}
              >
                {rxSpans}
                {/* Blinking cursor at end of data */}
                <span id="cursor">█</span>
              </div>
            </div>
            {/* ================== SCROLL LOCK ARROW ==================== */}
            <IconButton
              onClick={() => {
                appStore.setTxRxScrollLock(true);
              }}
              sx={{
                display: appStore.txRxTextScrollLock ? 'none' : 'block',
                position: 'absolute', // Fix it to the bottom right of the TX/RX view port
                bottom: '20px',
                right: '30px',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              <ArrowDownwardIcon
                sx={{
                  width: '40px',
                  height: '40px',
                }}
              />
            </IconButton>
          </div>
          <div id="footer">
            {/* ================== STATUS MESSAGES ==================== */}
            <div
              id="log-text"
              onWheel={(e: WheelEvent<HTMLDivElement>) => {
                // Disable scroll lock if enabled and the scroll direction was
                // up (negative deltaY)
                if (e.deltaY < 0 && appStore.statusMsgScrollLock) {
                  appStore.setStatusMsgScrollLock(false);
                }
              }}
              style={{
                height: '200px',
                backgroundColor: '#161616',
                whiteSpace: 'pre-wrap', // This allows \n to create new lines
                marginBottom: '10px',
                position: 'relative',
              }}
            >
              <div
                ref={statusMsgDivRef}
                style={{
                  height: '100%',
                  width: '100%',
                  position: 'absolute',
                  overflowY: 'scroll',
                  padding: '10px',
                }}
              >
                <Typography sx={{ fontSize: '0.9rem' }}>
                  {statusMsgs}
                </Typography>
              </div>
              {/* ================== SCROLL LOCK ARROW ==================== */}
              <IconButton
                onClick={() => {
                  appStore.setStatusMsgScrollLock(true);
                }}
                sx={{
                  display: appStore.statusMsgScrollLock ? 'none' : 'block',
                  position: 'absolute', // Fix it to the bottom right of the TX/RX view port
                  bottom: '20px',
                  right: '30px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                <ArrowDownwardIcon
                  sx={{
                    width: '40px',
                    height: '40px',
                  }}
                />
              </IconButton>
            </div>
          </div>
          {/* ================== BOTTOM TOOLBAR BAR ==================== */}
          <Box
            id="bottom-status-bar"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'end',
              fontSize: '0.9rem',
              gap: '20px',
            }}
            style={{ height: '20px' }}
          >
            <Box>
              Port:{' '}
              {appStore.settings.selectedPortPath !== ''
                ? appStore.settings.selectedPortPath
                : 'n/a'}{' '}
            </Box>
            <Box>{PortState[appStore.portState]}</Box>
          </Box>
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
        <Route path="/" element={<AppView appStore={appStore} />} />
      </Routes>
    </Router>
  );
}