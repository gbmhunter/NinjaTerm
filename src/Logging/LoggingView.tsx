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

import { App } from "src/App";
import { ExistingFileBehaviors, WhatToNameTheFile } from "./Logging";
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
      <h2 style={{ marginLeft: '20px' }}>LOGGING</h2>

      <BorderedSection
        title="Directory and Permissions"
        style={{
          width: "500px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          alignItems: "flex-start",
        }}
      >
        <Button
          variant="contained"
          // size="small"
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

      {/* ROW CONTAINING FILE NAMING AND EXISTING FILE BEHAVIOR */}
      {/* ======================================================================= */}
      {/* ======================================================================= */}
      <div style={{ display: "flex" }}>
        {/* WHAT TO NAME THE FILE */}
        {/* ======================================================================= */}
        <BorderedSection
          title="File Naming"
          style={{
            width: "500px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <FormControl disabled={app.logging.isLogging}>
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
                  label={"Save in the form \"NinjaTerm Logs - <DATETIME>.txt\". The current local datetime when logging is started will be used in the form \"YYYY-MM-DD HH-MM-SS\"."}
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
              app.logging.whatToNameTheFile !== WhatToNameTheFile.CUSTOM ||
              app.logging.isLogging
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

        {/* EXISTING FILE BEHAVIOR */}
        {/* ======================================================================= */}
        <BorderedSection
          title="Existing File Behavior"
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <FormControl disabled={app.logging.isLogging}>
            <FormLabel>
              If file already exists when logging is started:
            </FormLabel>
            <RadioGroup
              value={app.logging.existingFileBehavior}
              onChange={(e) => {
                app.logging.setExistingFileBehavior(Number(e.target.value));
              }}
            >
              {/* APPEND */}
              <Tooltip
                title="Appends data to the end of the existing file."
                placement="right"
                arrow
              >
                <FormControlLabel
                  value={ExistingFileBehaviors.APPEND}
                  control={<Radio />}
                  label="Append"
                />
              </Tooltip>
              {/* OVERWRITE */}
              <Tooltip
                title="Overwrites an existing file with the same name."
                placement="right"
                arrow
              >
                <FormControlLabel
                  value={ExistingFileBehaviors.OVERWRITE}
                  control={<Radio />}
                  label="Overwrite"
                />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </BorderedSection>
      </div>

      <BorderedSection title="Enabling and Status" style={{ width: "500px" }}>
        {/* ENABLE LOGGING */}
        {/* ============================================================== */}
        <FormControlLabel
          control={
            <Switch
              name="enableGraphing"
              checked={app.logging.isLogging}
              disabled={!app.logging.canStartStopLogging}
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

        {/* STATUS (GRID) */}
        {/* ============================================================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '180px auto',
            gridTemplateRows: 'auto auto',
          }}
        >
          <div>Writing to file named:</div>
          <div>
            {app.logging.activeFilename !== null
              ? app.logging.activeFilename
              : "n/a"}
          </div>

          <div>Amount of data written:</div>
          <div>
            {app.logging.numBytesWritten !== null
              ? `${app.logging.numBytesWritten}bytes`
              : "n/a"}
          </div>

          <div>File size (approx.):</div>
          <div>
            {app.logging.fileSizeBytes !== null
              ? `${app.logging.fileSizeBytes}bytes`
              : "n/a"}
          </div>
        </div>
      </BorderedSection>
    </div>
  );
});
