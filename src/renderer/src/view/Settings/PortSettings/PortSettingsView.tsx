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
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { App } from '@/model/App';
import {
  PortSettings,
  PortState,
  DEFAULT_BAUD_RATES,
  NUM_DATA_BITS_OPTIONS,
  Parity,
  STOP_BIT_OPTIONS,
  StopBits,
  NumDataBits,
  ConnectionType,
} from '@/model/Settings/PortSettings/PortSettings';
import { portStateToButtonProps } from '@/view/Components/PortStateToButtonProps';
import styles from './PortSettingsView.module.css';

interface Props {
  app: App;
}

function PortSettingsView(props: Props) {
  const { app } = props;

  // Local state for socket port input to allow empty/partial values during editing
  const [socketPortInput, setSocketPortInput] = useState<string>(
    app.settings.portConfiguration.socketPort.toString()
  );

  // Sync local state when model value changes externally
  useEffect(() => {
    setSocketPortInput(app.settings.portConfiguration.socketPort.toString());
  }, [app.settings.portConfiguration.socketPort]);

  // Scan for serial ports when the component mounts. This will happen every time the user
  // navigates to the Port Configuration tab.
  useEffect(() => {
    app.settings.portConfiguration.scanForSerialPorts();
  }, []); // Empty dependency array means this runs once when component mounts

  const isPortSettingsDisabled = app.serialController.portState !== PortState.CLOSED && !app.settings.portConfiguration.allowSettingsChangesWhenOpen;
  // The table remains disabled even if the "Allow settings changes when open" checkbox is checked. Only the port settings
  // like baud rate, data bits, etc. can be changed when the port is open, not the port itself.
  const isTableDisabled = app.serialController.portState !== PortState.CLOSED;

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
                      opacity: isTableDisabled ? 0.5 : 1
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
                    >{port.serialNumber || 'n/a'}</TableCell>
                    <TableCell
                      sx={{
                        minWidth: 100,
                        wordBreak: 'break-all',
                      }}
                    >{port.locationId || 'n/a'}</TableCell>
                    <TableCell sx={{
                      minWidth: 200,
                      wordBreak: 'break-all',
                    }}>
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
              app.serialController.closePort();
            } else {
              throw Error('Invalid port state.');
            }
          }}
          // Disabled when connection is not ready to open
          disabled={!app.serialController.isReadyToOpen()}
          data-testid="open-close-button"
        >
          {portStateToButtonProps[app.serialController.portState].text}
        </Button>
        {/* =============================================================== */}
        {/* PORT STATUS */}
        {/* =============================================================== */}
        <Typography sx={{ m: 1, alignSelf: 'center' }}>
          Status: {PortState[app.serialController.portState]}
        </Typography>
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
          title="Hardware flow control using RTS/CTS signals. When enabled, the RTS (Ready To Send) and CTS (Clear To Send) lines are used for flow control."
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
            label="RTS/CTS hardware flow control"
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
                disabled={app.serialController.portState !== PortState.CLOSED}
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
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Port number of the TCP socket server to connect to. Must be between 1 and 65535 (inclusive)."
            >
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
                sx={{ width: '120px' }}
                size="small"
                helperText="Port number"
                inputProps={{
                  min: 1,
                  max: 65535
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
              disabled={app.serialController.portState !== PortState.CLOSED}
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
                max: PortSettings.SOCKET_CONN_TIMEOUT_MAX_MS
              }}
            />
          </Tooltip>

          <div id="socket-open-close-button" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 16 }}>
            {/* =============================================================== */}
            {/* OPEN/CLOSE BUTTON FOR SOCKET */}
            {/* =============================================================== */}
            <Tooltip
              {...app.settings.displaySettings.getBasicTooltipConfig()}
              title="Open or close the socket connection."
            >
              <Button
                variant="contained"
                size="medium"
                sx={{ width: 160 }}
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
                    app.serialController.closePort();
                  } else {
                    throw Error('Invalid port state.');
                  }
                }}
                disabled={!app.serialController.isReadyToOpen()}
                data-testid="socket-open-close-button"
              >
                {portStateToButtonProps[app.serialController.portState].text}
              </Button>
            </Tooltip>
            {/* =============================================================== */}
            {/* SOCKET STATUS */}
            {/* =============================================================== */}
            <Typography sx={{ alignSelf: 'center' }}>
              Status: {PortState[app.serialController.portState]}
            </Typography>
          </div>
        </div>
      )}

      {/* Show Bluetooth configuration if Bluetooth is selected */}
      {app.settings.portConfiguration.connectionType === ConnectionType.BLUETOOTH && (
        <div style={{ width: '100%', marginBottom: 16 }}>
          <Typography variant="h6" gutterBottom>
            Available Bluetooth Devices
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 1000 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">Select</TableCell>
                  <TableCell>Device ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>RSSI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(app.settings.portConfiguration.availableBluetoothDevices || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      No Bluetooth devices found. Click "Scan" to search for devices.
                    </TableCell>
                  </TableRow>
                ) : (
                  app.settings.portConfiguration.availableBluetoothDevices.map((device: any, idx: number) => (
                    <TableRow
                      key={device.id || idx}
                      hover={!isTableDisabled}
                      selected={app.settings.portConfiguration.selectedBluetoothDevice?.id === device.id}
                      sx={{
                        cursor: isTableDisabled ? 'not-allowed' : 'pointer',
                        opacity: isTableDisabled ? 0.5 : 1
                      }}
                      onClick={isTableDisabled ? undefined : () => app.settings.portConfiguration.setSelectedBluetoothDevice(device)}
                    >
                      <TableCell padding="checkbox">
                        <Radio
                          checked={app.settings.portConfiguration.selectedBluetoothDevice?.id === device.id}
                          onChange={isTableDisabled ? undefined : () => app.settings.portConfiguration.setSelectedBluetoothDevice(device)}
                          value={device.id}
                          name="bluetooth-device-selection"
                          disabled={isTableDisabled}
                        />
                      </TableCell>
                      <TableCell>{device.id || 'Unknown'}</TableCell>
                      <TableCell>{device.advertisement?.localName || device.localName || 'Unknown Device'}</TableCell>
                      <TableCell>{device.address || 'n/a'}</TableCell>
                      <TableCell>{device.rssi || 'n/a'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <div id="bluetooth-scan-button" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 16 }}>
            {/* =============================================================== */}
            {/* SCAN BUTTON */}
            {/* =============================================================== */}
            <Button
              variant="outlined"
              size="medium"
              sx={{ m: 1 }}
              disabled={app.settings.portConfiguration.isBluetoothScanning || app.serialController.portState !== PortState.CLOSED}
              onClick={async () => {
                await app.settings.portConfiguration.scanForBluetoothDevices();
              }}
            >
              {app.settings.portConfiguration.isBluetoothScanning ? 'Scanning...' : 'Scan'}
            </Button>

            {/* =============================================================== */}
            {/* OPEN/CLOSE BUTTON FOR BLUETOOTH */}
            {/* =============================================================== */}
            <Button
              variant="contained"
              size="medium"
              sx={{ m: 1, width: 160 }}
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
                  app.serialController.closePort();
                } else {
                  throw Error('Invalid port state.');
                }
              }}
              disabled={!app.serialController.isReadyToOpen()}
              data-testid="bluetooth-open-close-button"
            >
              {portStateToButtonProps[app.serialController.portState].text}
            </Button>

            {/* =============================================================== */}
            {/* BLUETOOTH STATUS */}
            {/* =============================================================== */}
            <Typography sx={{ m: 1, alignSelf: 'center' }}>
              Status: {PortState[app.serialController.portState]}
            </Typography>
          </div>
        </div>
      )}

      {/* =========================================================================== */}
      {/* GENERAL SETTINGS */}
      {/* =========================================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '8px', marginTop: '16px', gap: '8px' }}>
        <Typography variant="h6">
          General Settings
        </Typography>

        {/* =============================================================== */}
        {/* ALLOW SETTINGS CHANGES WHEN OPEN - Only for serial ports */}
        {/* =============================================================== */}
        {app.settings.portConfiguration.connectionType === ConnectionType.SERIAL_PORT && (
          <Tooltip
            {...app.settings.displaySettings.getBasicTooltipConfig()}
            title={
              <div>
                Check this if you want to be able to quickly change settings when the serial port is open. If a serial port setting is changed when the port is open, the port will be quickly closed and opened again.<br />
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
          title={app.settings.portConfiguration.connectionType === ConnectionType.SERIAL_PORT
            ? "Open serial port and go to the terminal view as soon as it is selected from the popup, saving you two button presses!"
            : "Connect to socket and go to the terminal view as soon as the connection is established, saving you a button press!"
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
            label={app.settings.portConfiguration.connectionType === ConnectionType.SERIAL_PORT
              ? "Open connection and go to the terminal as soon as port is selected"
              : "Connect and go to the terminal automatically"
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
          title={app.settings.portConfiguration.connectionType === ConnectionType.SERIAL_PORT
            ? "If the serial port unexpectedly closes (e.g. USB serial cable is removed), NinjaTerm will try to automatically reopen the port when it becomes available again."
            : "If the socket connection unexpectedly closes (e.g. network interruption), NinjaTerm will try to automatically reconnect when the server becomes available again."
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
