import {
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ButtonPropsColorOverrides,
  Typography,
  Tooltip,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Radio,
  TableSortLabel,
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import { App } from '@/model/App';
import {
  PortSettings,
  ConnState,
  DEFAULT_BAUD_RATES,
  NUM_DATA_BITS_OPTIONS,
  Parity,
  STOP_BIT_OPTIONS,
  StopBits,
  NumDataBits,
  ConnectionType,
  RttInterface,
} from '@/model/Settings/PortSettings/PortSettings';
import { COMMON_JLINK_DEVICES } from '@/model/Settings/PortSettings/JLinkDevices';
import { portStateToButtonProps } from '@/view/Components/PortStateToButtonProps';
import styles from './ConnectionSettingsView.module.css';
import {
  SerializableBluetoothDeviceWithMetadata,
  BluetoothLESerialProtocolType,
  bluetoothLESerialProtocols,
  SCAN_DURATION_MS_MIN,
  SCAN_DURATION_MS_MAX,
} from '@/model/ConnController/BluetoothLEController';

interface Props {
  app: App;
}

function PortSettingsView(props: Props) {
  const { app } = props;

  // Helper function to get the UUIDs to display based on selected protocol
  const getDisplayUuids = () => {
    const selectedProtocol = app.connController.bluetoothLEController.selectedSerialProtocol;

    if (selectedProtocol === BluetoothLESerialProtocolType.FIRST_DETECTED) {
      return { serviceUuid: '-', rxUuid: '-', txUuid: '-' };
    }

    if (selectedProtocol === BluetoothLESerialProtocolType.MANUALLY_SPECIFY) {
      return {
        serviceUuid: app.connController.bluetoothLEController.manualServiceUuid,
        rxUuid: app.connController.bluetoothLEController.manualRxCharacteristicUuid,
        txUuid: app.connController.bluetoothLEController.manualTxCharacteristicUuid,
      };
    }

    // Find the protocol object for the selected protocol
    const protocolObj = bluetoothLESerialProtocols.find((p) => p.selectionType === selectedProtocol);
    if (protocolObj) {
      return {
        serviceUuid: protocolObj.serviceUuid,
        rxUuid: protocolObj.rxUuid,
        txUuid: protocolObj.txUuid,
      };
    }

    return { serviceUuid: '-', rxUuid: '-', txUuid: '-' };
  };

  // Helper function to format manufacturer data as hex
  const formatManufacturerData = (manufacturerData?: Buffer): string => {
    if (!manufacturerData || manufacturerData.length === 0) {
      return 'n/a';
    }

    const hexBytes = Array.from(manufacturerData).map((byte) => byte.toString(16).padStart(2, '0'));

    // Truncate if too long and add ellipsis
    if (hexBytes.length > 6) {
      return `[${hexBytes.slice(0, 6).join(', ')}, ...]`;
    }

    return `[${hexBytes.join(', ')}]`;
  };

  // Local state for socket port input to allow empty/partial values during editing
  const [socketPortInput, setSocketPortInput] = useState<string>(app.settings.portConfiguration.socketPort.toString());

  // Auto-scroll the J-Link Commander log pane to the newest line as output arrives.
  const rttLogRef = useRef<HTMLDivElement | null>(null);
  const rttLogLen = app.connController.rttServerLogLines.length;
  useEffect(() => {
    const el = rttLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rttLogLen]);

  // Sync local state when model value changes externally
  useEffect(() => {
    setSocketPortInput(app.settings.portConfiguration.socketPort.toString());
  }, [app.settings.portConfiguration.socketPort]);

  // Scan for serial ports when the component mounts. This will happen every time the user
  // navigates to the Port Configuration tab.
  useEffect(() => {
    app.settings.portConfiguration.scanForSerialPorts();
  }, []); // Empty dependency array means this runs once when component mounts

  const isPortSettingsDisabled = app.connController.connState !== ConnState.CLOSED && !app.settings.portConfiguration.allowSettingsChangesWhenOpen;
  // The table remains disabled even if the "Allow settings changes when open" checkbox is checked. Only the port settings
  // like baud rate, data bits, etc. can be changed when the port is open, not the port itself.
  const isTableDisabled = app.connController.connState !== ConnState.CLOSED;

  return (
    <div className={styles.noOutline} style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      <div style={{ height: '20px' }}></div>

      {/* =============================================================== */}
      {/* CONNECTION TYPE SELECTION */}
      {/* =============================================================== */}
      <div style={{ marginBottom: 16 }}>
        <Typography variant="h6" gutterBottom>
          Connection Type
        </Typography>
        <FormControl sx={{ minWidth: 200, marginTop: '10px' }} size="small">
          <InputLabel>Connection Type</InputLabel>
          <Select
            value={app.settings.portConfiguration.connectionType}
            label="Connection Type"
            disabled={app.connController.connState !== ConnState.CLOSED}
            onChange={(e) => {
              app.settings.portConfiguration.setConnectionType(e.target.value as ConnectionType);
            }}
          >
            <MenuItem value={ConnectionType.SERIAL_PORT}>Serial Port</MenuItem>
            <MenuItem value={ConnectionType.SOCKET}>Socket</MenuItem>
            <MenuItem value={ConnectionType.BLUETOOTH_LE}>Bluetooth LE</MenuItem>
            <MenuItem value={ConnectionType.RTT}>Segger RTT</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* Show serial port configuration if serial port is selected */}
      {app.settings.portConfiguration.connectionType === ConnectionType.SERIAL_PORT && (
        <>
          <div style={{ width: '100%', marginBottom: 16 }}>
            <Typography variant="h6" gutterBottom>
              Available Serial Ports
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 1000 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">Select</TableCell>
                    <TableCell>Port Path</TableCell>
                    <TableCell>Friendly Name</TableCell>
                    <TableCell>Manufacturer</TableCell>
                    <TableCell>Vendor ID</TableCell>
                    <TableCell>Product ID</TableCell>
                    <TableCell>Serial Number</TableCell>
                    <TableCell>Location ID</TableCell>
                    <TableCell>PNP ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(app.settings.portConfiguration.availableSerialPorts || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        No serial ports found. Click "Rescan" to search for ports.
                      </TableCell>
                    </TableRow>
                  ) : (
                    app.settings.portConfiguration.availableSerialPorts.map((port: any, idx: number) => (
                      <TableRow
                        key={port.path || idx}
                        hover={!isTableDisabled}
                        selected={app.settings.portConfiguration.selectedSerialPort?.path === port.path}
                        sx={{
                          cursor: isTableDisabled ? 'not-allowed' : 'pointer',
                          opacity: isTableDisabled ? 0.5 : 1,
                        }}
                        onClick={isTableDisabled ? undefined : () => app.settings.portConfiguration.setSelectedSerialPort(port)}
                      >
                        <TableCell padding="checkbox">
                          <Radio
                            checked={app.settings.portConfiguration.selectedSerialPort?.path === port.path}
                            onChange={isTableDisabled ? undefined : () => app.settings.portConfiguration.setSelectedSerialPort(port)}
                            value={port.path}
                            name="serial-port-selection"
                            disabled={isTableDisabled}
                          />
                        </TableCell>
                        <TableCell>{port.path || 'Unknown'}</TableCell>
                        <TableCell>{port.friendlyName || 'n/a'}</TableCell>
                        <TableCell>{port.manufacturer || 'n/a'}</TableCell>
                        <TableCell>{port.vendorId || 'n/a'}</TableCell>
                        <TableCell>{port.productId || 'n/a'}</TableCell>
                        <TableCell
                          sx={{
                            minWidth: 100,
                            wordBreak: 'break-all',
                          }}
                        >
                          {port.serialNumber || 'n/a'}
                        </TableCell>
                        <TableCell
                          sx={{
                            minWidth: 100,
                            wordBreak: 'break-all',
                          }}
                        >
                          {port.locationId || 'n/a'}
                        </TableCell>
                        <TableCell
                          sx={{
                            minWidth: 200,
                            wordBreak: 'break-all',
                          }}
                        >
                          {port.pnpId || 'n/a'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <div id="row-with-select-port-and-open-port-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {/* =============================================================== */}
            {/* RESCAN BUTTON */}
            {/* =============================================================== */}
            <Button
              variant="outlined"
              size="medium"
              sx={{ m: 1 }}
              onClick={async () => {
                await app.settings.portConfiguration.scanForSerialPorts();
              }}
            >
              Rescan
            </Button>
            {/* =============================================================== */}
            {/* OPEN/CLOSE BUTTON */}
            {/* =============================================================== */}
            <Button
              variant="contained"
              size="medium"
              sx={{ m: 1, width: 160 }}
              color={
                portStateToButtonProps[app.connController.connState].color as OverridableStringUnion<
                  'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
                  ButtonPropsColorOverrides
                >
              }
              onClick={() => {
                if (app.connController.connState === ConnState.CLOSED) {
                  app.connController.openConnection();
                } else if (app.connController.connState === ConnState.CLOSED_BUT_WILL_REOPEN) {
                  app.connController.stopWaitingToReopenPort();
                } else if (app.connController.connState === ConnState.OPENED) {
                  app.connController.closeConnection();
                } else {
                  throw Error('Invalid port state.');
                }
              }}
              // Disabled when connection is not ready to open
              disabled={!app.connController.isReadyToOpen()}
              data-testid="open-close-button"
            >
              {portStateToButtonProps[app.connController.connState].text}
            </Button>
            {/* =============================================================== */}
            {/* PORT STATUS */}
            {/* =============================================================== */}
            <Typography sx={{ m: 1, alignSelf: 'center' }}>Status: {ConnState[app.connController.connState]}</Typography>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>
            {/* ============================================================== */}
            {/* BAUD RATE */}
            {/* ============================================================== */}
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="The baud rate (bits/second) to use on the serial port. You can select one of the popular pre-defined options or enter in a custom rate. Custom value must be a integer in the range [1, 2000000 (2M)]. Most OSes/hardware will accept values outside their valid range without erroring, but will just not work properly. Common baud rates include 9600, 56700 and 115200. If you receive garbage data, it might be because you have the wrong baud rate selected."
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
                disabled={isPortSettingsDisabled}
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
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="The number of bits in each frame of data. This is typically set to 8 bits (i.e. 1 byte)."
              placement="right"
            >
              <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
                <InputLabel>Num. data bits</InputLabel>
                <Select
                  value={app.settings.portConfiguration.numDataBits}
                  label="Num. Data Bits"
                  disabled={isPortSettingsDisabled}
                  onChange={(e) => {
                    app.settings.portConfiguration.setNumDataBits(e.target.value as NumDataBits);
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
              placement="right"
            >
              <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
                <InputLabel>Parity</InputLabel>
                <Select
                  value={app.settings.portConfiguration.parity}
                  label="Parity"
                  disabled={isPortSettingsDisabled}
                  onChange={(e) => {
                    app.settings.portConfiguration.setParity(e.target.value as Parity);
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
              placement="right"
            >
              <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
                <InputLabel>Stop bits</InputLabel>
                <Select
                  value={app.settings.portConfiguration.stopBits}
                  label="Stop Bits"
                  disabled={isPortSettingsDisabled}
                  onChange={(e) => {
                    app.settings.portConfiguration.setStopBits(e.target.value as StopBits);
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

          {/* =============================================================== */}
          {/* FLOW CONTROL PARAMETERS */}
          {/* =============================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 8, marginTop: 16, gap: 8 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Flow Control Settings
            </Typography>

            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Enable the underlying driver/OS to manage hardware flow control using RTS/CTS signals. When enabled, you will no longer be able to manually control the RTS signal using the RTS button in the terminal window. You must NOT enable this if you want to control them manually. When disabled, you can toggle RTS manually and view the state of the CTS signal in the terminal right-hand drawer."
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={app.settings.portConfiguration.rtscts}
                    onChange={(e) => {
                      app.settings.portConfiguration.setRtscts(e.target.checked);
                    }}
                    disabled={isPortSettingsDisabled}
                  />
                }
                label="Let driver/OS manage RTS/CTS signals"
              />
            </Tooltip>

            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Software flow control using XON character (ASCII 17, Ctrl+Q). When enabled, receiving an XON character resumes transmission."
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={app.settings.portConfiguration.xon}
                    onChange={(e) => {
                      app.settings.portConfiguration.setXon(e.target.checked);
                    }}
                    disabled={isPortSettingsDisabled}
                  />
                }
                label="XON software flow control"
              />
            </Tooltip>

            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Software flow control using XOFF character (ASCII 19, Ctrl+S). When enabled, receiving an XOFF character pauses transmission."
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={app.settings.portConfiguration.xoff}
                    onChange={(e) => {
                      app.settings.portConfiguration.setXoff(e.target.checked);
                    }}
                    disabled={isPortSettingsDisabled}
                  />
                }
                label="XOFF software flow control"
              />
            </Tooltip>

            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Any character can restart output which was paused by XOFF. Normally only XON can restart transmission. This allows the user to override the software flow control and restart output with a key press. For more info, see IXANY on https://www.man7.org/linux/man-pages/man3/termios.3.html."
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={app.settings.portConfiguration.xany}
                    onChange={(e) => {
                      app.settings.portConfiguration.setXany(e.target.checked);
                    }}
                    disabled={isPortSettingsDisabled}
                  />
                }
                label="XANY (any character restarts output)"
              />
            </Tooltip>

            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Drop DTR (Data Terminal Ready) signal when the port is closed. This can be useful for triggering resets on connected devices like Arduino boards."
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={app.settings.portConfiguration.hupcl}
                    onChange={(e) => {
                      app.settings.portConfiguration.setHupcl(e.target.checked);
                    }}
                    disabled={isPortSettingsDisabled}
                  />
                }
                label="Drop DTR on close (HUPCL)"
              />
            </Tooltip>
          </div>
        </>
      )}

      {/* Show socket configuration if socket is selected */}
      {app.settings.portConfiguration.connectionType === ConnectionType.SOCKET && (
        <div style={{ width: '100%', marginBottom: 16 }}>
          <Typography variant="h6" gutterBottom>
            Socket Connection Settings
          </Typography>

          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: '16px', gap: '10px' }}>
            {/* ============================================================== */}
            {/* HOST */}
            {/* ============================================================== */}
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="IP address (e.g. 192.168.1.100) or hostname (e.g. www.example.com) of the TCP socket server to connect to."
            >
              <TextField
                label="Host"
                value={app.settings.portConfiguration.socketHost}
                disabled={app.connController.connState !== ConnState.CLOSED}
                onChange={(e) => {
                  app.settings.portConfiguration.setSocketHost(e.target.value);
                }}
                sx={{ width: 200 }}
                size="small"
                helperText="IP address or hostname"
              />
            </Tooltip>

            {/* ============================================================== */}
            {/* PORT */}
            {/* ============================================================== */}
            <Tooltip {...app.settings.displaySettings.getBasicTooltipConfig()} title="Port number of the TCP socket server to connect to. Must be between 1 and 65535 (inclusive).">
              <TextField
                label="Port"
                value={socketPortInput}
                disabled={app.connController.connState !== ConnState.CLOSED}
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
                sx={{ width: '120px' }}
                size="small"
                helperText="Port number"
                inputProps={{
                  min: 1,
                  max: 65535,
                }}
              />
            </Tooltip>
          </div>

          {/* ============================================================== */}
          {/* SOCKET CONNECTION TIMEOUT */}
          {/* ============================================================== */}
          <Tooltip
            {...app.settings.displaySettings.getBasicTooltipConfig()}
            title={`The timeout for the socket connection in milliseconds. If the connection is not established within this time, the attempt will be aborted. Must be between ${PortSettings.SOCKET_CONN_TIMEOUT_MIN_MS} and ${PortSettings.SOCKET_CONN_TIMEOUT_MAX_MS} (inclusive).`}
          >
            <TextField
              label="Connection timeout (ms)"
              value={app.settings.portConfiguration.socketConnTimeoutDispMs}
              disabled={app.connController.connState !== ConnState.CLOSED}
              error={app.settings.portConfiguration.socketConnTimeoutErrorMsg !== ''}
              helperText={app.settings.portConfiguration.socketConnTimeoutErrorMsg || 'Timeout in milliseconds'}
              onChange={(e) => {
                app.settings.portConfiguration.setSocketConnTimeoutDispMs(e.target.value);
              }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  // Apply timeout
                  await app.settings.portConfiguration.applySocketConnTimeout();
                }
                // Prevent the global keydown event from being triggered
                e.stopPropagation();
              }}
              onBlur={async () => {
                // Apply timeout
                await app.settings.portConfiguration.applySocketConnTimeout();
              }}
              sx={{ width: 180, marginTop: '30px' }}
              size="small"
              inputProps={{
                min: PortSettings.SOCKET_CONN_TIMEOUT_MIN_MS,
                max: PortSettings.SOCKET_CONN_TIMEOUT_MAX_MS,
              }}
            />
          </Tooltip>

          <div id="socket-open-close-button" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 16 }}>
            {/* =============================================================== */}
            {/* OPEN/CLOSE BUTTON FOR SOCKET */}
            {/* =============================================================== */}
            <Tooltip {...app.settings.displaySettings.getBasicTooltipConfig()} title="Open or close the socket connection.">
              <Button
                variant="contained"
                size="medium"
                sx={{ width: 160 }}
                color={
                  portStateToButtonProps[app.connController.connState].color as OverridableStringUnion<
                    'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
                    ButtonPropsColorOverrides
                  >
                }
                onClick={() => {
                  if (app.connController.connState === ConnState.CLOSED) {
                    app.connController.openConnection();
                  } else if (app.connController.connState === ConnState.CLOSED_BUT_WILL_REOPEN) {
                    app.connController.stopWaitingToReopenPort();
                  } else if (app.connController.connState === ConnState.OPENED) {
                    app.connController.closeConnection();
                  } else {
                    throw Error('Invalid port state.');
                  }
                }}
                disabled={!app.connController.isReadyToOpen()}
                data-testid="socket-open-close-button"
              >
                {portStateToButtonProps[app.connController.connState].text}
              </Button>
            </Tooltip>
            {/* =============================================================== */}
            {/* SOCKET STATUS */}
            {/* =============================================================== */}
            <Typography sx={{ alignSelf: 'center' }}>Status: {ConnState[app.connController.connState]}</Typography>
          </div>
        </div>
      )}

      {/* ====================================================================================== */}
      {/* SEGGER RTT */}
      {/* ====================================================================================== */}
      {app.settings.portConfiguration.connectionType === ConnectionType.RTT && (
        <div style={{ width: '100%', marginBottom: 16 }}>
          <Typography variant="h6" gutterBottom>
            Segger RTT Settings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', marginBottom: '10px' }}>
            NinjaTerm will spawn J-Link Commander (JLink.exe), attach to the target, and connect to RTT channel 0 on TCP port 19021.
            SEGGER J-Link software must be installed on this machine.
          </Typography>

          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: '16px', gap: '10px' }}>
            {/* DEVICE */}
            {(() => {
              const recents = app.settings.portConfiguration.rttRecentDevices;
              const recentsSet = new Set(recents);
              // Recents come first (so they sort to the top of their group), followed by curated
              // common devices with recents filtered out to avoid duplicate entries.
              const deviceOptions = [
                ...recents,
                ...COMMON_JLINK_DEVICES.filter((d) => !recentsSet.has(d)),
              ];
              return (
                <Tooltip
                  {...app.settings.displaySettings.getBasicTooltipConfig()}
                  title="SEGGER target device identifier, e.g. nRF52832_xxAA, STM32F407VG, RP2040_M0_0. Pick from the suggestions or type any device name accepted by J-Link Commander's `device` command. J-Link's full device list has thousands of entries — if yours isn't in the dropdown just type it in."
                >
                  <Autocomplete
                    freeSolo
                    autoHighlight
                    selectOnFocus
                    options={deviceOptions}
                    groupBy={(option) => (recentsSet.has(option) ? 'Recently used' : 'Common devices')}
                    value={app.settings.portConfiguration.rttDevice}
                    onChange={(_e, newValue) => {
                      app.settings.portConfiguration.setRttDevice(newValue ?? '');
                    }}
                    onInputChange={(_e, newInputValue) => {
                      app.settings.portConfiguration.setRttDevice(newInputValue);
                    }}
                    disabled={app.connController.connState !== ConnState.CLOSED}
                    sx={{ width: 260 }}
                    size="small"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Target device"
                        helperText="SEGGER device name (type to filter)"
                      />
                    )}
                  />
                </Tooltip>
              );
            })()}

            {/* INTERFACE */}
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Debug interface used by the J-Link probe. Most modern ARM Cortex-M targets use SWD."
            >
              <FormControl sx={{ minWidth: 120 }} size="small">
                <InputLabel>Interface</InputLabel>
                <Select
                  value={app.settings.portConfiguration.rttInterface}
                  label="Interface"
                  disabled={app.connController.connState !== ConnState.CLOSED}
                  onChange={(e) => {
                    app.settings.portConfiguration.setRttInterface(e.target.value as RttInterface);
                  }}
                >
                  <MenuItem value={RttInterface.SWD}>SWD</MenuItem>
                  <MenuItem value={RttInterface.JTAG}>JTAG</MenuItem>
                </Select>
              </FormControl>
            </Tooltip>

            {/* SPEED */}
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title={`Debug interface clock speed in kHz. Typical values: 1000-50000. Must be between ${PortSettings.RTT_SPEED_MIN_KHZ} and ${PortSettings.RTT_SPEED_MAX_KHZ} (inclusive).`}
            >
              <TextField
                label="Speed (kHz)"
                value={app.settings.portConfiguration.rttSpeedDispKHz}
                disabled={app.connController.connState !== ConnState.CLOSED}
                error={app.settings.portConfiguration.rttSpeedErrorMsg !== ''}
                helperText={app.settings.portConfiguration.rttSpeedErrorMsg || `${PortSettings.RTT_SPEED_MIN_KHZ}-${PortSettings.RTT_SPEED_MAX_KHZ} kHz`}
                onChange={(e) => {
                  app.settings.portConfiguration.setRttSpeedDispKHz(e.target.value);
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    app.settings.portConfiguration.applyRttSpeed();
                  }
                  e.stopPropagation();
                }}
                onBlur={() => {
                  app.settings.portConfiguration.applyRttSpeed();
                }}
                sx={{ width: 140 }}
                size="small"
              />
            </Tooltip>

            {/* JLINK SERIAL NUMBER */}
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Optional J-Link probe serial number. Only needed if multiple J-Link probes are connected to this machine. Leave blank to use the first available probe."
            >
              <TextField
                label="J-Link serial (optional)"
                value={app.settings.portConfiguration.rttJLinkSerialNumber}
                disabled={app.connController.connState !== ConnState.CLOSED}
                onChange={(e) => {
                  app.settings.portConfiguration.setRttJLinkSerialNumber(e.target.value);
                }}
                sx={{ width: 200 }}
                size="small"
                helperText="Blank = first available"
              />
            </Tooltip>
          </div>

          {/* SERVER EXE PATH */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', marginTop: '16px', alignItems: 'flex-start' }}>
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Path to J-Link Commander (JLink.exe on Windows, JLinkExe on macOS/Linux). Leave blank to auto-detect in the standard SEGGER install location."
            >
              <TextField
                label="J-Link Commander path (optional)"
                value={app.settings.portConfiguration.rttServerExePath}
                disabled={app.connController.connState !== ConnState.CLOSED}
                onChange={(e) => {
                  app.settings.portConfiguration.setRttServerExePath(e.target.value);
                }}
                sx={{ width: 500 }}
                size="small"
                helperText="Blank = auto-detect"
              />
            </Tooltip>
            <Button
              variant="outlined"
              size="medium"
              disabled={app.connController.connState !== ConnState.CLOSED}
              onClick={async () => {
                const result = await window.electronAPI.rtt.browseExe();
                if (result.success && !result.canceled && result.path) {
                  app.settings.portConfiguration.setRttServerExePath(result.path);
                }
              }}
            >
              Browse...
            </Button>
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Search the standard SEGGER install locations on this machine and fill in the first path found."
            >
              <Button
                variant="outlined"
                size="medium"
                disabled={app.connController.connState !== ConnState.CLOSED}
                onClick={async () => {
                  const result = await window.electronAPI.rtt.resolveExePath('');
                  if (result.success && result.path) {
                    app.settings.portConfiguration.setRttServerExePath(result.path);
                    app.snackbar.sendToSnackbar(`Found J-Link Commander at ${result.path}`, 'success');
                  } else {
                    app.snackbar.sendToSnackbar('J-Link Commander not found in standard install locations. Use Browse... to select it manually.', 'warning');
                  }
                }}
              >
                Locate
              </Button>
            </Tooltip>
          </div>

          <div id="rtt-open-close-button" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 16 }}>
            <Tooltip {...app.settings.displaySettings.getBasicTooltipConfig()} title="Open or close the RTT connection. Spawns J-Link Commander on open.">
              <Button
                variant="contained"
                size="medium"
                sx={{ width: 160 }}
                color={
                  portStateToButtonProps[app.connController.connState].color as OverridableStringUnion<
                    'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
                    ButtonPropsColorOverrides
                  >
                }
                onClick={() => {
                  if (app.connController.connState === ConnState.CLOSED) {
                    app.connController.openConnection();
                  } else if (app.connController.connState === ConnState.CLOSED_BUT_WILL_REOPEN) {
                    app.connController.stopWaitingToReopenPort();
                  } else if (app.connController.connState === ConnState.OPENED) {
                    app.connController.closeConnection();
                  }
                }}
                disabled={!app.connController.isReadyToOpen()}
                data-testid="rtt-open-close-button"
              >
                {portStateToButtonProps[app.connController.connState].text}
              </Button>
            </Tooltip>
            <Typography sx={{ alignSelf: 'center' }}>Status: {ConnState[app.connController.connState]}</Typography>
          </div>

          {/* SERVER LOG */}
          <div style={{ marginTop: 16 }}>
            <Typography variant="subtitle2" gutterBottom>
              J-Link Commander output
            </Typography>
            <div
              ref={rttLogRef}
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                whiteSpace: 'pre',
                background: '#111',
                color: app.connController.rttServerLogLines.length > 0 ? '#ddd' : '#666',
                padding: 8,
                height: 240,
                overflow: 'auto',
                border: '1px solid #333',
                borderRadius: 4,
                width: '100%',
                maxWidth: 900,
              }}
            >
              {app.connController.rttServerLogLines.length > 0
                ? app.connController.rttServerLogLines.join('\n')
                : '(no output yet — open the RTT connection to populate this)'}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================================== */}
      {/* BLUETOOTH LE */}
      {/* ====================================================================================== */}
      {/* Show Bluetooth configuration if Bluetooth is selected */}
      {app.settings.portConfiguration.connectionType === ConnectionType.BLUETOOTH_LE && (
        <div style={{ width: '100%', marginBottom: 16 }}>
          <Typography variant="h6" gutterBottom>
            Bluetooth LE Settings
          </Typography>

          {/* =============================================================== */}
          {/* PROTOCOL SELECTION DROPDOWN */}
          {/* =============================================================== */}
          <div style={{ marginTop: '16px' }}>
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="The protocol to use for serial communication over Bluetooth LE. This determines the service and TX/RX characteristic UUIDs to use."
              placement="right"
            >
              <FormControl sx={{ minWidth: 300 }} size="small">
                <InputLabel>Bluetooth LE Serial Protocol</InputLabel>
                <Select
                  value={app.connController.bluetoothLEController.selectedSerialProtocol}
                  label="Bluetooth Protocol"
                  disabled={app.connController.connState !== ConnState.CLOSED}
                  onChange={(e) => {
                    app.connController.bluetoothLEController.setSelectedProtocol(e.target.value as BluetoothLESerialProtocolType);
                  }}
                >
                  {/* Make sure Tooltips are child elements of MenuItem, it doesn't work the other way around. */}
                  <MenuItem value={BluetoothLESerialProtocolType.FIRST_DETECTED}>
                    <Tooltip
                      {...app.settings.displaySettings.getBasicTooltipConfig()}
                      title="This will check all supported protocols and use the first one that is found. This is generally the best option to use."
                      placement="right"
                    >
                      <span>{BluetoothLESerialProtocolType.FIRST_DETECTED}</span>
                    </Tooltip>
                  </MenuItem>
                  <MenuItem value={BluetoothLESerialProtocolType.NORDIC_UART_SERVICE_NUS}>
                    <Tooltip
                      {...app.settings.displaySettings.getBasicTooltipConfig()}
                      title="The Nordic UART Service (NUS) is used by many nRF MCUs and also other vendor MCUs. It is likely the most popular protocol for BLE serial communication."
                      placement="right"
                    >
                      <span>{BluetoothLESerialProtocolType.NORDIC_UART_SERVICE_NUS}</span>
                    </Tooltip>
                  </MenuItem>
                  <MenuItem value={BluetoothLESerialProtocolType.MICROCHIP_TRANSPARENT_UART}>
                    <Tooltip
                      {...app.settings.displaySettings.getBasicTooltipConfig()}
                      title="The Microchip Transparent UART Service is used by many Microchip MCUs."
                      placement="right"
                    >
                      <span>{BluetoothLESerialProtocolType.MICROCHIP_TRANSPARENT_UART}</span>
                    </Tooltip>
                  </MenuItem>
                  <MenuItem value={BluetoothLESerialProtocolType.TI_SERIAL_PORT_SERVICE_SPP}>
                    <Tooltip
                      {...app.settings.displaySettings.getBasicTooltipConfig()}
                      title="The TI Serial Port Service (SPP) is a BLE serial protocol used by Texas Instruments."
                      placement="right"
                    >
                      <span>{BluetoothLESerialProtocolType.TI_SERIAL_PORT_SERVICE_SPP}</span>
                    </Tooltip>
                  </MenuItem>
                  <MenuItem value={BluetoothLESerialProtocolType.UBLOX_UCONNECT_XPRESS}>
                    <Tooltip
                      {...app.settings.displaySettings.getBasicTooltipConfig()}
                      title="The u-blox u-connectXpress is a BLE serial protocol used by u-blox."
                      placement="right"
                    >
                      <span>{BluetoothLESerialProtocolType.UBLOX_UCONNECT_XPRESS}</span>
                    </Tooltip>
                  </MenuItem>
                  <MenuItem value={BluetoothLESerialProtocolType.SILICON_LABS_SPP}>
                    <Tooltip
                      {...app.settings.displaySettings.getBasicTooltipConfig()}
                      title="The Silicon Labs SPP is a BLE serial protocol used by Silicon Labs."
                      placement="right"
                    >
                      <span>{BluetoothLESerialProtocolType.SILICON_LABS_SPP}</span>
                    </Tooltip>
                  </MenuItem>
                  <MenuItem value={BluetoothLESerialProtocolType.MANUALLY_SPECIFY}>
                    <Tooltip
                      {...app.settings.displaySettings.getBasicTooltipConfig()}
                      title="Manually specify the service, RX, and TX UUIDs to use for serial communication. Use this if you have implemented your own custom protocol."
                      placement="right"
                    >
                      <span>{BluetoothLESerialProtocolType.MANUALLY_SPECIFY}</span>
                    </Tooltip>
                  </MenuItem>
                </Select>
              </FormControl>
            </Tooltip>
          </div>

          {/* =============================================================== */}
          {/* UUID INPUT FIELDS */}
          {/* =============================================================== */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', marginBottom: '16px' }}>
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="The service UUID to use for serial communication over Bluetooth LE. The same service UUID must be used for both the TX and RX characteristics."
              placement="right"
            >
              <TextField
                label="Service UUID"
                value={getDisplayUuids().serviceUuid}
                disabled={app.connController.bluetoothLEController.selectedSerialProtocol !== BluetoothLESerialProtocolType.MANUALLY_SPECIFY}
                onChange={(e) => {
                  app.connController.bluetoothLEController.setManualServiceUuid(e.target.value);
                }}
                size="small"
                sx={{ width: 320 }}
                helperText="Bluetooth service UUID containing the TX and RX characteristics"
              />
            </Tooltip>
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="The RX characteristic UUID to use. This is named w.r.t. the BLE peripheral, i.e. NinjaTerm (the BLE central device) will write data to this characteristic."
              placement="right"
            >
              <TextField
                label="RX Characteristic UUID"
                value={getDisplayUuids().rxUuid}
                disabled={app.connController.bluetoothLEController.selectedSerialProtocol !== BluetoothLESerialProtocolType.MANUALLY_SPECIFY}
                onChange={(e) => {
                  app.connController.bluetoothLEController.setManualRxCharacteristicUuid(e.target.value);
                }}
                size="small"
                sx={{ width: 320 }}
                helperText="Characteristic UUID for BLE peripheral to receive data (RX)"
              />
            </Tooltip>
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="The TX characteristic UUID to use. This is named w.r.t. the BLE peripheral, i.e. NinjaTerm (the BLE central device) will read data from this characteristic."
              placement="right"
            >
              <TextField
                label="TX Characteristic UUID"
                value={getDisplayUuids().txUuid}
                disabled={app.connController.bluetoothLEController.selectedSerialProtocol !== BluetoothLESerialProtocolType.MANUALLY_SPECIFY}
                onChange={(e) => {
                  app.connController.bluetoothLEController.setManualTxCharacteristicUuid(e.target.value);
                }}
                size="small"
                sx={{ width: 320 }}
                helperText="Characteristic UUID for BLE peripheral to transmit data (TX)"
              />
            </Tooltip>
          </div>

          {/* =============================================================== */}
          {/* SCAN DURATION INPUT */}
          {/* =============================================================== */}
          <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title={`The duration (in milliseconds) to scan for Bluetooth LE devices. After this time, the scan will automatically stop. You can always stop the scan prior to this timeout by clicking the 'Stop scanning' button. Must be between ${SCAN_DURATION_MS_MIN} and ${SCAN_DURATION_MS_MAX} (inclusive).`}
              placement="right"
            >
              <TextField
                label="Scan duration (ms)"
                value={app.connController.bluetoothLEController.scanDurationMsInput}
                disabled={app.connController.connState !== ConnState.CLOSED}
                onChange={(e) => {
                  app.connController.bluetoothLEController.setScanDurationMsInput(e.target.value);
                }}
                onBlur={(e) => {
                  app.connController.bluetoothLEController.validateAndApplyScanDurationMs();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    app.connController.bluetoothLEController.validateAndApplyScanDurationMs();
                  }
                }}
                error={app.connController.bluetoothLEController.scanDurationMsError}
                helperText={app.connController.bluetoothLEController.scanDurationMsHelperText}
                size="small"
                sx={{ width: 200 }}
              />
            </Tooltip>
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="When checked, devices that do not advertise themselves as connectable will be hidden from the device list below."
              placement="right"
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={app.connController.bluetoothLEController.hideUnconnectableDevices}
                    onChange={(e) => {
                      app.connController.bluetoothLEController.setHideUnconnectableDevices(e.target.checked);
                    }}
                  />
                }
                label="Hide unconnectable devices"
              />
            </Tooltip>
          </div>

          <div id="bluetooth-scan-open-close-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 1 }}>
            {/* =============================================================== */}
            {/* SCAN/STOP SCANNING BUTTON */}
            {/* =============================================================== */}
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Start scanning for Bluetooth devices. Discovered devices will be displayed in the table below."
              placement="right"
            >
              <span>
                <Button
                  variant="outlined"
                  size="medium"
                  sx={{ mt: 1, mb: 1, ml: 0, mr: 0, width: 160 }}
                  disabled={app.connController.connState !== ConnState.CLOSED}
                  onClick={async () => {
                    if (app.connController.bluetoothLEController.isBluetoothScanning) {
                      app.connController.bluetoothLEController.stopBluetoothScan();
                    } else {
                      await app.connController.bluetoothLEController.scanForBluetoothDevices();
                    }
                  }}
                >
                  {app.connController.bluetoothLEController.isBluetoothScanning ? 'Stop scanning' : 'Scan'}
                </Button>
              </span>
            </Tooltip>

            {/* =============================================================== */}
            {/* OPEN/CLOSE BUTTON FOR BLUETOOTH */}
            {/* =============================================================== */}
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Connect to the selected Bluetooth LE device, make sure the service, RX, and TX UUIDs are present, and start listening to the TX characteristic."
              placement="right"
            >
              <span>
                <Button
                  variant="contained"
                  size="medium"
                  sx={{ mt: 1, mb: 1, ml: 0, mr: 0, width: 160 }}
                  color={
                    portStateToButtonProps[app.connController.connState].color as OverridableStringUnion<
                      'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
                      ButtonPropsColorOverrides
                    >
                  }
                  onClick={() => {
                    if (app.connController.connState === ConnState.CLOSED) {
                      app.connController.openConnection();
                    } else if (app.connController.connState === ConnState.CLOSED_BUT_WILL_REOPEN) {
                      app.connController.stopWaitingToReopenPort();
                    } else if (app.connController.connState === ConnState.OPENED) {
                      app.connController.closeConnection();
                    } else {
                      throw Error('Invalid port state.');
                    }
                  }}
                  disabled={!app.connController.isReadyToOpen()}
                  data-testid="bluetooth-open-close-button"
                >
                  {portStateToButtonProps[app.connController.connState].text}
                </Button>
              </span>
            </Tooltip>
            {/* =============================================================== */}
            {/* BLUETOOTH STATUS */}
            {/* =============================================================== */}
            <Typography sx={{ m: 1, alignSelf: 'center' }}>Status: {ConnState[app.connController.connState]}</Typography>
          </div>

          {/* =============================================================== */}
          {/* TABLE OF SCANNED BLUETOOTH DEVICES */}
          {/* =============================================================== */}
          <Typography variant="h6" gutterBottom>
            Available Bluetooth LE Devices
          </Typography>
          <Typography>Click on a column header to sort by that column. Sorted by RSSI by default.</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: '1200px', maxHeight: '400px', overflowX: 'auto' }}>
            <Table
              size="small"
              stickyHeader
              sx={{
                tableLayout: 'fixed',
                minWidth: 900,
                '& .MuiTableCell-root': {
                  paddingTop: '5px',
                  paddingBottom: '5px',
                  paddingLeft: '8px',
                  paddingRight: '8px',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '60px' }}>Select</TableCell>
                  <TableCell sx={{ width: '120px' }}>
                    <TableSortLabel
                      active={app.connController.bluetoothLEController.sortColumn === 'address'}
                      direction={app.connController.bluetoothLEController.sortColumn === 'address' ? app.connController.bluetoothLEController.sortDirection : 'asc'}
                      onClick={() => app.connController.bluetoothLEController.setSortColumn('address')}
                    >
                      Address
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: '160px' }}>
                    <TableSortLabel
                      active={app.connController.bluetoothLEController.sortColumn === 'localName'}
                      direction={app.connController.bluetoothLEController.sortColumn === 'localName' ? app.connController.bluetoothLEController.sortDirection : 'asc'}
                      onClick={() => app.connController.bluetoothLEController.setSortColumn('localName')}
                    >
                      Advertisement Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: '150px' }}>Mfg Data</TableCell>
                  <TableCell sx={{ width: '90px' }}>
                    <TableSortLabel
                      active={app.connController.bluetoothLEController.sortColumn === 'connectable'}
                      direction={app.connController.bluetoothLEController.sortColumn === 'connectable' ? app.connController.bluetoothLEController.sortDirection : 'asc'}
                      onClick={() => app.connController.bluetoothLEController.setSortColumn('connectable')}
                    >
                      Connectable
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: '70px' }}>
                    <TableSortLabel
                      active={app.connController.bluetoothLEController.sortColumn === 'rssi'}
                      direction={app.connController.bluetoothLEController.sortColumn === 'rssi' ? app.connController.bluetoothLEController.sortDirection : 'asc'}
                      onClick={() => app.connController.bluetoothLEController.setSortColumn('rssi')}
                    >
                      RSSI
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: '70px' }}>Advertised Protocols</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(app.connController.bluetoothLEController.sortedAndFilteredDiscoveredBluetoothDevices || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      <div style={{ padding: '16px' }}>No Bluetooth devices found. Click "Scan" to search for devices.</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  app.connController.bluetoothLEController.sortedAndFilteredDiscoveredBluetoothDevices.map((device: SerializableBluetoothDeviceWithMetadata, idx: number) => (
                    <TableRow
                      key={device.nobleData.id || idx}
                      hover={!isTableDisabled}
                      selected={app.connController.bluetoothLEController.selectedBluetoothDevice?.nobleData.id === device.nobleData.id}
                      sx={{
                        cursor: isTableDisabled ? 'not-allowed' : 'pointer',
                        opacity: isTableDisabled ? 0.5 : 1,
                      }}
                      onClick={isTableDisabled ? undefined : () => app.connController.bluetoothLEController.setSelectedBluetoothDevice(device)}
                    >
                      <TableCell>
                        <Radio
                          checked={app.connController.bluetoothLEController.selectedBluetoothDevice?.nobleData.id === device.nobleData.id}
                          onChange={isTableDisabled ? undefined : () => app.connController.bluetoothLEController.setSelectedBluetoothDevice(device)}
                          value={device.nobleData.id}
                          name="bluetooth-device-selection"
                          disabled={isTableDisabled}
                          size="small"
                          sx={{
                            padding: '0px',
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        {device.nobleData.address || 'n/a'}
                      </TableCell>
                      <TableCell
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8rem',
                        }}
                      >
                        {device.nobleData.advertisement.localName || '-'}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'text.secondary',
                        }}
                        title={formatManufacturerData(device.nobleData.advertisement.manufacturerData)}
                      >
                        {formatManufacturerData(device.nobleData.advertisement.manufacturerData)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{device.nobleData.connectable ? '✓' : '✗'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{device.nobleData.rssi || 'n/a'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                        {(() => {
                          return device.getHumanReadableSupportedSerialProtocolsInAdvData();
                        })()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {/* =========================================================================== */}
      {/* GENERAL SETTINGS */}
      {/* =========================================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '8px', marginTop: '16px', gap: '8px' }}>
        <Typography variant="h6">General Settings</Typography>

        {/* =============================================================== */}
        {/* ALLOW SETTINGS CHANGES WHEN OPEN - Only for serial ports */}
        {/* =============================================================== */}
        {app.settings.portConfiguration.connectionType === ConnectionType.SERIAL_PORT && (
          <Tooltip
            {...app.settings.displaySettings.getBasicTooltipConfig()}
            title={
              <div>
                Check this if you want to be able to quickly change settings when the serial port is open. If a serial port setting is changed when the port is open, the port will
                be quickly closed and opened again.
                <br />
                <br />
                This setting is more relevant for the quick connection settings in the right-hand drawer on the terminal view.
              </div>
            }
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
              label="Allow settings changes when open (will reconnect)"
            />
          </Tooltip>
        )}

        {/* =============================================================== */}
        {/* OPEN AND GO TO TERMINAL CHECKBOX */}
        {/* =============================================================== */}
        <Tooltip
          {...app.settings.displaySettings.getBasicTooltipConfig()}
          title={
            app.settings.portConfiguration.connectionType === ConnectionType.SERIAL_PORT
              ? 'Open serial port and go to the terminal view as soon as it is selected from the popup, saving you two button presses!'
              : 'Connect to socket and go to the terminal view as soon as the connection is established, saving you a button press!'
          }
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={app.settings.portConfiguration.connectToSerialPortAsSoonAsItIsSelected}
                onChange={(e) => {
                  app.settings.portConfiguration.setConnectToSerialPortAsSoonAsItIsSelected(e.target.checked);
                }}
                data-testid="connect-and-go-to-terminal-checkbox"
              />
            }
            label={
              app.settings.portConfiguration.connectionType === ConnectionType.SERIAL_PORT
                ? 'Open connection and go to the terminal as soon as port is selected'
                : 'Connect and go to the terminal automatically'
            }
          />
        </Tooltip>

        {/* =============================================================== */}
        {/* RECONNECT ON STARTUP CHECKBOX */}
        {/* =============================================================== */}
        <Tooltip
          {...app.settings.displaySettings.getBasicTooltipConfig()}
          title="On startup, if NinjaTerm can find the last used connection it will reselect it. If it was previously in the CONNECTED state, the connection will also be re-opened."
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={app.settings.portConfiguration.resumeConnectionToLastSerialPortOnStartup}
                onChange={(e) => {
                  app.settings.portConfiguration.setResumeConnectionToLastSerialPortOnStartup(e.target.checked);
                }}
              />
            }
            label="Resume connection on app startup"
          />
        </Tooltip>

        {/* =============================================================== */}
        {/* REOPEN ON UNEXPECTED CLOSE CHECKBOX */}
        {/* =============================================================== */}
        <Tooltip
          {...app.settings.displaySettings.getBasicTooltipConfig()}
          title={
            app.settings.portConfiguration.connectionType === ConnectionType.SERIAL_PORT
              ? 'If the serial port unexpectedly closes (e.g. USB serial cable is removed), NinjaTerm will try to automatically reopen the port when it becomes available again.'
              : 'If the socket connection unexpectedly closes (e.g. network interruption), NinjaTerm will try to automatically reconnect when the server becomes available again.'
          }
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={app.settings.portConfiguration.reopenSerialPortIfUnexpectedlyClosed}
                onChange={(e) => {
                  app.settings.portConfiguration.setReopenSerialPortIfUnexpectedlyClosed(e.target.checked);
                }}
              />
            }
            label="Reopen connection when available if it unexpectedly closes"
          />
        </Tooltip>
      </div>
    </div>
  );
}

export default observer(PortSettingsView);
