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

import { AppStore } from 'stores/App';
import {
  DataViewConfiguration,
  dataViewConfigEnumToDisplayName,
} from 'stores/Settings/DataProcessingSettings';

interface Props {
  appStore: AppStore;
}

function DataProcessingView(props: Props) {
  const { appStore } = props;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
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
        sx={{ marginBottom: '10px' }}
      />
      {/* ============================ DATA WIDTH =========================== */}
      <Tooltip title="The max. number of characters to display per line of data before wrapping to the next line. Must be a positive integer. Set to 0 to have infinite width (only new line characters will cause text to jump to the next line).">
        <TextField
          id="outlined-basic"
          name="wrappingWidthChars"
          label="Wrapping Width"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">chars</InputAdornment>
            ),
          }}
          value={
            appStore.settings.dataProcessing.visibleData.fields
              .wrappingWidthChars.value
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            appStore.settings.dataProcessing.onFieldChange(
              event.target.name,
              event.target.value
            );
          }}
          error={
            appStore.settings.dataProcessing.visibleData.fields
              .wrappingWidthChars.hasError
          }
          helperText={
            appStore.settings.dataProcessing.visibleData.fields
              .wrappingWidthChars.errorMsg
          }
          sx={{ marginBottom: '20px' }}
        />
      </Tooltip>
      {/* ============================ SCROLLBACK SIZE =========================== */}
      <Tooltip title="The max. number of characters to store in any scrollback buffer (TX, RX, TX/RX). Increasing this will decrease performance and increase memory usage. Must be a positive non-zero integer.">
        <TextField
          name="scrollbackBufferSizeChars"
          label="Scrollback Buffer Size"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">chars</InputAdornment>
            ),
          }}
          value={
            appStore.settings.dataProcessing.visibleData.fields
              .scrollbackBufferSizeChars.value
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            appStore.settings.dataProcessing.onFieldChange(
              event.target.name,
              event.target.value
            );
          }}
          error={
            appStore.settings.dataProcessing.visibleData.fields
              .scrollbackBufferSizeChars.hasError
          }
          helperText={
            appStore.settings.dataProcessing.visibleData.fields
              .scrollbackBufferSizeChars.errorMsg
          }
          sx={{ marginBottom: '20px' }}
        />
      </Tooltip>
      {/* ============================ DATA VIEW CONFIGURATION =========================== */}
      <Tooltip
        title="Control whether 1 or 2 data panes are used to display the data."
        placement="top"
      >
        <FormControl size="small">
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
