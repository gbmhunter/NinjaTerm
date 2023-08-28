import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useEffect, useRef, WheelEvent } from 'react';
import { observer } from 'mobx-react-lite';

import {
  Box,
  Button,
  ButtonPropsColorOverrides,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ClearIcon from '@mui/icons-material/Clear';
import SettingsIcon from '@mui/icons-material/Settings';
import CssBaseline from '@mui/material/CssBaseline';

import { AppStore, PortState, portStateToButtonProps } from 'stores/App';
import { StatusMsg, StatusMsgSeverity } from 'stores/StatusMsg';
import './App.css';
import {
  DataViewConfiguration,
  dataViewConfigEnumToDisplayName,
} from 'stores/Settings/DataProcessingSettings';
import DataPaneView from './DataPaneView';
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

  const statusMsgDivRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (statusMsgDivRef.current && appStore.statusMsgScrollLock) {
      statusMsgDivRef.current.scrollTop = statusMsgDivRef.current.scrollHeight;
    }
  }, [appStore.statusMsgs.length, appStore.statusMsgScrollLock]);

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

  // Create data panes based on selected configuration
  let pane1;
  let pane2;
  if (
    appStore.settings.dataProcessing.appliedData.fields.dataViewConfiguration
      .value === DataViewConfiguration.RX_PANE
  ) {
    // Show only 1 pane, which only contains RX data
    pane1 = (
      <DataPaneView
        appStore={appStore}
        dataPane={appStore.dataPane1}
        textSegments={appStore.rxSegments}
      />
    );
  } else if (
    appStore.settings.dataProcessing.appliedData.fields.dataViewConfiguration
      .value === DataViewConfiguration.COMBINED_TX_RX_PANE
  ) {
    // Show only 1 pane, but contains both TX and RX pane
    pane1 = (
      <DataPaneView
        appStore={appStore}
        dataPane={appStore.dataPane1}
        textSegments={appStore.rxSegments}
      />
    );
  } else if (
    appStore.settings.dataProcessing.appliedData.fields.dataViewConfiguration
      .value === DataViewConfiguration.SEPARATE_TX_RX_PANES
  ) {
    // Shows 2 panes, 1 for TX data and 1 for RX data
    pane1 = (
      <DataPaneView
        appStore={appStore}
        dataPane={appStore.dataPane1}
        textSegments={appStore.rxSegments}
      />
    );
    pane2 = (
      <DataPaneView
        appStore={appStore}
        dataPane={appStore.dataPane1}
        textSegments={appStore.rxSegments}
      />
    );
  } else {
    throw Error(
      `Unsupported data view configuration. dataViewConfiguration=${appStore.settings.dataProcessing.appliedData.fields.dataViewConfiguration.value}`
    );
  }

  // Attach listener to catch key presses over entire app
  const keyEvent = 'keypress';
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      appStore.handleKeyPress(event);
    };
    window.addEventListener(keyEvent, handleKeyDown);

    return () => {
      window.removeEventListener(keyEvent, handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /* ThemeProvider sets theme for all MUI elements */
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
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
            {/* ================== CLEAR DATA BUTTON ==================== */}
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={() => {
                appStore.clearTxData();
                appStore.clearRxData();
              }}
            >
              Clear Data
            </Button>
            {/* ============================ DATA VIEW CONFIGURATION =========================== */}
            <Tooltip
              title="Control whether 1 or 2 data panes are used to display the data."
              placement="left"
            >
              <FormControl size="small">
                <InputLabel>Data View Configuration</InputLabel>
                <Select
                  name="dataViewConfiguration"
                  value={
                    appStore.settings.dataProcessing.visibleData.fields
                      .dataViewConfiguration.value
                  }
                  onChange={(e) => {
                    appStore.settings.dataProcessing.onFieldChange(
                      e.target.name,
                      Number(e.target.value)
                    );
                    // In the settings dialog, this same setting is under the influence of
                    // an Apply button. But on the main screen, lets just apply changes automatically
                    appStore.settings.dataProcessing.applyChanges();
                  }}
                  sx={{ marginBottom: '20px', fontSize: '1.0rem' }}
                >
                  {Object.keys(DataViewConfiguration)
                    .filter((key) => !Number.isNaN(Number(key)))
                    .map((key) => {
                      return (
                        <MenuItem key={key} value={key}>
                          {dataViewConfigEnumToDisplayName[key]}
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>
            </Tooltip>
          </Box>
          {/* ================== DATA PANE 1 ==================== */}
          {pane1}
          {pane2}
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
