import { Box, Button, Checkbox, FormControlLabel } from '@mui/material';
import { observer } from 'mobx-react-lite';

import { AppStore } from 'stores/AppStore';

interface Props {
  appStore: AppStore;
}

function DataProcessing(props: Props) {
  const { appStore } = props;
  // console.log('appStore.settings.dataProcessingSettings=', appStore.settings.dataProcessingSettings);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      <FormControlLabel
        control={
          <Checkbox
            name="ansiEscapeCodeParsingEnabled"
            checked={
              appStore.settings.dataProcessingSettings.form.fields
                .ansiEscapeCodeParsingEnabled.value
            }
            onChange={(e) => {
              appStore.settings.dataProcessingSettings.onFieldChange(
                e.target.name,
                e.target.checked
              );
            }}
          />
        }
        label="ANSI Escape Code Parsing"
      />
      <Button variant="contained" color="success">Apply</Button>
    </Box>
  );
}

export default observer(DataProcessing);
