import {
  Box,
  Button,
  ButtonPropsColorOverrides,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { OverridableStringUnion } from '@mui/types';
import KofiButton from 'kofi-button';
import { observer } from 'mobx-react-lite';

import { App, PortType } from 'src/App';
import { PortState } from 'src/Settings/PortConfiguration/PortConfiguration';
import SingleTerminalView from './SingleTerminal/SingleTerminalView';
import {
  DataViewConfiguration,
  dataViewConfigEnumToDisplayName,
} from 'src/Settings/Display/DisplaySettings';
import ApplyableTextFieldView from 'src/Components/ApplyableTextFieldView';
import { portStateToButtonProps } from 'src/Components/PortStateToButtonProps';

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;

  // TERMINAL CREATION
  // ==========================================================================
  // Create terminals based on selected configuration
  let terminals;
  if (app.settings.displaySettings.dataViewConfiguration === DataViewConfiguration.SINGLE_TERMINAL) {
    // Show only 1 terminal
    terminals = <SingleTerminalView
                  appStore={app}
                  terminal={app.terminals.txRxTerminal}
                  testId='tx-rx-terminal-view'
                  useWindowing={true}
                />;
  } else if (app.settings.displaySettings.dataViewConfiguration === DataViewConfiguration.SEPARATE_TX_RX_TERMINALS) {
    // Shows 2 terminals, 1 for TX data and 1 for RX data
    terminals = <div style={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '50%', display: 'flex' }}>
        <SingleTerminalView appStore={app} terminal={app.terminals.txTerminal} testId='tx-terminal-view'/>
      </div>
      <div style={{ height: '50%', display: 'flex' }}>
        <SingleTerminalView appStore={app} terminal={app.terminals.rxTerminal} testId='rx-terminal-view' />
      </div>
    </div>;
  } else {
    throw Error(
      `Unsupported data view configuration. dataViewConfiguration=${app.settings.displaySettings.dataViewConfiguration}`
    );
  }

  return (
    <div id="terminal-view-outer"
      style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',

        // overflowY: hidden important so that the single terminal panes get smaller when the
        // window height is made smaller. Without this, scrollbars appear.
        // The negative margin and then positive padding cancel each over out...BUT they
        // do let the outer glow on a focused terminal still show. Without this, it would
        // be clipped because we set the overflow to be hidden
        overflowY: 'hidden',
        margin: '-10px',
        padding: '10px',
      }}
    >
    <Box
      id="menu"
      sx={{
        display: "flex",
        alignItems: "center",
        height: "40px",
        gap: "10px",
        marginBottom: "10px",
      }}
    >
      {/* ================== OPEN/CLOSE BUTTON ==================== */}
      <Button
        variant="outlined"
        color={
          portStateToButtonProps[app.portState].color as OverridableStringUnion<
            | "inherit"
            | "primary"
            | "secondary"
            | "success"
            | "error"
            | "info"
            | "warning",
            ButtonPropsColorOverrides
          >
        }
        onClick={() => {
          if (app.portState === PortState.CLOSED) {
            app.openPort();
          } else if (app.portState === PortState.CLOSED_BUT_WILL_REOPEN) {
            app.stopWaitingToReopenPort();
          } else if (app.portState === PortState.OPENED) {
            app.closePort(false);
          } else {
            throw Error(`Unsupported port state. portState=${app.portState}`);
          }
        }}
        startIcon={portStateToButtonProps[app.portState].icon}
        disabled={(app.portState === PortState.CLOSED) && (app.port === null) && (app.lastSelectedPortType === PortType.REAL)}
        sx={{ width: "180px" }}
      >
        {" "}
        {/* Specify a width to prevent it resizing when the text changes */}
        {portStateToButtonProps[app.portState].text}
      </Button>
      {/* CLEAR DATA BUTTON */}
      {/* ==================================================================== */}
      <Button
        variant="outlined"
        startIcon={<DeleteIcon />}
        onClick={() => {
          app.clearAllData();
        }}
      >
        Clear Data
      </Button>
      {/* FILTER TEXT INPUT */}
      {/* ======================================================= */}
      <Tooltip
        title={
          <div>
            Filters the rows of data from the terminal based on the specified search pattern. Useful when you have lots of data and want to focus on a specific subset of information.
          </div>
        }
        placement="left"
      >
        <ApplyableTextFieldView
          size="small"
          label="Filter"
          variant="outlined"
          applyableTextField={app.terminals.filterText}
          sx={{ width: "200px" }}
        />
      </Tooltip>
      {/* DATA VIEW CONFIGURATION */}
      {/* ======================================================= */}
      <Tooltip
        title={
          <div>
            Controls how to display the TX and RX data. Different use cases require different view configurations.
            <ul>
              <li>Single terminal: TX and RX data is combined in the same pane. Useful for terminal style applications when escape codes are used.</li>
              <li>Separate TX/RX terminals: TX and RX data are kept in separate panes. Useful for when you have a lot of incoming basic RX data and what to still see the data you are sending.</li>
            </ul>
          </div>
        }
        placement="left"
      >
        <FormControl size="small" sx={{ minWidth: "210px" }}>
          <InputLabel>Data View Configuration</InputLabel>
          <Select
            name="dataViewConfiguration"
            value={app.settings.displaySettings.dataViewConfiguration}
            onChange={(e) => {
              app.settings.displaySettings.setDataViewConfiguration(Number(e.target.value));
            }}
            sx={{ fontSize: "0.8rem" }}
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

      {/* =============================================================================== */}
      {/* CHAR SIZE */}
      {/* =============================================================================== */}
      <Tooltip title="The font size (in pixels) of characters displayed in the terminal."
        followCursor
        arrow
      >
        <ApplyableTextFieldView
          id="outlined-basic"
          name="charSizePx"
          label="Char Size"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">px</InputAdornment>
            ),
          }}
          applyableTextField={app.settings.displaySettings.charSizePx}
          sx={{ width: "80px" }}
        />
      </Tooltip>

      {/* ============================ LOCAL TX ECHO SWITCH =========================== */}
      <FormControlLabel
        control={
          <Switch
            name="localTxEcho"
            checked={app.settings.dataProcessingSettings.localTxEcho}
            onChange={(e) => {
              app.settings.dataProcessingSettings.setLocalTxEcho(e.target.checked);
            }}
          />
        }
        label="Local TX Echo"
      />

      {/* ============================ VERSION NUMBER =========================== */}
      {/* Push to right hand side of screen */}
      <Typography sx={{ marginLeft: "auto" }}>v{app.version}</Typography>

      {/* ============================ Ko-Fi "Donate" button =========================== */}
      <KofiButton color="#29abe0" title="Donate" kofiID="M4M8CBE56" />
    </Box>
    {terminals}
    </div>
  );
});