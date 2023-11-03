import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";
import { observer } from "mobx-react-lite";

import { App } from 'src/App';
import { WhatToNameTheFile } from './Logging';
import BorderedSection from "src/Components/BorderedSection";

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
        alignItems: "flex-start",
        gap: "5px",
      }}
    >
      <BorderedSection title="Directory and Permissions" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
        <Button
          variant="contained"
          size="small"
          disabled={app.logging.isLogging}
          onClick={() => {
            app.logging.openDirPicker();
          }}
        >
          Select log directory
        </Button>

      <div>
        Folder permissions:&nbsp;
        <span
          style={{
            color: app.logging.dirHandle == null ? "#f44336" : "#66bb6a",
            fontWeight: "bold",
          }}
        >
          {app.logging.dirHandle == null ? "NOT GRANTED" : "GRANTED"}
        </span>
      </div>
      </BorderedSection>

      <BorderedSection title="File Naming" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* WHAT TO NAME THE FILE */}
      {/* ======================================================================= */}
      <FormControl
        disabled={app.logging.isLogging}
      >
        <FormLabel>What to name the file:</FormLabel>
        <RadioGroup
          value={app.logging.whatToNameTheFile}
          onChange={(e) => {
            app.logging.setWhatToNameTheFile(Number(e.target.value));
          }}
        >
          {/* CURRENT DATETIME */}
          <Tooltip
            title="Names the file with the current datetime at the moment logging is started."
            placement="right"
            arrow
          >
            <FormControlLabel
              value={WhatToNameTheFile.CURRENT_DATETIME}
              control={<Radio />}
              label="Use the current datetime when logging is started"
            />
          </Tooltip>
          {/* CUSTOM */}
          <Tooltip
            title="Use a custom filename as defined below."
            placement="right"
            arrow
          >
            <FormControlLabel
              value={WhatToNameTheFile.CUSTOM}
              control={<Radio />}
              label="Custom"
            />
          </Tooltip>
        </RadioGroup>
      </FormControl>

      <TextField
        label="Custom File Name"
        name="customFileName"
        size="small"
        variant="outlined"
        value={app.logging.customFileName.dispValue}
        error={!app.logging.customFileName.isValid}
        helperText={app.logging.customFileName.errorMsg}
        disabled={
          (app.logging.whatToNameTheFile !== WhatToNameTheFile.CUSTOM) || app.logging.isLogging
        }
        onChange={(e) => {
          app.logging.customFileName.setDispValue(e.target.value);
        }}
        onBlur={() => {
          app.logging.customFileName.apply();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            app.logging.customFileName.apply();
          }
        }}
        sx={{ width: "300px" }}
      />
      </BorderedSection>

      <BorderedSection title="Enabling and Status">
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

      <div>Writing to file named:</div>

      <div>Num. bytes written:</div>

      <div>File size:</div>
      </BorderedSection>
    </div>
  );
});
