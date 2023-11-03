import {
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";
import { observer } from "mobx-react-lite";

import { App } from "src/App";


interface Props {
  app: App;
}

/**
 * The view for the logging pane.
 */
export default observer((props: Props) => {
  const { app } = props;

  return (
    <div
      style={{
        flexGrow: 1, // Make sure it fills the available space, to keep the app header and footer at the top and bottom of the window
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div style={{ marginTop: '20px' }}>
        <Button
          onClick={() => {
            app.logging.openDirPicker();
          }}
          variant="contained"
          size="small"
        >
          Select log directory
        </Button>
      </div>

      <div>Folder permissions:&nbsp;
        <span
          style={{
            color: app.logging.dirHandle == null ? '#f44336' : '#66bb6a',
            fontWeight: 'bold',
          }}
        >
          {app.logging.dirHandle == null ? 'NOT GRANTED' : 'GRANTED'}
        </span>
      </div>

      {/* ENABLE LOGGING */}
      {/* ============================================================== */}
      <FormControlLabel
        control={
          <Switch
            name="enableGraphing"
            checked={app.logging.isLogging}
            disabled={app.logging.dirHandle == null}
            onChange={(e) => {
              if (e.target.checked) {
                app.logging.startLogging();
              } else {
                app.logging.stopLogging();
              }
            }}
          />
        }
        label="Enable Logging"
        sx={{
          marginLeft: "20px",
        }}
      />

    </div>
  );
});
