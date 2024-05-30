import {
  Box,
  Button,
  ButtonPropsColorOverrides,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { OverridableStringUnion } from '@mui/types';
import KofiButton from 'kofi-button';
import { observer } from 'mobx-react-lite';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

import { App, PortType } from 'src/model/App';
import { PortState } from 'src/model/Settings/PortConfigurationSettings/PortConfigurationSettings';
import SingleTerminalView from './SingleTerminal/SingleTerminalView';
import { DataViewConfiguration, dataViewConfigEnumToDisplayName } from 'src/model/Settings/DisplaySettings/DisplaySettings';
import ApplyableTextFieldView from 'src/view/Components/ApplyableTextFieldView';
import { portStateToButtonProps } from 'src/view/Components/PortStateToButtonProps';
import RightDrawerView from './RightDrawer/RightDrawerView';

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;

  const isSmallScreen = useMediaQuery((theme) => (theme as any).breakpoints.down('lg'));

  // TERMINAL CREATION
  // ==========================================================================
  // Create terminals based on selected configuration
  let terminals;
  if (app.settings.displaySettings.dataViewConfiguration === DataViewConfiguration.SINGLE_TERMINAL) {
    // Show only 1 terminal
    terminals = <SingleTerminalView terminal={app.terminals.txRxTerminal} directionLabel="TX/RX" testId="tx-rx-terminal-view" />;
  } else if (app.settings.displaySettings.dataViewConfiguration === DataViewConfiguration.SEPARATE_TX_RX_TERMINALS) {
    // Shows 2 terminals, 1 for TX data and 1 for RX data
    terminals = (
      <div style={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '50%', display: 'flex' }}>
          <SingleTerminalView terminal={app.terminals.txTerminal} directionLabel="TX" testId="tx-terminal-view" />
        </div>
        <div style={{ height: '50%', display: 'flex' }}>
          <SingleTerminalView terminal={app.terminals.rxTerminal} directionLabel="RX" testId="rx-terminal-view" />
        </div>
      </div>
    );
  } else {
    throw Error(`Unsupported data view configuration. dataViewConfiguration=${app.settings.displaySettings.dataViewConfiguration}.`);
  }

  const buttonSx = {
    // minWidth: isSmallScreen ? '10px' : '180px',
    '& .MuiButton-startIcon': {
      marginRight: isSmallScreen ? '0px' : undefined,
      marginLeft: isSmallScreen ? '0px' : undefined,
    },
  };

  let showHideSidePanelButtonText;
  if (isSmallScreen) {
    showHideSidePanelButtonText = '';
  } else if (!app.terminals.showRightDrawer) {
    showHideSidePanelButtonText = 'Show Side Panel';
  } else {
    showHideSidePanelButtonText = 'Hide Side Panel';
  }

  return (
    <div
      id="terminal-view-outer"
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
          display: 'flex',
          alignItems: 'center',
          height: '40px',
          gap: '10px',
          marginBottom: '10px',
        }}
      >
        {/* ==================================================================== */}
        {/* OPEN/CLOSE BUTTON */}
        {/* ==================================================================== */}
        <Button
          variant="outlined"
          color={
            portStateToButtonProps[app.portState].color as OverridableStringUnion<
              'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
              ButtonPropsColorOverrides
            >
          }
          onClick={() => {
            if (app.portState === PortState.CLOSED) {
              app.openPort();
            } else if (app.portState === PortState.CLOSED_BUT_WILL_REOPEN) {
              app.stopWaitingToReopenPort();
            } else if (app.portState === PortState.OPENED) {
              app.closePort();
            } else {
              throw Error(`Unsupported port state. portState=${app.portState}`);
            }
          }}
          startIcon={portStateToButtonProps[app.portState].icon}
          disabled={app.portState === PortState.CLOSED && app.port === null && app.lastSelectedPortType === PortType.REAL}
          sx={buttonSx}
          data-testid="open-close-button"
        >
          {/* Specify a width to prevent it resizing when the text changes */}
          {isSmallScreen ? '' : portStateToButtonProps[app.portState].text}
        </Button>
        {/* ==================================================================== */}
        {/* CLEAR DATA BUTTON */}
        {/* ==================================================================== */}
        <Button
          variant="outlined"
          startIcon={<DeleteIcon />}
          onClick={() => {
            app.clearAllData();
          }}
          sx={buttonSx}
        >
          {isSmallScreen ? '' : 'Clear'}
        </Button>
        {/* ======================================================= */}
        {/* FILTER TEXT INPUT */}
        {/* ======================================================= */}
        <Tooltip
          title={
            <div>
              Filters the rows of data from the terminal based on the specified search pattern. Useful when you have lots of data and want to focus on a specific subset of
              information.
              <br />
              <ul>
                <li>The row that the cursor is on is always shown.</li>
                <li>Delete all text to disable filtering.</li>
              </ul>
            </div>
          }
          placement="left"
        >
          <ApplyableTextFieldView
            size="small"
            label="Filter"
            variant="outlined"
            applyableTextField={app.terminals.filterText}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    color="primary"
                    onClick={() => {
                      app.terminals.filterText.setDispValue('');
                      app.terminals.filterText.apply();
                    }}
                  >
                    <CancelIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ width: '200px' }}
          />
        </Tooltip>

        {/* ==================================================================== */}
        {/* SHOW/HIDE SIDE PANEL BUTTON */}
        {/* ==================================================================== */}
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            // Toggle the right drawer
            if (!app.terminals.showRightDrawer) {
              app.terminals.setShowRightDrawer(true);
            } else {
              app.terminals.setShowRightDrawer(false);
            }
          }}
          startIcon={<VisibilityIcon />}
          sx={buttonSx}
          style={{ width: '200px' }}
          data-testid="show-hide-side-panel-button"
        >
          {/* Specify a width to prevent it resizing when the text changes */}
          {showHideSidePanelButtonText}
        </Button>

        {/* ============================ VERSION NUMBER =========================== */}
        {/* Push to right hand side of screen */}
        <Typography sx={{ marginLeft: 'auto' }}>v{app.version}</Typography>

        {/* ============================ Ko-Fi "Donate" button =========================== */}
        <KofiButton color="#29abe0" title="Donate" kofiID="M4M8CBE56" />
      </Box>
      <div
        className="terminals-and-drawer-row"
        style={{
          width: '100%', height: '100%',
          flexGrow: 1,
          display: 'flex', flexDirection: 'row', position: 'relative',
          overflow: 'hidden', padding: '3px' }} // Hide overflow to allow for correct sizing. But this
                                                // blocks the outer flow effect, so add 3px padding
        >
        {terminals}
        {/* ==================================================================== */}
        {/* RIGHT DRAWER (wrapped in a div so we can hide it all) */}
        {/* ==================================================================== */}
        <div style={{ height: '100%', display: app.terminals.showRightDrawer ? 'flex' : 'none', flexDirection: 'row', position: 'relative' }}>
          <div style={{ width: '5px' }}></div>
          <RightDrawerView app={app} />
        </div>
      </div>
    </div>
  );
});
