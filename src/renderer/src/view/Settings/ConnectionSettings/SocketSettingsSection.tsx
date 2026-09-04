import {
  Button,
  ButtonPropsColorOverrides,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { App } from '@/model/App';
import {
  ConnState,
  PortSettings,
} from '@/model/Settings/PortSettings/PortSettings';
import { portStateToButtonProps } from '@/view/Components/PortStateToButtonProps';

interface Props {
  app: App;
}

function SocketSettingsSection(props: Props) {
  const { app } = props;

  // Local state for the port input so the user can briefly hold an empty or
  // partial value while typing without the model rejecting it.
  const [socketPortInput, setSocketPortInput] = useState<string>(
    app.settings.portConfiguration.socketPort.toString()
  );

  // Sync the local input back to the model value if the model changes
  // externally (e.g. profile applied).
  useEffect(() => {
    setSocketPortInput(app.settings.portConfiguration.socketPort.toString());
  }, [app.settings.portConfiguration.socketPort]);

  return (
    <div style={{ width: '100%', marginBottom: 16 }}>
      <Typography variant="h6" gutterBottom>
        Socket Connection Settings
      </Typography>

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: '16px', gap: '10px' }}>
        {/* HOST */}
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

        {/* PORT */}
        <Tooltip
          {...app.settings.displaySettings.getBasicTooltipConfig()}
          title="Port number of the TCP socket server to connect to. Must be between 1 and 65535 (inclusive)."
        >
          <TextField
            label="Port"
            value={socketPortInput}
            disabled={app.connController.connState !== ConnState.CLOSED}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty field and digits only
              if (value === '' || /^\d+$/.test(value)) {
                setSocketPortInput(value);

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

      {/* SOCKET CONNECTION TIMEOUT */}
      <Tooltip
        {...app.settings.displaySettings.getBasicTooltipConfig()}
        title={`The timeout for the socket connection in milliseconds. If the connection is not established within this time, the attempt will be aborted. Must be between ${PortSettings.SOCKET_CONN_TIMEOUT_MIN_MS} and ${PortSettings.SOCKET_CONN_TIMEOUT_MAX_MS} (inclusive).`}
      >
        <TextField
          label="Connection timeout (ms)"
          value={app.settings.portConfiguration.socketConnTimeoutMs.dispValue}
          disabled={app.connController.connState !== ConnState.CLOSED}
          error={!app.settings.portConfiguration.socketConnTimeoutMs.isValid}
          helperText={app.settings.portConfiguration.socketConnTimeoutMs.errorMsg || 'Timeout in milliseconds'}
          onChange={(e) => {
            app.settings.portConfiguration.socketConnTimeoutMs.setDispValue(e.target.value);
          }}
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              app.settings.portConfiguration.socketConnTimeoutMs.apply();
            }
            e.stopPropagation();
          }}
          onBlur={async () => {
            app.settings.portConfiguration.socketConnTimeoutMs.apply();
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
        <Tooltip {...app.settings.displaySettings.getBasicTooltipConfig()} title="Open or close the socket connection.">
          <span>
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
          </span>
        </Tooltip>
        <Typography sx={{ alignSelf: 'center' }}>Status: {ConnState[app.connController.connState]}</Typography>
      </div>
    </div>
  );
}

export default observer(SocketSettingsSection);
