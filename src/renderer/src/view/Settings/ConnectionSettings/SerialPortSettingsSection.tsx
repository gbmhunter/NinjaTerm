import {
  Autocomplete,
  Button,
  ButtonPropsColorOverrides,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { observer } from 'mobx-react-lite';

import { App } from '@/model/App';
import {
  ConnState,
  DEFAULT_BAUD_RATES,
  NUM_DATA_BITS_OPTIONS,
  NumDataBits,
  Parity,
  STOP_BIT_OPTIONS,
  StopBits,
} from '@/model/Settings/PortSettings/PortSettings';
import { portStateToButtonProps } from '@/view/Components/PortStateToButtonProps';

interface Props {
  app: App;
}

function SerialPortSettingsSection(props: Props) {
  const { app } = props;
  const isPortSettingsDisabled =
    app.connController.connState !== ConnState.CLOSED &&
    !app.settings.portConfiguration.allowSettingsChangesWhenOpen;
  // The table remains disabled even if the "Allow settings changes when open"
  // checkbox is checked. Only the port settings like baud rate, data bits,
  // etc. can be changed when the port is open, not the port itself.
  const isTableDisabled = app.connController.connState !== ConnState.CLOSED;

  return (
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
                    <TableCell sx={{ minWidth: 100, wordBreak: 'break-all' }}>{port.serialNumber || 'n/a'}</TableCell>
                    <TableCell sx={{ minWidth: 100, wordBreak: 'break-all' }}>{port.locationId || 'n/a'}</TableCell>
                    <TableCell sx={{ minWidth: 200, wordBreak: 'break-all' }}>{port.pnpId || 'n/a'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <div id="row-with-select-port-and-open-port-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
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
          disabled={!app.connController.isReadyToOpen()}
          data-testid="open-close-button"
        >
          {portStateToButtonProps[app.connController.connState].text}
        </Button>
        <Typography sx={{ m: 1, alignSelf: 'center' }}>Status: {ConnState[app.connController.connState]}</Typography>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>
        {/* BAUD RATE */}
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
                error={!app.settings.portConfiguration.baudRate.isValid}
                helperText={app.settings.portConfiguration.baudRate.errorMsg}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    app.settings.portConfiguration.baudRate.apply();
                  }
                  e.stopPropagation();
                }}
                onBlur={async () => {
                  app.settings.portConfiguration.baudRate.apply();
                }}
              />
            )}
            disabled={isPortSettingsDisabled}
            sx={{ m: 1, width: 160 }}
            size="small"
            inputValue={app.settings.portConfiguration.baudRate.dispValue}
            onInputChange={(event, newInputValue) => {
              app.settings.portConfiguration.baudRate.setDispValue(newInputValue);
            }}
          />
        </Tooltip>
        {/* NUM. DATA BITS */}
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
              {NUM_DATA_BITS_OPTIONS.map((numDataBits) => (
                <MenuItem key={numDataBits} value={numDataBits}>
                  {numDataBits.toString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>
        {/* PARITY */}
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
              {Object.values(Parity).map((parity) => (
                <MenuItem key={parity} value={parity}>
                  {parity}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>
        {/* STOP BITS */}
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
              {STOP_BIT_OPTIONS.map((stopBits) => (
                <MenuItem key={stopBits} value={stopBits}>
                  {stopBits.toString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>
      </div>

      {/* FLOW CONTROL PARAMETERS */}
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
  );
}

export default observer(SerialPortSettingsSection);
