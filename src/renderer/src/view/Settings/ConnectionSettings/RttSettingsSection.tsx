import {
  Autocomplete,
  Button,
  ButtonPropsColorOverrides,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';

import { App } from '@/model/App';
import {
  ConnState,
  PortSettings,
  RttInterface,
} from '@/model/Settings/PortSettings/PortSettings';
import { COMMON_JLINK_DEVICES } from '@/model/Settings/PortSettings/JLinkDevices';
import { portStateToButtonProps } from '@/view/Components/PortStateToButtonProps';

interface Props {
  app: App;
}

function RttSettingsSection(props: Props) {
  const { app } = props;

  // Auto-scroll the J-Link Commander log pane to the newest line as output arrives.
  const rttLogRef = useRef<HTMLDivElement | null>(null);
  const rttLogLen = app.connController.rttServerLogLines.length;
  useEffect(() => {
    const el = rttLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rttLogLen]);

  // Auto-populate the J-Link Commander path field on first navigation to the
  // RTT pane. Skipped once the user has explicitly modified the field
  // (typing, Browse, or Locate) — even if they cleared it back to empty —
  // so the auto-fill never fights an intentional user change.
  const rttExePath = app.settings.portConfiguration.rttServerExePath;
  const rttExePathUserModified = app.settings.portConfiguration.rttServerExePathUserModified;
  useEffect(() => {
    if (rttExePath !== '') return;
    if (rttExePathUserModified) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await window.electronAPI.rtt.resolveExePath('');
        if (cancelled) return;
        if (result.success && result.path) {
          app.settings.portConfiguration.setRttServerExePathFromAutoDetect(result.path);
        }
      } catch {
        // Resolver errors are non-fatal — the user can still set the path manually.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rttExePath, rttExePathUserModified, app]);

  const recents = app.settings.portConfiguration.rttRecentDevices;
  const recentsSet = new Set(recents);
  // Recents come first (so they sort to the top of their group), followed by
  // curated common devices with recents filtered out to avoid duplicates.
  const deviceOptions = [...recents, ...COMMON_JLINK_DEVICES.filter((d) => !recentsSet.has(d))];

  return (
    <div style={{ width: '100%', marginBottom: 16 }}>
      <Typography variant="h6" gutterBottom>
        Segger RTT Settings
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', marginBottom: '10px' }}>
        NinjaTerm will spawn J-Link Commander (JLink.exe), attach to the target, and connect to RTT channel 0 on TCP port 19021. SEGGER J-Link
        software must be installed on this machine.
      </Typography>

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: '16px', gap: '10px' }}>
        {/* DEVICE */}
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
            renderInput={(params) => <TextField {...params} label="Target device" helperText="SEGGER device name (type to filter)" />}
          />
        </Tooltip>

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

        {/* RTT CHANNEL */}
        <Tooltip
          {...app.settings.displaySettings.getBasicTooltipConfig()}
          title={`RTT up/down channel index (${PortSettings.RTT_CHANNEL_MIN}-${PortSettings.RTT_CHANNEL_MAX}). Almost all firmwares use channel 0 (Terminal) — leave at 0 unless you know your firmware uses a different RTT channel.`}
        >
          <TextField
            label="RTT channel"
            value={app.settings.portConfiguration.rttChannelDisp}
            disabled={app.connController.connState !== ConnState.CLOSED}
            error={app.settings.portConfiguration.rttChannelErrorMsg !== ''}
            helperText={app.settings.portConfiguration.rttChannelErrorMsg || `${PortSettings.RTT_CHANNEL_MIN}-${PortSettings.RTT_CHANNEL_MAX} (0 = Terminal)`}
            onChange={(e) => {
              app.settings.portConfiguration.setRttChannelDisp(e.target.value);
            }}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                app.settings.portConfiguration.applyRttChannel();
              }
              e.stopPropagation();
            }}
            onBlur={() => {
              app.settings.portConfiguration.applyRttChannel();
            }}
            sx={{ width: 120 }}
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
            label="J-Link Commander path"
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
          <span>
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
                  app.snackbar.sendToSnackbar(
                    'J-Link Commander not found in standard install locations. Use Browse... to select it manually.',
                    'warning'
                  );
                }
              }}
            >
              Locate
            </Button>
          </span>
        </Tooltip>
      </div>

      <div id="rtt-open-close-button" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 16 }}>
        <Tooltip
          {...app.settings.displaySettings.getBasicTooltipConfig()}
          title="Open or close the RTT connection. Spawns J-Link Commander on open."
        >
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
                }
              }}
              disabled={!app.connController.isReadyToOpen()}
              data-testid="rtt-open-close-button"
            >
              {portStateToButtonProps[app.connController.connState].text}
            </Button>
          </span>
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
  );
}

export default observer(RttSettingsSection);
