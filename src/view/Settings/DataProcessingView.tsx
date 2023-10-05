import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import { observer } from 'mobx-react-lite';

import { App } from 'model/App';
import {
  DataViewConfiguration,
  dataViewConfigEnumToDisplayName,
} from 'model/Settings/DataProcessingSettings';

interface Props {
  appStore: App;
}

function DataProcessingView(props: Props) {
  const { appStore } = props;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      {/* ============================ ANSI ESCAPE CODE PARSING ENABLED =========================== */}
      <Tooltip
        title="If enabled, ANSI escape codes will be parsed. At present, CSI color codes and
        some of the move cursor commands are supported."
        placement="top"
        arrow
      >
        <FormControlLabel
          control={
            <Checkbox
              name="ansiEscapeCodeParsingEnabled"
              checked={
                appStore.settings.dataProcessing.visibleData.fields
                  .ansiEscapeCodeParsingEnabled.value
              }
              onChange={(e) => {
                appStore.settings.dataProcessing.onFieldChange(
                  e.target.name,
                  e.target.checked
                );
              }}
            />
          }
          label="ANSI Escape Code Parsing"
          sx={{ marginBottom: '10px' }}/>
      </Tooltip>
      {/* ============================ DATA WIDTH =========================== */}
      <Tooltip title="The max. number of characters to display per line in the terminal before wrapping to the next line.
      Must be a positive integer. New line characters also cause text to jump to the next line."
        followCursor
        arrow
      >
        <TextField
          id="outlined-basic"
          name="terminalWidthChars"
          label="Terminal Width"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">chars</InputAdornment>
            ),
          }}
          value={
            appStore.settings.dataProcessing.visibleData.fields
              .terminalWidthChars.value
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            appStore.settings.dataProcessing.onFieldChange(
              event.target.name,
              event.target.value
            );
          }}
          error={
            appStore.settings.dataProcessing.visibleData.fields
              .terminalWidthChars.hasError
          }
          helperText={
            appStore.settings.dataProcessing.visibleData.fields
              .terminalWidthChars.errorMsg
          }
          sx={{ marginBottom: '20px' }}
        />
      </Tooltip>
      {/* ============================ SCROLLBACK SIZE =========================== */}
      <Tooltip title="The max. number of rows to store in any terminal scrollback buffer (TX, RX, TX/RX).
        Increasing this will give you more history but decrease performance and increase memory usage. Must be a positive non-zero integer."
        followCursor
        arrow
      >
        <TextField
          name="scrollbackBufferSizeRows"
          label="Scrollback Buffer Size"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">rows</InputAdornment>
            ),
          }}
          value={
            appStore.settings.dataProcessing.visibleData.fields
              .scrollbackBufferSizeRows.value
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            appStore.settings.dataProcessing.onFieldChange(
              event.target.name,
              event.target.value
            );
          }}
          error={
            appStore.settings.dataProcessing.visibleData.fields
              .scrollbackBufferSizeRows.hasError
          }
          helperText={
            appStore.settings.dataProcessing.visibleData.fields
              .scrollbackBufferSizeRows.errorMsg
          }
          sx={{ marginBottom: '20px' }}
        />
      </Tooltip>
      {/* ============================ DATA VIEW CONFIGURATION =========================== */}
      <Tooltip
        title="Control whether a combined TX/RX terminal or two separate terminals are displayed."
        placement="top"
        followCursor
        arrow
      >
        <FormControl size="small" sx={{ minWidth: '210px' }}>
          <InputLabel>Data View Configuration</InputLabel>
          <Select
            name="dataViewConfiguration"
            value={
              appStore.settings.dataProcessing.visibleData.fields
                .dataViewConfiguration.value
            }
            onChange={(e) => {
              appStore.settings.dataProcessing.onFieldChange(
                e.target.name,
                Number(e.target.value)
              );
            }}
            sx={{ marginBottom: '20px' }}
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
      {/* ============================ LOCAL TX ECHO =========================== */}
      <Tooltip
        title="If enabled, transmitted data will be treated as received data. Useful in ASCII mode when
        the device on the other end of the serial port does not echo back characters. Disable this if
        you see two of every character appear."
        placement="top"
        followCursor
        arrow
      >
      <FormControlLabel
        control={
          <Checkbox
            name="localTxEcho"
            checked={
              appStore.settings.dataProcessing.visibleData.fields
                .localTxEcho.value
            }
            onChange={(e) => {
              appStore.settings.dataProcessing.onFieldChange(
                e.target.name,
                e.target.checked
              );
            }}
          />
        }
        label="Local TX Echo"
        sx={{ marginBottom: '10px' }}/>
      </Tooltip>
      {/* ============================ APPLY BUTTON =========================== */}
      <Button
        variant="contained"
        color="success"
        disabled={!appStore.settings.dataProcessing.isApplyable}
        onClick={() => {
          appStore.settings.dataProcessing.applyChanges();
        }}
      >
        Apply
      </Button>
    </Box>
  );
}

export default observer(DataProcessingView);
