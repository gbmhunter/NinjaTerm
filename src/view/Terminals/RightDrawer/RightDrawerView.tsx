import { observer } from 'mobx-react-lite';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import {
  Accordion,
  AccordionDetails,
  Autocomplete,
  Button,
  ButtonPropsColorOverrides,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  styled,
} from '@mui/material';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { OverridableStringUnion } from '@mui/types';

import { App, MainPanes, PortType } from 'src/model/App';
import MacroView from './MacroRowView';
import MacroSettingsModalView from './MacroSettingsModalView';
import ApplyableTextFieldView from 'src/view/Components/ApplyableTextFieldView';
import { DataViewConfiguration, dataViewConfigEnumToDisplayName } from 'src/model/Settings/DisplaySettings/DisplaySettings';
import {
  DEFAULT_BAUD_RATES,
  FlowControl,
  NUM_DATA_BITS_OPTIONS,
  Parity,
  PortState,
  STOP_BIT_OPTIONS,
  StopBits,
} from 'src/model/Settings/PortSettings/PortSettings';
import { portStateToButtonProps } from 'src/view/Components/PortStateToButtonProps';

import { SettingsCategories } from 'src/model/Settings/Settings';

// This code was modified from https://mui.com/material-ui/react-accordion/#customization
const AccordionSummary = styled((props: AccordionSummaryProps) => <MuiAccordionSummary expandIcon={<ArrowDownwardIcon sx={{ fontSize: '0.9rem' }} />} {...props} />)(
  ({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
      marginLeft: theme.spacing(1),
    },
  })
);

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;

  const rightDrawer = app.terminals.rightDrawer;

  // Create macro rows
  const macroRows = app.terminals.rightDrawer.macroController.macrosArray.map((macro, index) => {
    return <MacroView key={index} app={app} macroController={app.terminals.rightDrawer.macroController} macro={macro} macroIdx={index} />;
  });

  const tooltipSettings = {
    followCursor: true,
    arrow: true,
    placement: 'left' as const, // Needed to keep typescript happy
    // Do not use enterDelay, this does not work for successive tooltips (they
    // enter immediately if used shortly after the first)
    enterNextDelay: 1000,
    leaveDelay: 50,
  };

  return (
    <Resizable // This what provides the resizing functionality for the right drawer
      className="box"
      width={rightDrawer.drawerWidth_px}
      onResize={(e, { node, size, handle }) => {
        rightDrawer.setDrawerWidth(size.width);
      }}
      resizeHandles={['w']}
      axis="x"
      // style={{ padding: '0px 0px 0px 10px', margin: '0px 0px 0px 0px', fontSize: '12px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
      handle={
        <div
          style={{
            height: '100%',
            width: '10px', // This determines how easy it is to click on the resizable element
            // backgroundColor: "#DC3545",
            position: 'absolute',
            left: 0,
            top: 0,
            cursor: 'ew-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: '1px solid #505050', // Same border color as used on the left-hand nav menu
          }}
        ></div>
      }
    >
      {/* ResizableBox requires a single child component */}
      <div
        className="resizable-child-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          overflowY: 'auto',
          overflowX: 'hidden',
          width: rightDrawer.drawerWidth_px + 'px',
        }}
      >
        <div style={{ height: '6px' }} /> {/* Spacer to prevent select input title from being clipped */}
        <Accordion disableGutters expanded={rightDrawer.quickPortSettingsIsExpanded} onChange={rightDrawer.handleQuickPortSettingsAccordionChange} sx={{ width: '100%' }}>
          <AccordionSummary expandIcon={<ArrowDownwardIcon />} data-testid="quick-port-settings-accordion-summary">
            Quick Port Settings
          </AccordionSummary>
          <AccordionDetails>
            <div style={{ fontSize: '12px' }}>
              For more port settings, go to the{' '}
              <Link
                component="button"
                onClick={() => {
                  // Show Settings->Port Configuration view
                  app.setShownMainPane(MainPanes.SETTINGS);
                  app.settings.setActiveSettingsCategory(SettingsCategories.PORT_CONFIGURATION);
                }}
              >
                Port Settings view
              </Link>
              .
            </div>
            <div style={{ height: '10px' }} />
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
              {/* ============================================================== */}
              {/* BAUD RATE */}
              {/* ============================================================== */}
              <Tooltip
                title="The baud rate (bits/second) to use on the serial port. You can select one of the popular pre-defined options or enter in a custom rate. Custom value must be a integer in the range [1, 2000000 (2M)]. Most OSes/hardware will accept values outside their valid range without erroring, but will just not work properly. Common baud rates include 9600, 56700 and 115200. If you receive garbage data, it might be because you have the wrong baud rate selected."
                {...tooltipSettings}
              >
                <Autocomplete
                  freeSolo
                  options={DEFAULT_BAUD_RATES.map((option) => option.toString())}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Baud rate"
                      error={app.settings.portConfiguration.baudRateErrorMsg !== ''}
                      helperText={app.settings.portConfiguration.baudRateErrorMsg}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          // Apply baud rate
                          await app.settings.portConfiguration.setBaudRate();
                        }
                        // Prevent the global keydown event from being triggered
                        e.stopPropagation();
                      }}
                      onBlur={async () => {
                        // Apply baud rate
                        await app.settings.portConfiguration.setBaudRate();
                      }}
                    />
                  )}
                  disabled={app.portState !== PortState.CLOSED && !app.settings.portConfiguration.allowSettingsChangesWhenOpen}
                  sx={{ m: 1, width: 160 }}
                  size="small"
                  inputValue={app.settings.portConfiguration.baudRateInputValue}
                  onInputChange={(event, newInputValue) => {
                    app.settings.portConfiguration.setBaudRateInputValue(newInputValue);
                  }}
                />
              </Tooltip>
              {/* ============================================================== */}
              {/* NUM. DATA BITS */}
              {/* ============================================================== */}
              <Tooltip title="The number of bits in each frame of data. This is typically set to 8 bits (i.e. 1 byte)." {...tooltipSettings}>
                <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
                  <InputLabel>Num. data bits</InputLabel>
                  <Select
                    value={app.settings.portConfiguration.numDataBits}
                    label="Num. Data Bits"
                    disabled={app.portState !== PortState.CLOSED && !app.settings.portConfiguration.allowSettingsChangesWhenOpen}
                    onChange={async (e) => {
                      await app.settings.portConfiguration.setNumDataBits(e.target.value as number);
                    }}
                  >
                    {NUM_DATA_BITS_OPTIONS.map((numDataBits) => {
                      return (
                        <MenuItem key={numDataBits} value={numDataBits}>
                          {numDataBits.toString()}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Tooltip>
              {/* ============================================================== */}
              {/* PARITY */}
              {/* ============================================================== */}
              <Tooltip
                title='The parity is an extra bit of data in a frame which is set to make the total number of 1s in the frame equal to the parity setting. If "none", no parity bit is used or expected. If "odd", an odd number of 1s is expected, if "even" an even number of 1s is expected. "none" is the most common setting.'
                {...tooltipSettings}
              >
                <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
                  <InputLabel>Parity</InputLabel>
                  <Select
                    value={app.settings.portConfiguration.parity}
                    label="Parity"
                    disabled={app.portState !== PortState.CLOSED && !app.settings.portConfiguration.allowSettingsChangesWhenOpen}
                    onChange={async (e) => {
                      await app.settings.portConfiguration.setParity(e.target.value as Parity);
                    }}
                  >
                    {Object.values(Parity).map((parity) => {
                      return (
                        <MenuItem key={parity} value={parity}>
                          {parity}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Tooltip>
              {/* ============================================================== */}
              {/* STOP BITS */}
              {/* ============================================================== */}
              <Tooltip title='The num. of stop bits is the number of bits used to mark the end of the frame. "1" is the most common setting.' {...tooltipSettings}>
                <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
                  <InputLabel>Stop bits</InputLabel>
                  <Select
                    value={app.settings.portConfiguration.stopBits}
                    label="Stop Bits"
                    disabled={app.portState !== PortState.CLOSED && !app.settings.portConfiguration.allowSettingsChangesWhenOpen}
                    onChange={async (e) => {
                      await app.settings.portConfiguration.setStopBits(e.target.value as StopBits);
                    }}
                  >
                    {STOP_BIT_OPTIONS.map((stopBits) => {
                      return (
                        <MenuItem key={stopBits} value={stopBits}>
                          {stopBits.toString()}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Tooltip>
              {/* ============================================================== */}
              {/* FLOW CONTROL */}
              {/* ============================================================== */}
              <Tooltip
                title='Controls whether flow control is used. "none" results in no flow control being used. "hardware" results in the CTS (clear-to-send) and RTS (ready-to-send) lines being used. "none" is the most common option. CTS/RTS must be connected in hardware for this to work. If you are not seeing any data travel across your serial port, you might want to try changing this setting.'
                {...tooltipSettings}
              >
                <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
                  <InputLabel>Flow control</InputLabel>
                  <Select
                    value={app.settings.portConfiguration.flowControl}
                    label="Parity"
                    disabled={app.portState !== PortState.CLOSED && !app.settings.portConfiguration.allowSettingsChangesWhenOpen}
                    onChange={async (e) => {
                      await app.settings.portConfiguration.setFlowControl(e.target.value as FlowControl);
                    }}
                  >
                    {Object.values(FlowControl).map((flowControl) => {
                      return (
                        <MenuItem key={flowControl} value={flowControl}>
                          {flowControl}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Tooltip>
            </div>

            {/* =============================================================== */}
            {/* ALLOW SETTINGS CHANGES WHEN OPEN */}
            {/* =============================================================== */}
            <Tooltip
              title="Check this if you want to be able to quickly change settings when the port is open. Because of limitations in the Web Serial API, if a port setting is changed when the port is open, the port will be quickly closed and opened again."
              {...tooltipSettings}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={app.settings.portConfiguration.allowSettingsChangesWhenOpen}
                    onChange={(e) => {
                      app.settings.portConfiguration.setAllowSettingsChangesWhenOpen(e.target.checked);
                    }}
                  />
                }
                label="Allow settings changes when open (reconnect)"
              />
            </Tooltip>

            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px' }}>
              {/* =============================================================== */}
              {/* SELECT PORT BUTTON */}
              {/* =============================================================== */}
              <Button
                variant="outlined"
                onClick={() => {
                  app.scanForPorts();
                }}
                // Only let user select a new port if current one is closed
                disabled={app.portState !== PortState.CLOSED}
                data-testid="request-port-access"
                sx={{ width: '150px' }}
              >
                Select Port
              </Button>
              {/* =============================================================== */}
              {/* OPEN/CLOSE BUTTON */}
              {/* =============================================================== */}
              <Button
                variant="contained"
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
                    throw Error('Invalid port state.');
                  }
                }}
                // Disabled when port is closed and no port is selected, or if the baud rate is invalid
                disabled={
                  (app.portState === PortState.CLOSED && app.port === null && app.lastSelectedPortType !== PortType.FAKE) || app.settings.portConfiguration.baudRateErrorMsg !== ''
                }
                sx={{ width: '150px' }}
                data-testid="open-close-button"
              >
                {portStateToButtonProps[app.portState].text}
              </Button>
            </div>
          </AccordionDetails>
        </Accordion>
        {/* ======================================================= */}
        {/* OTHER QUICK SETTINGS */}
        {/* ======================================================= */}
        <Accordion disableGutters expanded={rightDrawer.otherQuickSettingsIsExpanded} onChange={rightDrawer.handleOtherQuickSettingsAccordionChange} sx={{ width: '100%' }}>
          <AccordionSummary expandIcon={<ArrowDownwardIcon />}>Other Quick Settings</AccordionSummary>
          <AccordionDetails>
            <div style={{ fontSize: '12px' }}>
              For more options, go to the{' '}
              <Link
                component="button"
                onClick={() => {
                  // Show the Settings view. The sub-view selected will be whatever
                  // was last selected by the user.
                  app.setShownMainPane(MainPanes.SETTINGS);
                }}
              >
                Settings view
              </Link>
              .
            </div>
            <div style={{ height: '10px' }} />
            {/* ======================================================= */}
            {/* DATA VIEW CONFIGURATION */}
            {/* ======================================================= */}
            <Tooltip
              title={
                <div>
                  Controls how to display the TX and RX data. Different use cases require different view configurations.
                  <ul>
                    <li>Single terminal: TX and RX data is combined in the same pane. Useful for terminal style applications when escape codes are used.</li>
                    <li>
                      Separate TX/RX terminals: TX and RX data are kept in separate panes. Useful for when you have a lot of incoming basic RX data and what to still see the data
                      you are sending.
                    </li>
                  </ul>
                </div>
              }
              {...tooltipSettings}
            >
              <FormControl size="small" style={{ minWidth: '210px', marginBottom: '10px' }}>
                <InputLabel>Data View Configuration</InputLabel>
                <Select
                  name="dataViewConfiguration"
                  value={app.settings.displaySettings.dataViewConfiguration}
                  onChange={(e) => {
                    app.settings.displaySettings.setDataViewConfiguration(Number(e.target.value));
                  }}
                  sx={{ fontSize: '0.8rem' }}
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
            <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
              {/* =============================================================================== */}
              {/* CHAR SIZE */}
              {/* =============================================================================== */}
              <Tooltip title="The font size (in pixels) of characters displayed in the terminal." {...tooltipSettings}>
                <ApplyableTextFieldView
                  id="outlined-basic"
                  name="charSizePx"
                  label="Char Size"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="start">px</InputAdornment>,
                  }}
                  applyableTextField={app.settings.displaySettings.charSizePx}
                  sx={{ width: '100px' }}
                />
              </Tooltip>
              {/* =============================================================================== */}
              {/* LOCAL TX ECHO SWITCH */}
              {/* =============================================================================== */}
              <FormControlLabel
                control={
                  <Switch
                    name="localTxEcho"
                    checked={app.settings.rxSettings.localTxEcho}
                    onChange={(e) => {
                      app.settings.rxSettings.setLocalTxEcho(e.target.checked);
                    }}
                  />
                }
                label="Local TX Echo"
              />
            </div>
            {/* ==================================================================== */}
            {/* SEND BREAK BUTTON */}
            {/* ==================================================================== */}
            <Tooltip title="Click this to send the break signal for 200ms to the serial port." {...tooltipSettings}>
              <span>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={async () => {
                    await app.sendBreakSignal();
                  }}
                  disabled={app.portState !== PortState.OPENED}
                  data-testid="send-break-button"
                >
                  Send BREAK
                </Button>
              </span>
            </Tooltip>
          </AccordionDetails>
        </Accordion>
        {/* =============================================================================== */}
        {/* MACROS */}
        {/* =============================================================================== */}
        <Accordion disableGutters expanded={rightDrawer.macrosIsExpanded} onChange={rightDrawer.handleMacrosAccordionChange} sx={{ width: '100%' }}>
          <AccordionSummary expandIcon={<ArrowDownwardIcon />} data-testid="macros-accordion-summary">
            Macros
          </AccordionSummary>
          <AccordionDetails>
            <div className="macro-rows-container" style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
              {macroRows}
            </div>
            <MacroSettingsModalView app={app} macroController={app.terminals.rightDrawer.macroController} />
          </AccordionDetails>
        </Accordion>
      </div>
    </Resizable>
  );
});
