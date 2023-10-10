import { FormControlLabel, Switch } from '@mui/material';
import { observer } from 'mobx-react-lite';

import { App } from 'model/App';

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;

  return (
    <div style={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <FormControlLabel
        control={
          <Switch
            name="enableGraphing"
            checked={app.graphing.graphingEnabled} onChange={(e) => {
              app.graphing.setGraphingEnabled(e.target.checked);
            }}
          />
        }
        label="Enable Graphing"
      />
    </div>
  );
});
