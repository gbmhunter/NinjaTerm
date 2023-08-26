import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  TextField,
  Tooltip,
} from '@mui/material';
import { observer } from 'mobx-react-lite';

import { AppStore } from 'stores/App';

interface Props {
  appStore: AppStore;
}

function DataProcessingView(props: Props) {
  const { appStore } = props;
  // console.log('appStore.settings.dataProcessingSettings=', appStore.settings.dataProcessingSettings);
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
          name="dataWidth_chars"
          label="Data Width"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">chars</InputAdornment>
            ),
          }}
          value={
            appStore.settings.dataProcessing.visibleData.fields.dataWidth_chars
              .value
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            appStore.settings.dataProcessing.onFieldChange(
              event.target.name,
              event.target.value
            );
          }}
          error={
            appStore.settings.dataProcessing.visibleData.fields.dataWidth_chars
              .hasError
          }
          helperText={
            appStore.settings.dataProcessing.visibleData.fields.dataWidth_chars
              .errorMsg
          }
          sx={{ marginBottom: '20px' }}
        />
      </Tooltip>
      {/* ============================ SCROLLBACK SIZE =========================== */}
      <Tooltip title="The max. number of characters to store in any scrollback buffer (TX, RX, TX/RX). Increasing this will decrease performance and increase memory usage.">
        <TextField
          name="scrollbackSize_chars"
          label="Scrollback Size"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">chars</InputAdornment>
            ),
          }}
          value={
            appStore.settings.dataProcessing.visibleData.fields
              .scrollbackSize_chars.value
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            appStore.settings.dataProcessing.onFieldChange(
              event.target.name,
              event.target.value
            );
          }}
          error={
            appStore.settings.dataProcessing.visibleData.fields
              .scrollbackSize_chars.hasError
          }
          helperText={
            appStore.settings.dataProcessing.visibleData.fields
              .scrollbackSize_chars.errorMsg
          }
          sx={{ marginBottom: '20px' }}
        />
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
