import {
  Button,
  Checkbox,
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
        // alignItems: "flex-start",
        gap: "5px",
      }}
    >
      <h2 style={{ marginLeft: "20px" }}>LOGGING</h2>
      <div
        style={{
          maxWidth: "800px",
          display: "grid",
          gridTemplateColumns: "auto auto",
          gridTemplateRows: "auto auto",
        }}
      >
        <BorderedSection
          title="Directory and Permissions"
          style={{
            gridColumn: "1 / 3",
            gridRow: "1 / 2",
          }}
          childStyle={{
            minWidth: "200px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Button
            variant="contained"
            // size="small"
            disabled={app.logging.isLogging}
            onClick={() => {
              app.logging.openDirPicker();
            }}
            sx={{ width: "350px" }}
          >
            Select log directory
          </Button>
          <div>NOTE: Directories that browsers consider "System Directories" cannot be selected. This includes your User root directory, C:\ or root mount point, Downloads and Documents directories. Sub-directories of these can be chosen.</div>
          </div>

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

        {/* WHAT TO NAME THE FILE */}
        {/* ======================================================================= */}
        <BorderedSection
          title="File Naming"
          childStyle={{
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
                  label={
                    'Save in the form "NinjaTerm Logs - <DATETIME>.txt". The current local datetime when logging is started will be used in the form "YYYY-MM-DD HH-MM-SS".'
                  }
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
          childStyle={{ display: "flex", flexDirection: "column", gap: "20px" }}
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

        <BorderedSection
          title="What To Log?"
          childStyle={{ display: "flex", flexDirection: "column" }}
        >
          <Tooltip title="Log the raw bytes being received from the serial port to the log file.">
            <FormControlLabel
              control={
                <Checkbox
                  checked={app.logging.logRawTxData}
                  disabled={app.logging.isLogging}
                  onChange={(e) => {
                    app.logging.setLogRawTxData(e.target.checked);
                  }}
                />
              }
              label="Raw TX data"
            />
          </Tooltip>
          <Tooltip title="Log the raw bytes being sent out the serial port to the log file.">
            <FormControlLabel
              control={
                <Checkbox
                  checked={app.logging.logRawRxData}
                  disabled={app.logging.isLogging}
                  onChange={(e) => {
                    app.logging.setLogRawRxData(e.target.checked);
                  }}
                />
              }
              label="Raw RX data"
              checked={app.logging.logRawRxData}
            />
          </Tooltip>
        </BorderedSection>

        <BorderedSection
          title="Enabling and Status"
          childStyle={{ width: "500px" }}
        >
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
              display: "grid",
              gridTemplateColumns: "180px auto",
              gridTemplateRows: "auto auto",
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
      </div> {/* END OF GRID */}
      <p style={{ maxWidth: '600px' }}>The log file is written to once per second, so your data should still be there even if something unexpected happens (e.g. computer battery runs flat, Windows decides it's a good time to update).</p>
    </div>
  );
});
