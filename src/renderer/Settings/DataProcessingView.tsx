import { Box, Button, Checkbox, FormControlLabel, InputAdornment, TextField } from '@mui/material';
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
              appStore.settings.dataProcessing.visibleData.form.fields
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
      <TextField
        id="outlined-basic"
        label="Data Width"
        variant="outlined"
        size="small"
        InputProps={{
          endAdornment: <InputAdornment position="start">chars</InputAdornment>,
        }}
        sx={{ marginBottom: '20px' }}
      />
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
