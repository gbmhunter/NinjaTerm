import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { App } from '@/model/App';
import { ConnState, ConnectionType } from '@/model/Settings/PortSettings/PortSettings';

import styles from './ConnectionSettingsView.module.css';
import SerialPortSettingsSection from './SerialPortSettingsSection';
import SocketSettingsSection from './SocketSettingsSection';
import RttSettingsSection from './RttSettingsSection';
import BluetoothLESettingsSection from './BluetoothLESettingsSection';

interface Props {
  app: App;
}

function PortSettingsView(props: Props) {
  const { app } = props;

  // Scan for serial ports when the component mounts. This will happen every
  // time the user navigates to the Connection Settings tab. Runs unconditionally
  // — the user may switch transport after mount.
  useEffect(() => {
    app.settings.portConfiguration.scanForSerialPorts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connType = app.settings.portConfiguration.connectionType;

  return (
    <div className={styles.noOutline} style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      <div style={{ height: '20px' }}></div>

      {/* CONNECTION TYPE SELECTION */}
      <div style={{ marginBottom: 16 }}>
        <Typography variant="h6" gutterBottom>
          Connection Type
        </Typography>
        <FormControl sx={{ minWidth: 200, marginTop: '10px' }} size="small">
          <InputLabel>Connection Type</InputLabel>
          <Select
            value={connType}
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

      {connType === ConnectionType.SERIAL_PORT && <SerialPortSettingsSection app={app} />}
      {connType === ConnectionType.SOCKET && <SocketSettingsSection app={app} />}
      {connType === ConnectionType.RTT && <RttSettingsSection app={app} />}
      {connType === ConnectionType.BLUETOOTH_LE && <BluetoothLESettingsSection app={app} />}

      {/* =========================================================================== */}
      {/* GENERAL SETTINGS — shared across all connection types, with a few           */}
      {/* per-transport tweaks to the labels / tooltip wording.                       */}
      {/* =========================================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '8px', marginTop: '16px', gap: '8px' }}>
        <Typography variant="h6">General Settings</Typography>

        {/* Allow settings changes when open — only applies to serial ports */}
        {connType === ConnectionType.SERIAL_PORT && (
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

        {/* Open and go to terminal */}
        <Tooltip
          {...app.settings.displaySettings.getBasicTooltipConfig()}
          title={
            connType === ConnectionType.SERIAL_PORT
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
              connType === ConnectionType.SERIAL_PORT
                ? 'Open connection and go to the terminal as soon as port is selected'
                : 'Connect and go to the terminal automatically'
            }
          />
        </Tooltip>

        {/* Resume on startup */}
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

        {/* Reopen on unexpected close */}
        <Tooltip
          {...app.settings.displaySettings.getBasicTooltipConfig()}
          title={
            connType === ConnectionType.SERIAL_PORT
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
