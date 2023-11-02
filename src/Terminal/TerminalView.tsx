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
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { OverridableStringUnion } from '@mui/types';
import KofiButton from "kofi-button";
import { observer } from "mobx-react-lite";

import { App, portStateToButtonProps, PortState, PortType } from "src/App";
import SingleTerminalView from "./SingleTerminal/SingleTerminalView";
import {
  DataViewConfiguration,
  dataViewConfigEnumToDisplayName,
} from 'src/Settings/Display/DisplaySettings';

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
                  terminal={app.txRxTerminal}
                  testId='tx-rx-terminal-view'
                  useWindowing={true}
                />;
  } else if (app.settings.displaySettings.dataViewConfiguration === DataViewConfiguration.SEPARATE_TX_RX_TERMINALS) {
    // Shows 2 terminals, 1 for TX data and 1 for RX data
    terminals = <div style={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '50%', display: 'flex' }}>
        <SingleTerminalView appStore={app} terminal={app.txTerminal} testId='tx-terminal-view'/>
      </div>
      <div style={{ height: '50%', display: 'flex' }}>
        <SingleTerminalView appStore={app} terminal={app.rxTerminal} testId='rx-terminal-view' />
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

        // This is important so that the single terminal panes get smaller when the
        // window height is made smaller. Without this, scrollbars appear
        overflowY: 'hidden',
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
          } else if (app.portState === PortState.OPENED) {
            app.closePort();
          } else {
            throw Error(`Unsupported port state. portState=${app.portState}`);
          }
        }}
        startIcon={portStateToButtonProps[app.portState].icon}
        disabled={(app.port === null) && (app.lastSelectedPortType === PortType.REAL)}
        sx={{ width: "150px" }}
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
      {/* ============================ DATA VIEW CONFIGURATION =========================== */}
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
              app.settings.displaySettings.setDataViewConfiguration(e.target.value as DataViewConfiguration);
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
        <TextField
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
          value={
            app.settings.displaySettings.charSizePx.dispValue
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            app.settings.displaySettings.setCharSizePxDisp(event.target.value);
          }}
          onBlur={() => {
            app.settings.displaySettings.applyCharSizePx();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              app.settings.displaySettings.applyCharSizePx();
            }
          }}
          error={
            app.settings.displaySettings.charSizePx.hasError
          }
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
