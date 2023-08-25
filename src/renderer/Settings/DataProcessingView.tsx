import { Box, Button, Checkbox, FormControlLabel } from '@mui/material';
import { observer } from 'mobx-react-lite';

import { AppStore } from 'stores/AppStore';

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
      />
      <Button variant="contained" color="success">
        Apply
      </Button>
    </Box>
  );
}

export default observer(DataProcessingView);
