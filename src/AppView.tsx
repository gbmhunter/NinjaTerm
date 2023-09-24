// import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import {
  Box,
  Button,
  ButtonPropsColorOverrides,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ClearIcon from '@mui/icons-material/Clear';
import SettingsIcon from '@mui/icons-material/Settings';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

import { App, PortState, portStateToButtonProps } from './model/App';
import './App.css';
import {
  DataViewConfiguration,
  dataViewConfigEnumToDisplayName,
} from './model/Settings/DataProcessingSettings';
import SettingsDialog from './Settings/SettingsView';
import TerminalView from './TerminalView';
import LogoImage from './logo192.png';

import KofiButton from "kofi-button"

// Create dark theme for MUI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#202020',
      paper: '#202020',
      // paper: deepOrange[900],
    },
    // primary: {
    //   main: '#dc3545', // your primary color
    // },
    // secondary: {
    //   main: '#35dccb', // your secondary color
    // },
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
  app: App;
}

const AppView = observer((props: Props) => {
  const { app } = props;

  const statusMsgDivRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (statusMsgDivRef.current && app.statusMsgScrollLock) {
      statusMsgDivRef.current.scrollTop = statusMsgDivRef.current.scrollHeight;
    }
  }, [app.statusMsgs.length, app.statusMsgScrollLock]);

  // TERMINAL CREATION
  // =================
  // Create terminals based on selected configuration
  let terminals;
  if (app.settings.dataProcessing.appliedData.fields.dataViewConfiguration.value === DataViewConfiguration.SINGLE_TERMINAL) {
    // Show only 1 terminal
    terminals = <TerminalView appStore={app} terminal={app.txRxTerminal} testId='tx-rx-terminal-view' />;
  } else if (app.settings.dataProcessing.appliedData.fields.dataViewConfiguration.value === DataViewConfiguration.SEPARATE_TX_RX_TERMINALS) {
    // Shows 2 terminals, 1 for TX data and 1 for RX data
    terminals = <div style={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '50%', display: 'flex' }}>
        <TerminalView appStore={app} terminal={app.txTerminal} testId='tx-terminal-view'/>
      </div>
      <div style={{ height: '50%', display: 'flex' }}>
        <TerminalView appStore={app} terminal={app.rxTerminal} testId='rx-terminal-view' />
      </div>
    </div>;
  } else {
    throw Error(
      `Unsupported data view configuration. dataViewConfiguration=${app.settings.dataProcessing.appliedData.fields.dataViewConfiguration.value}`
    );
  }

  // Attach listener to catch key presses over entire app
  const keyEvent = 'keypress';
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      app.handleKeyPress(event);
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
        <SettingsDialog appStore={app} />
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
              alignItems: 'center',
              height: '40px',
              gap: '10px',
              marginBottom: '10px',
            }}>
            <img src={LogoImage} alt="NinjaTerm logo." style={{ width: '30px' }} />
            <Button
              variant="outlined"
              onClick={() => {
                app.setSettingsDialogOpen(true);
              }}
              startIcon={<SettingsIcon />}
              data-testid="settings-button">
              Settings
            </Button>
            <Button
              variant="outlined"
              color={
                portStateToButtonProps[app.portState]
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
                if (app.portState === PortState.CLOSED) {
                  app.openPort();
                } else if (app.portState === PortState.OPENED) {
                  app.closePort();
                } else {
                  throw Error(
                    `Unsupported port state. portState=${app.portState}`
                  );
                }
              }}
              startIcon={portStateToButtonProps[app.portState].icon}
              disabled={app.port === null}
            >
              {portStateToButtonProps[app.portState].text}
            </Button>
            {/* ================== CLEAR DATA BUTTON ==================== */}
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={() => {
                app.clearAllData();
              }}>
              Clear Data
            </Button>
            {/* ============================ DATA VIEW CONFIGURATION =========================== */}
            <Tooltip
              title="Controls how to display the TX and RX data. Different use cases required different view configurations."
              placement="left">
              <FormControl size="small" sx={{ minWidth: '210px' }}>
                <InputLabel>Data View Configuration</InputLabel>
                <Select
                  name="dataViewConfiguration"
                  value={
                    app.settings.dataProcessing.visibleData.fields
                      .dataViewConfiguration.value
                  }
                  onChange={(e) => {
                    app.settings.dataProcessing.onFieldChange(
                      e.target.name,
                      Number(e.target.value)
                    );
                    // In the settings dialog, this same setting is under the influence of
                    // an Apply button. But on the main screen, lets just apply changes automatically
                    app.settings.dataProcessing.applyChanges();
                  }}
                  sx={{ fontSize: '0.8rem' }}>
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

            {/* ============================ LOCAL TX ECHO SWITCH =========================== */}
            <FormControlLabel control={
                <Switch
                  name="localTxEcho"
                  checked={app.settings.dataProcessing.appliedData.fields.localTxEcho.value} onChange={(e) => {
                  app.settings.dataProcessing.onFieldChange(
                    e.target.name,
                    e.target.checked
                  );
                  // In the settings dialog, this same setting is under the influence of
                  // an Apply button. But on the main screen, lets just apply changes automatically
                  app.settings.dataProcessing.applyChanges();
                }} />
              } label="Local TX Echo" />

            {/* ============================ VERSION NUMBER =========================== */}
            {/* Push to right hand side of screen */}
            <Typography sx={{ marginLeft: 'auto' }}>v{app.version}</Typography>

            {/* ============================ Ko-Fi "Donate" button =========================== */}
            <KofiButton color="#29abe0" title="Donate" kofiID="M4M8CBE56" />
          </Box>
          {/* ================== DATA PANES ==================== */}
          {terminals}
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
            {/* Show port configuration in short hand, e.g. "115200 8n1" */}
            <Box>{app.settings.shortSerialConfigName}</Box>
            <Box>Port {PortState[app.portState]}</Box>
          </Box>
        </div>
        {/* The SnackBar's position in the DOM does not matter, it is not positioned in the doc flow.
        Anchor to the bottom right as a terminals cursor will typically be in the bottom left */}
        <SnackbarProvider anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} />
      </div>
    </ThemeProvider>
  );
});

export default AppView;
