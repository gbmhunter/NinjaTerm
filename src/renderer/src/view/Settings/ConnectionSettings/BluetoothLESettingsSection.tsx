import {
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
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { observer } from 'mobx-react-lite';

import { App } from '@/model/App';
import { ConnState } from '@/model/Settings/PortSettings/PortSettings';
import {
  BluetoothLESerialProtocolType,
  bluetoothLESerialProtocols,
  SCAN_DURATION_MS_MAX,
  SCAN_DURATION_MS_MIN,
  SerializableBluetoothDeviceWithMetadata,
} from '@/model/ConnController/BluetoothLEController';
import { portStateToButtonProps } from '@/view/Components/PortStateToButtonProps';

interface Props {
  app: App;
}

function BluetoothLESettingsSection(props: Props) {
  const { app } = props;
  // The table remains disabled even if the "Allow settings changes when open"
  // checkbox is checked. Only the per-port settings can be changed when the
  // port is open, not which device is selected.
  const isTableDisabled = app.connController.connState !== ConnState.CLOSED;

  // Helper to look up the displayed UUIDs based on selected protocol.
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

  // Helper to format manufacturer-data Buffers for the table cell.
  const formatManufacturerData = (manufacturerData?: Buffer): string => {
    if (!manufacturerData || manufacturerData.length === 0) {
      return 'n/a';
    }

    const hexBytes = Array.from(manufacturerData).map((byte) => byte.toString(16).padStart(2, '0'));

    if (hexBytes.length > 6) {
      return `[${hexBytes.slice(0, 6).join(', ')}, ...]`;
    }

    return `[${hexBytes.join(', ')}]`;
  };

  return (
    <div style={{ width: '100%', marginBottom: 16 }}>
      <Typography variant="h6" gutterBottom>
        Bluetooth LE Settings
      </Typography>

      {/* PROTOCOL SELECTION DROPDOWN */}
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
              {/* Tooltips must be children of MenuItem (not the other way around). */}
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

      {/* UUID INPUT FIELDS */}
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

      {/* SCAN DURATION INPUT */}
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
            onBlur={() => {
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
        {/* SCAN/STOP SCANNING BUTTON */}
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

        {/* OPEN/CLOSE BUTTON FOR BLUETOOTH */}
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
        <Typography sx={{ m: 1, alignSelf: 'center' }}>Status: {ConnState[app.connController.connState]}</Typography>
      </div>

      {/* TABLE OF SCANNED BLUETOOTH DEVICES */}
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
              app.connController.bluetoothLEController.sortedAndFilteredDiscoveredBluetoothDevices.map(
                (device: SerializableBluetoothDeviceWithMetadata, idx: number) => (
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
                        sx={{ padding: '0px' }}
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
                    <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{device.getHumanReadableSupportedSerialProtocolsInAdvData()}</TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default observer(BluetoothLESettingsSection);
