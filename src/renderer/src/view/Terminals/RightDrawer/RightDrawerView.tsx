import { observer } from 'mobx-react-lite';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { useState, useEffect } from 'react';
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
} from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { OverridableStringUnion } from '@mui/types';

import { App, MainPanes } from '@/model/App';
import { PortType } from '@/model/SerialController/SerialController';
import MacroView from './MacroRowView';
import MacroSettingsModalView from './MacroSettingsModalView';
import ApplyableTextFieldView from '@/view/Components/ApplyableTextFieldView';
import { DataViewConfiguration, dataViewConfigEnumToDisplayName } from '@/model/Settings/DisplaySettings/DisplaySettings';
import {
  DEFAULT_BAUD_RATES,
  NUM_DATA_BITS_OPTIONS,
  NumDataBits,
  Parity,
  PortState,
  STOP_BIT_OPTIONS,
  StopBits,
  ConnectionType,
} from '@/model/Settings/PortSettings/PortSettings';
import { portStateToButtonProps } from '@/view/Components/PortStateToButtonProps';

import { SettingsCategories } from '@/model/Settings/Settings';
import FlowControlView from './FlowControlView';
import { CustomAccordionSummary } from './CustomAccordionSummary';

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;

  const rightDrawer = app.terminals.rightDrawer;

  // Local state for socket port input to allow empty/partial values during editing
  const [socketPortInput, setSocketPortInput] = useState<string>(
    app.settings.portConfiguration.socketPort.toString()
  );

  // Sync local state when model value changes externally
  useEffect(() => {
    setSocketPortInput(app.settings.portConfiguration.socketPort.toString());
  }, [app.settings.portConfiguration.socketPort]);

  // Create macro rows
  const macroRows = app.terminals.rightDrawer.macroController.macrosArray.map((macro, index) => {
    return <MacroView key={index} app={app} macroController={app.terminals.rightDrawer.macroController} macro={macro} macroIdx={index} />;
  });

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
        {/* =============================================================================================== */}
        {/* QUICK CONNECTION SETTINGS */}
        {/* =============================================================================================== */}
        <Accordion disableGutters expanded={rightDrawer.quickPortSettingsIsExpanded} onChange={rightDrawer.handleQuickPortSettingsAccordionChange} sx={{ width: '100%' }}>
          <CustomAccordionSummary expandIcon={<ArrowDownwardIcon />} data-testid="quick-port-settings-accordion-summary">
            Quick Connection Settings
          </CustomAccordionSummary>
          <AccordionDetails>
            {/* ============================================================== */}
            {/* CONNECTION TYPE */}
            {/* ============================================================== */}
            <div style={{ marginBottom: 16, width: '100%' }}>
              <FormControl sx={{ mt: 1, minWidth: 200 }} size="small">
                <InputLabel>Connection Type</InputLabel>
                <Select
                  value={app.settings.portConfiguration.connectionType}
                  label="Connection Type"
                  disabled={app.serialController.portState !== PortState.CLOSED}
                  onChange={(e) => {
                    app.settings.portConfiguration.setConnectionType(e.target.value as ConnectionType);
                  }}
                >
                  <MenuItem value={ConnectionType.SERIAL_PORT}>Serial Port</MenuItem>
                  <MenuItem value={ConnectionType.SOCKET}>Socket</MenuItem>
                  <MenuItem value={ConnectionType.BLUETOOTH}>Bluetooth</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* ========================================================================================================================== */}
            {/* SERIAL PORT SETTINGS */}
            {/* ========================================================================================================================== */}
            {/* Show serial port settings if serial port is selected */}
            {app.settings.portConfiguration.connectionType === ConnectionType.SERIAL_PORT && (
            <>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '5px' }}>
              {/* ============================================================== */}
              {/* BAUD RATE */}
              {/* ============================================================== */}
              <Tooltip
                {...app.settings.displaySettings.getBasicTooltipConfig()}
                title="The baud rate (bits/second) to use on the serial port. You can select one of the popular pre-defined options or enter in a custom rate. Custom value must be a integer in the range [1, 2000000 (2M)]. Most OSes/hardware will accept values outside their valid range without erroring, but will just not work properly. Common baud rates include 9600, 56700 and 115200. If you receive garbage data, it might be because you have the wrong baud rate selected."
                placement="left"
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
                  disabled={app.serialController.portState !== PortState.CLOSED && !app.settings.portConfiguration.allowSettingsChangesWhenOpen}
                  sx={{ mt: 1, width: 160 }}
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
              <Tooltip
                {...app.settings.displaySettings.getBasicTooltipConfig()}
                title="The number of bits in each frame of data. This is typically set to 8 bits (i.e. 1 byte)."
              >
                <FormControl sx={{ mt: 1, minWidth: 160 }} size="small">
                  <InputLabel>Num. data bits</InputLabel>
                  <Select
                    value={app.settings.portConfiguration.numDataBits}
                    label="Num. Data Bits"
                    disabled={app.serialController.portState !== PortState.CLOSED && !app.settings.portConfiguration.allowSettingsChangesWhenOpen}
                    onChange={async (e) => {
                      await app.settings.portConfiguration.setNumDataBits(e.target.value as NumDataBits);
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
                {...app.settings.displaySettings.getBasicTooltipConfig()}
                title='The parity is an extra bit of data in a frame which is set to make the total number of 1s in the frame equal to the parity setting. If "none", no parity bit is used or expected. If "odd", an odd number of 1s is expected, if "even" an even number of 1s is expected. "none" is the most common setting.'
                placement="left"
              >
                <FormControl sx={{ mt: 1, minWidth: 160 }} size="small">
                  <InputLabel>Parity</InputLabel>
                  <Select
                    value={app.settings.portConfiguration.parity}
                    label="Parity"
                    disabled={app.serialController.portState !== PortState.CLOSED && !app.settings.portConfiguration.allowSettingsChangesWhenOpen}
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
              <Tooltip
                {...app.settings.displaySettings.getBasicTooltipConfig()}
                title='The num. of stop bits is the number of bits used to mark the end of the frame. "1" is the most common setting.'
                placement="left"
              >
                <FormControl sx={{ mt: 1, minWidth: 160 }} size="small">
                  <InputLabel>Stop bits</InputLabel>
                  <Select
                    value={app.settings.portConfiguration.stopBits}
                    label="Stop Bits"
                    disabled={app.serialController.portState !== PortState.CLOSED && !app.settings.portConfiguration.allowSettingsChangesWhenOpen}
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
            </div>

            </>
            )}

            {/* ========================================================================================================================== */}
            {/* SOCKET SETTINGS */}
            {/* ========================================================================================================================== */}
            {/* Show socket settings if socket is selected */}
            {app.settings.portConfiguration.connectionType === ConnectionType.SOCKET && (
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '5px' }}>
              {/* ============================================================== */}
              {/* HOST */}
              {/* ============================================================== */}
              <TextField
                label="Host"
                value={app.settings.portConfiguration.socketHost}
                disabled={app.serialController.portState !== PortState.CLOSED}
                onChange={(e) => {
                  app.settings.portConfiguration.setSocketHost(e.target.value);
                }}
                sx={{ mt: 1, width: 200 }}
                size="small"
                helperText="IP address or hostname"
              />

              {/* ============================================================== */}
              {/* PORT */}
              {/* ============================================================== */}
              <TextField
                label="Port"
                value={socketPortInput}
                disabled={app.serialController.portState !== PortState.CLOSED}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty field and digits only
                  if (value === '' || /^\d+$/.test(value)) {
                    setSocketPortInput(value);

                    // Update the model only if it's a valid number within range
                    if (value !== '' && /^\d+$/.test(value)) {
                      const port = parseInt(value, 10);
                      if (port > 0 && port <= 65535) {
                        app.settings.portConfiguration.setSocketPort(port);
                      }
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  let finalValue: number;

                  if (value === '' || isNaN(parseInt(value, 10))) {
                    // Reset to current model value if empty or invalid
                    finalValue = app.settings.portConfiguration.socketPort;
                  } else {
                    const port = parseInt(value, 10);
                    if (port < 1) {
                      finalValue = 1;
                    } else if (port > 65535) {
                      finalValue = 65535;
                    } else {
                      finalValue = port;
                    }
                  }

                  // Update both local state and model
                  setSocketPortInput(finalValue.toString());
                  app.settings.portConfiguration.setSocketPort(finalValue);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value;
                    let finalValue: number;

                    if (value === '' || isNaN(parseInt(value, 10))) {
                      finalValue = app.settings.portConfiguration.socketPort;
                    } else {
                      const port = parseInt(value, 10);
                      if (port < 1) {
                        finalValue = 1;
                      } else if (port > 65535) {
                        finalValue = 65535;
                      } else {
                        finalValue = port;
                      }
                    }

                    // Update both local state and model
                    setSocketPortInput(finalValue.toString());
                    app.settings.portConfiguration.setSocketPort(finalValue);
                  }
                }}
                sx={{ mt: 1, width: 120 }}
                size="small"
                helperText="Port number (1-65535)"
              />
            </div>
            )}

            {/* =============================================================== */}
            {/* GENERAL SETTINGS - Only show "Allow settings changes when open" for serial ports */}
            {/* =============================================================== */}
            {app.settings.portConfiguration.connectionType === ConnectionType.SERIAL_PORT && (
              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <Tooltip
                  title="Check this if you want to be able to quickly change serial port settings when the port is open. If a serial port setting is changed when the port is open, the port will be quickly closed and opened again."
                  {...app.settings.displaySettings.getBasicTooltipConfig()}
                  placement="left"
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
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px' }}>
              {/* =============================================================== */}
              {/* MORE SETTINGS BUTTON */}
              {/* =============================================================== */}
              <Button
                variant="outlined"
                onClick={() => {
                  // Navigate to Port Settings where users can select a port
                  app.setShownMainPane(MainPanes.SETTINGS);
                  app.settings.setActiveSettingsCategory(SettingsCategories.CONNECTION_CONFIGURATION);
                }}
                // Only let user select a new port if current one is closed
                disabled={app.serialController.portState !== PortState.CLOSED}
                data-testid="request-port-access"
                sx={{ width: '150px' }}
              >
                More Settings
              </Button>
              {/* =============================================================== */}
              {/* OPEN/CLOSE BUTTON */}
              {/* =============================================================== */}
              <Button
                variant="contained"
                color={
                  portStateToButtonProps[app.serialController.portState].color as OverridableStringUnion<
                    'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
                    ButtonPropsColorOverrides
                  >
                }
                onClick={() => {
                  if (app.serialController.portState === PortState.CLOSED) {
                    app.serialController.openPort();
                  } else if (app.serialController.portState === PortState.CLOSED_BUT_WILL_REOPEN) {
                    app.serialController.stopWaitingToReopenPort();
                  } else if (app.serialController.portState === PortState.OPENED) {
                    app.serialController.closeConnection();
                  } else {
                    throw Error('Invalid port state.');
                  }
                }}
                // Disabled when connection is not ready to open
                disabled={!app.serialController.isReadyToOpen()}
                sx={{ width: '150px' }}
                data-testid="open-close-button"
              >
                {portStateToButtonProps[app.serialController.portState].text}
              </Button>
            </div>
          </AccordionDetails>
        </Accordion>
        {/* =============================================================================================== */}
        {/* FLOW CONTROL */}
        {/* =============================================================================================== */}
        <FlowControlView app={app} />
        {/* =============================================================================================== */}
        {/* OTHER QUICK SETTINGS */}
        {/* =============================================================================================== */}
        <Accordion disableGutters expanded={rightDrawer.otherQuickSettingsIsExpanded} onChange={rightDrawer.handleOtherQuickSettingsAccordionChange} sx={{ width: '100%' }}>
          <CustomAccordionSummary expandIcon={<ArrowDownwardIcon />}>Other Quick Settings</CustomAccordionSummary>
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
              {...app.settings.displaySettings.getBasicTooltipConfig()}
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
              placement="left"
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
              <Tooltip
                {...app.settings.displaySettings.getBasicTooltipConfig()}
                title="The font size (in pixels) of characters displayed in the terminal."
                placement="left"
              >
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
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Click this to send the break signal for 200ms to the serial port."
              placement="left"
            >
              <span>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={async () => {
                    await app.sendBreakSignal();
                  }}
                  disabled={app.serialController.portState !== PortState.OPENED}
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
          <CustomAccordionSummary expandIcon={<ArrowDownwardIcon />} data-testid="macros-accordion-summary">
            Macros
          </CustomAccordionSummary>
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
