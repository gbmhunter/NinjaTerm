import { observer } from 'mobx-react-lite';

import {
  Box,
  Button,
  ButtonPropsColorOverrides,
  FormControl,
  FormControlLabel,
  IconButton,
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
import TimelineIcon from '@mui/icons-material/Timeline';
import TerminalIcon from '@mui/icons-material/Terminal';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

import { App, MainPanes, PortState, portStateToButtonProps } from '../model/App';
import './App.css';
import {
  DataViewConfiguration,
  dataViewConfigEnumToDisplayName,
} from '../model/Settings/DataProcessingSettings';
import SettingsDialog from './Settings/SettingsView';
import TerminalView from './TerminalView';
import GraphView from './Graphing/GraphingView';
import LogoImage from './logo192.png';
import styles from './AppView.module.css'

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

  let mainPaneComponent;
  if (app.shownMainPane === MainPanes.TERMINAL) {
    mainPaneComponent = terminals;
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
        {/* SettingsDialog is a modal */}
        <SettingsDialog appStore={app} />

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
          <img src={LogoImage} alt="NinjaTerm logo." style={{ width: '30px' }} />

          {/* SETTINGS BUTTON */}
          {/* ==================================================== */}
          <IconButton
            onClick={() => {
              app.setSettingsDialogOpen(true);
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
              data-testid="terminal-button">
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
            // width: '100%',
            height: '100%',
            // margin: '30px',
            padding: '0 0 0 10px',
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
              marginBottom: '10px'}}>


            {/* ================== OPEN/CLOSE BUTTON ==================== */}
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
              sx={{ width: '150px' }}> {/* Specify a width to prevent it resizing when the text changes */}
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
          {/* MAIN PANE */}
          {/* =================================================================================== */}
          {mainPaneComponent}
          {/* ================== BOTTOM TOOLBAR BAR ==================== */}
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
            {/* TX/RX ACTIVITY INDICATORS */}
            {/* Use the key prop here to make React consider this a new element everytime the number of bytes changes. This will re-trigger the flashing animation as desired. Wrap each indicator in another box, so that the keys don't collide (because they might be the same). */}
            <Box>
              <Box key={app.numBytesTransmitted} className={styles.ledblue}>TX</Box>
            </Box>
            <Box>
              <Box key={app.numBytesReceived} className={styles.ledyellow}>RX</Box>
            </Box>
            {/* Show port configuration in short hand, e.g. "115200 8n1" */}
            <Box>{app.settings.shortSerialConfigName}</Box>
            <Box sx={{ backgroundColor: portStateToBackgroundColor[app.portState], padding: '0 10px' }}>Port {PortState[app.portState]}</Box>
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
