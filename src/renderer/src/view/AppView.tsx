import { observer } from 'mobx-react-lite';
import React from 'react';

import { Backdrop, Box, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import TimelineIcon from '@mui/icons-material/Timeline';
import TerminalIcon from '@mui/icons-material/Terminal';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

// PWA functionality removed - not needed in Electron app

import { App, MainPanes } from '../model/App';
import { ConnState, ConnectionType } from '../model/Settings/PortSettings/PortSettings';
import './App.css';
import SettingsDialog from './Settings/SettingsView';
import TerminalView from './Terminals/TerminalsView';
import GraphView from './Graphing/GraphingView';
import LogoImage from './logo192.png';
import styles from './AppView.module.css';
import FakePortDialogView from './FakePorts/FakePortDialogView';
import { useEffect } from 'react';
import LoggingView from './Logging/LoggingView';
import SessionTabsView from './Sessions/SessionTabsView';
import { SelectionController } from '../model/SelectionController/SelectionController';
import 'src/model/WindowTypes';

import { SettingsCategories } from 'src/model/Settings/Settings';

// Create dark theme for MUI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#202020',
      paper: '#202020',
    },
    primary: {
      // Muted teal — complementary opposite of the logo red (#dc3545) so the
      // two colours reinforce instead of fight, and well clear of the
      // semantic success-green / warning-orange / error-red slots.
      main: '#5eead4',
    },
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
    MuiButtonBase: {},
  },
});

/**
 * Maps a port state to the UI elements that should be used to represent it.
 */
const connStateToToolbarStatusProperties: { [key in ConnState]: any } = {
  [ConnState.CLOSED]: {
    color: 'red',
    text: 'Conn CLOSED',
  },
  [ConnState.CLOSED_BUT_WILL_REOPEN]: {
    color: 'orange',
    text: 'Conn CLOSED (will reopen)',
  },
  [ConnState.OPENED]: {
    color: 'green',
    text: 'Conn OPENED',
  },
};

// AppView takes no props — it uses the module-level `app` singleton below.

const app = new App();

window.app = app;
window.SelectionController = SelectionController;

// Separate small components to isolate reactive updates
const ActivityIndicators = observer(({ app }: { app: App }) => (
  <>
    <Box style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <Box key={app.numBytesTransmitted} className={styles.ledblue}>
        TX
      </Box>
      <div style={{ fontSize: '0.8rem', minWidth: '65px', textAlign: 'left' }}>
        {app.formatRate(app.txRateBps)}
      </div>
    </Box>
    <Box style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <Box key={app.numBytesReceived} className={styles.ledyellow}>
        RX
      </Box>
      <div style={{ fontSize: '0.8rem', minWidth: '65px', textAlign: 'left' }}>
        {app.formatRate(app.rxRateBps)}
      </div>
    </Box>
  </>
));

const CpuIndicator = observer(({ app }: { app: App }) => (
  <div
    className={`${styles.onHover} ${styles.centerText}`}
    style={{
      backgroundColor: app.cpuUsagePercent > 80 ? '#d32f2f' : app.cpuUsagePercent > 60 ? '#f57c00' : '',
      padding: '0 5px',
      width: '80px',
    }}
  >
    CPU {Math.round(app.cpuUsagePercent)}%
  </div>
));

const StatusIndicators = observer(({ app }: { app: App }) => (
  <>
    <div
      className={`${styles.onHover} ${styles.centerText}`}
      onClick={() => {
        app.setShownMainPane(MainPanes.SETTINGS);
        app.settings.setActiveSettingsCategory(SettingsCategories.RX_SETTINGS);
      }}
      style={{
        backgroundColor: app.settings.rxSettings.localTxEcho ? '#388e3c' : '',
        padding: '0 5px',
        width: '100px',
      }}
    >
      {app.settings.rxSettings.localTxEcho ? 'Echo ON' : 'Echo OFF'}
    </div>

    <div
      className={`${styles.onHover} ${styles.centerText}`}
      onClick={() => {
        app.setShownMainPane(MainPanes.LOGGING);
      }}
      style={{
        backgroundColor: app.logging.isLogging ? '#388e3c' : '',
        padding: '0 5px',
        width: '110px',
      }}
    >
      {app.logging.isLogging ? 'Logging ON' : 'Logging OFF'}
    </div>

    <div
      className={`${styles.onHover} ${styles.centerText}`}
      onClick={() => {
        app.setShownMainPane(MainPanes.GRAPHING);
      }}
      style={{
        backgroundColor: app.graphing.graphingEnabled ? '#388e3c' : '',
        padding: '0 5px',
        width: '120px',
      }}
    >
      {app.graphing.graphingEnabled ? 'Graphing ON' : 'Graphing OFF'}
    </div>

    <div
      className={`${styles.onHover} ${styles.centerText}`}
      onClick={() => {
        app.setShownMainPane(MainPanes.SETTINGS);
        app.settings.setActiveSettingsCategory(SettingsCategories.RX_SETTINGS);
      }}
      style={{
        backgroundColor: app.settings.rxSettings.addTimestamps ? '#388e3c' : '',
        padding: '0 5px',
        width: '150px',
      }}
    >
      {app.settings.rxSettings.addTimestamps ? 'Timestamps ON' : 'Timestamps OFF'}
    </div>
  </>
));

const McpIndicator = observer(({ app }: { app: App }) => (
  <div
    className={`${styles.onHover} ${styles.centerText}`}
    onClick={() => {
      app.setShownMainPane(MainPanes.SETTINGS);
      app.settings.setActiveSettingsCategory(SettingsCategories.GENERAL);
    }}
    style={{
      backgroundColor: app.settings.generalSettings.mcpEnabled ? '#388e3c' : '',
      padding: '0 5px',
      width: '80px',
    }}
  >
    {app.settings.generalSettings.mcpEnabled ? 'MCP ON' : 'MCP OFF'}
  </div>
));

const DataTypeIndicator = observer(({ app }: { app: App }) => (
  <div
    className={`${styles.onHover} ${styles.centerText}`}
    onClick={() => {
      app.setShownMainPane(MainPanes.SETTINGS);
      app.settings.setActiveSettingsCategory(SettingsCategories.RX_SETTINGS);
    }}
    style={{ padding: '0 5px', width: '70px' }}
  >
    {app.settings.rxSettings.getDataTypeNameForToolbarDisplay()}
  </div>
));

const PortConfigIndicator = observer(({ app }: { app: App }) => (
  <div
    className={styles.onHover}
    onClick={() => {
      app.setShownMainPane(MainPanes.SETTINGS);
      app.settings.setActiveSettingsCategory(SettingsCategories.CONNECTION_CONFIGURATION);
    }}
    style={{ padding: '0 10px', whiteSpace: 'nowrap' }}
  >
    {app.settings.portConfiguration.shortSerialConfigName}
  </div>
));

const PortStatusIndicator = observer(({ app }: { app: App }) => {
  const getStatusText = (connState: ConnState, connectionType: ConnectionType) => {
    let connectionTypeName: string;
    if (connectionType === ConnectionType.SERIAL_PORT) {
      connectionTypeName = 'Port';
    } else if (connectionType === ConnectionType.SOCKET) {
      connectionTypeName = 'Socket';
    } else if (connectionType === ConnectionType.BLUETOOTH_LE) {
      connectionTypeName = 'Bluetooth';
    } else if (connectionType === ConnectionType.RTT) {
      connectionTypeName = 'RTT';
    } else {
      connectionTypeName = '???';
    }

    switch (connState) {
      case ConnState.CLOSED:
        return `${connectionTypeName} NOT CONN`;
      case ConnState.CLOSED_BUT_WILL_REOPEN:
        return `${connectionTypeName} NOT CONN (will reopen)`;
      case ConnState.OPENED:
        return `${connectionTypeName} CONN`;
      default:
        return `${connectionTypeName} UNKNOWN`;
    }
  };

  return (
    <div
      style={{
        backgroundColor: connStateToToolbarStatusProperties[app.connController.connState].color,
        padding: '0 10px' }}
    >
      {getStatusText(app.connController.connState, app.settings.portConfiguration.connectionType)}
    </div>
  );
});

const ProgressBackdrop = observer(({ app }: { app: App }) => (
  <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={app.showCircularProgressModal}>
    <CircularProgress color="inherit" />
  </Backdrop>
));

// Main layout component - only observes layout-related properties
const MainPaneSelector = observer(({ app }: { app: App }) => {
  // SELECT CORRECT MAIN PANE
  if (app.shownMainPane === MainPanes.SETTINGS) {
    return <SettingsDialog app={app} />;
  } else if (app.shownMainPane === MainPanes.TERMINAL) {
    return <TerminalView app={app} />;
  } else if (app.shownMainPane === MainPanes.GRAPHING) {
    return <GraphView app={app} />;
  } else if (app.shownMainPane === MainPanes.LOGGING) {
    return <LoggingView app={app} />;
  } else {
    throw Error(`Unsupported main pane. mainPane=${app.shownMainPane}`);
  }
});

const AppView = observer(() => {
  useEffect(() => {
    // Initialize the app after it has rendered
    const initFn = async () => {
      await app.onAppUiLoaded();
    };

    initFn().catch(console.error);
  }, []);

  // Attach listener to catch key presses over entire app
  // NOTE: keypress is not sufficient, as it does not fire when Backspace is pressed
  // const keyEvent = 'keypress';
  // const keyEvent = 'keydown';
  // useEffect(() => {
  //   const handleKeyDown = (event: KeyboardEvent) => {
  //     app.handleKeyDown(event);
  //   };
  //   window.addEventListener(keyEvent, handleKeyDown);

  //   return () => {
  //     window.removeEventListener(keyEvent, handleKeyDown);
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    /* ThemeProvider sets theme for all MUI elements */
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div
        id="outer-border"
        onKeyDown={(e) => {
          app.handleKeyDown(e);
        }}
        tabIndex={-1}
        style={{
          height: '100%',
          display: 'flex',
          padding: '5px 5px 5px 0px', // No padding on left
          outline: 'none', // Prevent weird white border when selected
          overflow: 'hidden', // Prevent scrollbars from appearing, force internal elements
          // to scroll instead
        }}
      >
        <div
          className="left-hand-app-bar"
          style={{
            width: '50px',
            padding: '10px',
            borderRight: '1px solid #505050',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          {/* ==================================================== */}
          {/* LOGO */}
          {/* ==================================================== */}
          <IconButton
            onClick={() => {
              app.setShownMainPane(MainPanes.TERMINAL);
            }}
            data-testid="logo-button"
          >
            <img src={LogoImage} alt="NinjaTerm logo." style={{ width: '30px' }} />
          </IconButton>
          <div style={{ marginBottom: '20px' }}></div>

          {/* ==================================================== */}
          {/* TERMINAL BUTTON */}
          {/* ==================================================== */}
          <Tooltip {...app.settings.displaySettings.getBasicTooltipConfig()} title="Show the terminal" placement="right">
            <IconButton
              onClick={() => {
                app.setShownMainPane(MainPanes.TERMINAL);
              }}
              color="primary"
              data-testid="show-terminal-button"
            >
              <TerminalIcon />
            </IconButton>
          </Tooltip>

          {/* ==================================================== */}
          {/* SETTINGS BUTTON */}
          {/* ==================================================== */}
          <Tooltip {...app.settings.displaySettings.getBasicTooltipConfig()} title="Show settings." placement="right">
            <IconButton
              onClick={() => {
                app.setShownMainPane(MainPanes.SETTINGS);
              }}
              color="primary"
              data-testid="settings-button"
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          {/* ==================================================== */}
          {/* GRAPHING BUTTON */}
          {/* ==================================================== */}
          <Tooltip {...app.settings.displaySettings.getBasicTooltipConfig()} title="Show the graphing pane." placement="right">
            <IconButton
              onClick={() => {
                app.setShownMainPane(MainPanes.GRAPHING);
              }}
              color="primary"
              data-testid="show-graphing-pane-button"
            >
              <TimelineIcon />
            </IconButton>
          </Tooltip>
          {/* ==================================================== */}
          {/* LOGGING BUTTON */}
          {/* ==================================================== */}
          <Tooltip {...app.settings.displaySettings.getBasicTooltipConfig()} title="Show the logging pane." placement="right">
            <IconButton
              onClick={() => {
                app.setShownMainPane(MainPanes.LOGGING);
              }}
              color="primary"
              data-testid="show-logging-pane-button"
            >
              <SaveAsIcon />
            </IconButton>
          </Tooltip>
          {/* ==================================================== */}
          {/* HELP BUTTON (opens the online manual) */}
          {/* ==================================================== */}
          {/* marginTop: auto pushes Help to the bottom of the sidebar, away from
              the pane-switching buttons — it opens the external manual rather
              than switching panes. */}
          <Tooltip {...app.settings.displaySettings.getBasicTooltipConfig()} title="Open the NinjaTerm manual in your browser." placement="right">
            <IconButton
              onClick={async () => {
                try {
                  await window.electronAPI.shell.openExternal("https://ninjaterm.mbedded.ninja/manual");
                } catch (error) {
                  console.error("Failed to open manual:", error);
                }
              }}
              color="primary"
              data-testid="show-help-button"
              sx={{ marginTop: 'auto' }}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </div>
        <div
          className="right-hand-column"
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            // flex: 1,
            width: '100%',
            height: '100%',
            overflowY: 'clip',
            // margin: '30px',
            padding: '0 5px 0 5px',
          }}
        >
          {/* =================================================================================== */}
          {/* MAIN PANE */}
          {/* =================================================================================== */}
          <SessionTabsView app={app} />
          {/* Keyed by session so a tab switch remounts the pane against the
              new session's terminals rather than diffing one into the other. */}
          <MainPaneSelector key={app.activeSession.id} app={app} />

          {/* =================================================================================== */}
          {/* BOTTOM APP TOOLBAR */}
          {/* =================================================================================== */}
          <div
            id="bottom-status-bar"
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'end',
              alignItems: 'center',
              fontSize: '0.9rem',
              gap: '10px',
              height: '25px',
            }}
          >
            {/* DATA TYPE - Non-reactive element */}
            <DataTypeIndicator app={app} />

            {/* STATUS INDICATORS - Separated reactive components */}
            <StatusIndicators app={app} />

            {/* MCP SERVER INDICATOR */}
            <McpIndicator app={app} />

            {/* TX/RX ACTIVITY INDICATORS - Isolated reactive component */}
            <ActivityIndicators app={app} />

            {/* CPU USAGE INDICATOR - Isolated reactive component */}
            <CpuIndicator app={app} />

            {/* PORT CONFIG - Non-reactive, only changes when user modifies settings */}
            <PortConfigIndicator app={app} />

            {/* PORT STATE - Isolated reactive component */}
            <PortStatusIndicator app={app} />
          </div>
        </div>

        <FakePortDialogView app={app} />

        {/* The SnackBar's position in the DOM does not matter, it is not positioned in the doc flow.
        Anchor to the bottom right as a terminals cursor will typically be in the bottom left */}
        <SnackbarProvider anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} />

        {/* The backdrop is not in the normal document flow. Shown as modal. Used when we want to indicate to the
        user that we are doing something and block them from clicking on anything (e.g. when opening port) */}
        <ProgressBackdrop app={app} />
      </div>
    </ThemeProvider>
  );
});

export default AppView;
