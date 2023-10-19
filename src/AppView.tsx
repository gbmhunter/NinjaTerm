import { observer } from 'mobx-react-lite';

import {
  Box,
  IconButton,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import TimelineIcon from '@mui/icons-material/Timeline';
import TerminalIcon from '@mui/icons-material/Terminal';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

import { App, MainPanes, PortState } from './App';
import './App.css';
import SettingsDialog from './Settings/SettingsView';
import TerminalView from './Terminal/TerminalView';
import GraphView from './Graphing/GraphingView';
import LogoImage from './logo192.png';
import styles from './AppView.module.css'
import FakePortDialogView from 'FakePorts/FakePortDialogView';

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

/**
 * Maps a port state to a colour used in the port state status background on the bottom toolbar.
 */
const portStateToBackgroundColor: { [key in PortState]: string; } = {
  [PortState.CLOSED]: 'red',
  [PortState.OPENED]: 'green',
};

interface Props {
  app: App;
}

const AppView = observer((props: Props) => {
  const { app } = props;

  // SELECT CORRECT MAIN PANE
  // ==========================================================================
  let mainPaneComponent;
  if (app.shownMainPane === MainPanes.SETTINGS) {
    mainPaneComponent = <SettingsDialog appStore={app} />;
  } else if (app.shownMainPane === MainPanes.TERMINAL) {
    mainPaneComponent = <TerminalView app={app} />;
  } else if (app.shownMainPane === MainPanes.GRAPHING) {
    mainPaneComponent = <GraphView app={app} />;
  } else {
    throw Error(
      `Unsupported main pane. mainPane=${app.shownMainPane}`
    );
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
      <div id="outer-border"
        style={{
          height: '100%',
          display: 'flex',
          padding: '10px 10px 10px 0px', // No padding on left
        }}
      >
        <div className="left-hand-app-bar"
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

          {/* ================== LOGO ==================== */}
          <img src={LogoImage} alt="NinjaTerm logo." style={{ width: '30px', marginBottom: '20px' }} />

          {/* SETTINGS BUTTON */}
          {/* ==================================================== */}
          <IconButton
            onClick={() => {
              app.setShownMainPane(MainPanes.SETTINGS);
            }}
            color="primary"
            data-testid="settings-button">
            <SettingsIcon />
          </IconButton>

          {/* TERMINAL BUTTON */}
          {/* ==================================================== */}
          <IconButton
            onClick={() => {
              app.setShownMainPane(MainPanes.TERMINAL);
            }}
            color="primary"
            data-testid="show-terminal-button">
              <TerminalIcon />
          </IconButton>
          {/* GRAPHING BUTTON */}
          {/* ==================================================== */}
          <IconButton
            onClick={() => {
              app.setShownMainPane(MainPanes.GRAPHING);
            }}
            color="primary"
            data-testid="show-graphing-pane-button">
              <TimelineIcon />
          </IconButton>

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
            // margin: '30px',
            padding: '0 0 0 10px',
          }}
        >

          {/* MAIN PANE */}
          {/* =================================================================================== */}
          {mainPaneComponent}

          {/* BOTTOM APP TOOLBAR */}
          {/* =================================================================================== */}
          <Box
            id="bottom-status-bar"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'end',
              alignItems: 'center',
              fontSize: '0.9rem',
              gap: '20px',
            }}
            style={{ height: '20px' }}
          >
            {/* GRAPHING ON/OFF */}
            <div>{ app.graphing.graphingEnabled ? 'Graphing ON' : 'Graphing OFF'}</div>

            {/* TX/RX ACTIVITY INDICATORS */}
            {/* Use the key prop here to make React consider this a new element everytime the number of bytes changes. This will re-trigger the flashing animation as desired. Wrap each indicator in another box, so that the keys don't collide (because they might be the same). */}
            <Box>
              <Box key={app.numBytesTransmitted} className={styles.ledblue}>TX</Box>
            </Box>
            <Box>
              <Box key={app.numBytesReceived} className={styles.ledyellow}>RX</Box>
            </Box>
            {/* PORT CONFIG */}
            {/* Show port configuration in short hand, e.g. "115200 8n1" */}
            <Box>{app.settings.shortSerialConfigName}</Box>
            {/* PORT STATE */}
            <Box sx={{ backgroundColor: portStateToBackgroundColor[app.portState], padding: '0 10px' }}>Port {PortState[app.portState]}</Box>
          </Box>
        </div>

        <FakePortDialogView app={app} />

        {/* The SnackBar's position in the DOM does not matter, it is not positioned in the doc flow.
        Anchor to the bottom right as a terminals cursor will typically be in the bottom left */}
        <SnackbarProvider anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} />

      </div>
    </ThemeProvider>
  );
});

export default AppView;
