import { observer } from 'mobx-react-lite';

import { Backdrop, Box, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import TimelineIcon from '@mui/icons-material/Timeline';
import TerminalIcon from '@mui/icons-material/Terminal';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

// I got the following error here:
// error TS2307: Cannot find module 'virtual:pwa-register' or its corresponding type declarations.
// even with "vite-plugin-pwa/client" in the types array inside tsconfig.json. So getting typescript
// to ignore this import for now.
// @ts-ignore:next-line
import { registerSW } from 'virtual:pwa-register';

import { App, MainPanes } from '../model/App';
import { PortState } from '../model/Settings/PortConfigurationSettings/PortConfigurationSettings';
import './App.css';
import SettingsDialog from './Settings/SettingsView';
import TerminalView from './Terminals/TerminalsView';
import GraphView from './Graphing/GraphingView';
import LogoImage from './logo192.png';
import styles from './AppView.module.css';
import FakePortDialogView from './FakePorts/FakePortDialogView';
import { useEffect } from 'react';
import LoggingView from './Logging/LoggingView';
import { SelectionController, SelectionInfo } from '../model/SelectionController/SelectionController';
import 'src/model/WindowTypes';
import { DataType } from 'src/model/Settings/RxSettings/RxSettings';

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
    MuiButtonBase: {},
  },
});

/**
 * Maps a port state to the UI elements that should be used to represent it.
 */
const portStateToToolbarStatusProperties: { [key in PortState]: any } = {
  [PortState.CLOSED]: {
    color: 'red',
    text: 'Port CLOSED',
  },
  [PortState.CLOSED_BUT_WILL_REOPEN]: {
    color: 'orange',
    text: 'Port CLOSED (will reopen)',
  },
  [PortState.OPENED]: {
    color: 'green',
    text: 'Port OPENED',
  },
};

interface Props {
  // app: App;
}

const app = new App();

window.app = app;
window.SelectionController = SelectionController;

const AppView = observer((props: Props) => {
  useEffect(() => {
    // We need to register the service worker AFTER the app
    // has rendered, because it we do it before we won't
    // be able to enqueue a snackbar to tell the user there
    // is an update available
    const updateSW = registerSW({
      onNeedRefresh() {
        app.swOnNeedRefresh(updateSW);
      },
      onOfflineReady() {
        app.swOnOfflineReady();
      },
      // @ts-ignore:next-line
      onRegisterError(error) {
        app.swOnRegisterError(error);
      },
    });

    const initFn = async () => {
      await app.onAppUiLoaded();
    };

    initFn().catch(console.error);

    // Uncomment this if you want to test out the snackbar
    // for development reasons
    // app.swOnNeedRefresh((reloadPage) => {
    //   return Promise.resolve();
    // })
  }, []);

  // SELECT CORRECT MAIN PANE
  // ==========================================================================
  let mainPaneComponent;
  if (app.shownMainPane === MainPanes.SETTINGS) {
    mainPaneComponent = <SettingsDialog app={app} />;
  } else if (app.shownMainPane === MainPanes.TERMINAL) {
    mainPaneComponent = <TerminalView app={app} />;
  } else if (app.shownMainPane === MainPanes.GRAPHING) {
    mainPaneComponent = <GraphView app={app} />;
  } else if (app.shownMainPane === MainPanes.LOGGING) {
    mainPaneComponent = <LoggingView app={app} />;
  } else {
    throw Error(`Unsupported main pane. mainPane=${app.shownMainPane}`);
  }

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
          <img src={LogoImage} alt="NinjaTerm logo." style={{ width: '30px', marginBottom: '20px' }} />

          {/* ==================================================== */}
          {/* SETTINGS BUTTON */}
          {/* ==================================================== */}
          <Tooltip title="Show settings." placement="right" enterDelay={500} arrow>
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
          {/* TERMINAL BUTTON */}
          {/* ==================================================== */}
          <Tooltip title="Show the terminal" placement="right" enterDelay={500} arrow>
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
          {/* GRAPHING BUTTON */}
          {/* ==================================================== */}
          <Tooltip title="Show the graphing pane." placement="right" enterDelay={500} arrow>
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
          <Tooltip title="Show the logging pane." placement="right" enterDelay={500} arrow>
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
          {mainPaneComponent}

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
              gap: '20px',
              height: '25px',
            }}
          >
            {/* DATA TYPE */}
            <div style={{ padding: '0 10px' }}>{app.settings.rxSettings.getDataTypeNameForToolbarDisplay()}</div>

            {/* LOGGING ON/OFF */}
            <div style={{ backgroundColor: app.logging.isLogging ? '#388e3c' : '', padding: '0 10px' }}>{app.logging.isLogging ? 'Logging ON' : 'Logging OFF'}</div>

            {/* GRAPHING ON/OFF */}
            <div style={{ backgroundColor: app.graphing.graphingEnabled ? '#388e3c' : '', padding: '0 10px' }}>{app.graphing.graphingEnabled ? 'Graphing ON' : 'Graphing OFF'}</div>

            {/* TX/RX ACTIVITY INDICATORS */}
            {/* Use the key prop here to make React consider this a new element everytime the number of bytes changes. This will re-trigger the flashing animation as desired. Wrap each indicator in another box, so that the keys don't collide (because they might be the same). */}
            <Box>
              <Box key={app.numBytesTransmitted} className={styles.ledblue}>
                TX
              </Box>
            </Box>
            <Box>
              <Box key={app.numBytesReceived} className={styles.ledyellow}>
                RX
              </Box>
            </Box>
            {/* PORT CONFIG */}
            {/* Show port configuration in short hand, e.g. "115200 8n1" */}
            <Box sx={{ width: '80px' }}>{app.settings.portConfiguration.shortSerialConfigName}</Box>
            {/* PORT STATE */}
            <Box sx={{ backgroundColor: portStateToToolbarStatusProperties[app.portState].color, padding: '0 10px' }}>{portStateToToolbarStatusProperties[app.portState].text}</Box>
          </div>
        </div>

        <FakePortDialogView app={app} />

        {/* The SnackBar's position in the DOM does not matter, it is not positioned in the doc flow.
        Anchor to the bottom right as a terminals cursor will typically be in the bottom left */}
        <SnackbarProvider anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} />

        {/* The backdrop is not in the normal document flow. Shown as modal. Used when we want to indicate to the
        user that we are doing something and block them from clicking on anything (e.g. when opening port) */}
        <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={app.showCircularProgressModal}>
          <CircularProgress color="inherit" />
        </Backdrop>
      </div>
    </ThemeProvider>
  );
});

export default AppView;
