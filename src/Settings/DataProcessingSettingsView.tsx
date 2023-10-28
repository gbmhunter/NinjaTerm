import React from "react";
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";
import { observer } from "mobx-react-lite";

import { App } from "src/App";
import {
  DataViewConfiguration,
  NewLineBehaviors,
  dataViewConfigEnumToDisplayName,
} from "src/Settings/DataProcessingSettings";
import BorderedSection from "src/Components/BorderedSection";

interface Props {
  app: App;
}

function DataProcessingView(props: Props) {
  const { app } = props;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "start" }}
    >
      {/* =============================================================================== */}
      {/* ANSI ESCAPE CODE PARSING ENABLED */}
      {/* =============================================================================== */}
      <Tooltip
        title="If enabled, ANSI escape codes will be parsed. At present, CSI color codes and
        some of the move cursor commands are supported."
        placement="top"
        arrow
      >
        <FormControlLabel
          control={
            <Checkbox
              name="ansiEscapeCodeParsingEnabled"
              checked={
                app.settings.dataProcessing.visibleData.fields
                  .ansiEscapeCodeParsingEnabled.value
              }
              onChange={(e) => {
                app.settings.dataProcessing.onFieldChange(
                  e.target.name,
                  e.target.checked
                );
              }}
            />
          }
          label="ANSI Escape Code Parsing"
          sx={{ marginBottom: "10px" }}
        />
      </Tooltip>
      {/* =============================================================================== */}
      {/* MAX. ESCAPE CODE LENGTH */}
      {/* =============================================================================== */}
      <Tooltip
        title="The max. length of escape code allowed (in characters). Certain malformed escape codes (or data interruptions) could cause the escape code parser to get stuck thinking the incoming data stream is part of an escape code. This limit is so that at a certain length the parser rejects the partial code and goes back to the IDLE state. This includes all characters in the escape code, including the starting \x1B byte. Must be a least 2 chars."
        followCursor
        arrow
      >
        <TextField
          id="outlined-basic"
          name="maxEscapeCodeLengthChars"
          label="Max. Escape Code Length"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">chars</InputAdornment>
            ),
          }}
          value={
            app.settings.dataProcessing.visibleData.fields
              .maxEscapeCodeLengthChars.value
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            app.settings.dataProcessing.onFieldChange(
              event.target.name,
              event.target.value
            );
          }}
          error={
            app.settings.dataProcessing.visibleData.fields
              .maxEscapeCodeLengthChars.hasError
          }
          helperText={
            app.settings.dataProcessing.visibleData.fields
              .maxEscapeCodeLengthChars.errorMsg
          }
          sx={{ marginBottom: "20px" }}
        />
      </Tooltip>
      {/* =============================================================================== */}
      {/* DATA WIDTH */}
      {/* =============================================================================== */}
      <Tooltip
        title="The max. number of characters to display per line in the terminal before wrapping to the next line. Must be a positive integer. New line characters also cause text to jump to the next line."
        followCursor
        arrow
      >
        <TextField
          id="outlined-basic"
          name="terminalWidthChars"
          label="Terminal Width"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">chars</InputAdornment>
            ),
          }}
          value={
            app.settings.dataProcessing.visibleData.fields.terminalWidthChars
              .value
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            app.settings.dataProcessing.onFieldChange(
              event.target.name,
              event.target.value
            );
          }}
          error={
            app.settings.dataProcessing.visibleData.fields.terminalWidthChars
              .hasError
          }
          helperText={
            app.settings.dataProcessing.visibleData.fields.terminalWidthChars
              .errorMsg
          }
          sx={{ marginBottom: "20px" }}
        />
      </Tooltip>
      {/* =============================================================================== */}
      {/* CHAR SIZE */}
      {/* =============================================================================== */}
      <Tooltip
        title="The font size (in pixels) of characters displayed in the terminal."
        followCursor
        arrow
      >
        <TextField
          id="outlined-basic"
          name="charSizePx"
          label="Char Size"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: <InputAdornment position="start">px</InputAdornment>,
          }}
          value={app.settings.dataProcessing.charSizePx.dispValue}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            app.settings.dataProcessing.setCharSizePxDisp(event.target.value);
          }}
          onBlur={() => {
            app.settings.dataProcessing.applyCharSizePx();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              app.settings.dataProcessing.applyCharSizePx();
            }
          }}
          error={app.settings.dataProcessing.charSizePx.hasError}
          helperText={app.settings.dataProcessing.charSizePx.errorMsg}
          sx={{ marginBottom: "20px" }}
        />
      </Tooltip>
      {/* =============================================================================== */}
      {/* SCROLLBACK BUFFER SIZE */}
      {/* =============================================================================== */}
      <Tooltip
        title="The max. number of rows to store in any terminal scrollback buffer (TX, RX, TX/RX).
        Increasing this will give you more history but decrease performance and increase memory usage. Must be a positive non-zero integer."
        followCursor
        arrow
      >
        <TextField
          name="scrollbackBufferSizeRows"
          label="Scrollback Buffer Size"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">rows</InputAdornment>
            ),
          }}
          value={
            app.settings.dataProcessing.visibleData.fields
              .scrollbackBufferSizeRows.value
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            app.settings.dataProcessing.onFieldChange(
              event.target.name,
              event.target.value
            );
          }}
          error={
            app.settings.dataProcessing.visibleData.fields
              .scrollbackBufferSizeRows.hasError
          }
          helperText={
            app.settings.dataProcessing.visibleData.fields
              .scrollbackBufferSizeRows.errorMsg
          }
          sx={{ marginBottom: "20px" }}
        />
      </Tooltip>
      {/* =============================================================================== */}
      {/* DATA VIEW CONFIGURATION */}
      {/* =============================================================================== */}
      <Tooltip
        title="Control whether a combined TX/RX terminal or two separate terminals are displayed."
        placement="top"
        followCursor
        arrow
      >
        <FormControl size="small" sx={{ minWidth: "210px" }}>
          <InputLabel>Data View Configuration</InputLabel>
          <Select
            name="dataViewConfiguration"
            value={
              app.settings.dataProcessing.visibleData.fields
                .dataViewConfiguration.value
            }
            onChange={(e) => {
              app.settings.dataProcessing.onFieldChange(
                e.target.name,
                Number(e.target.value)
              );
            }}
            sx={{ marginBottom: "20px" }}
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
      {/* =============================================================================== */}
      {/* LOCAL TX ECHO */}
      {/* =============================================================================== */}
      <Tooltip
        title="If enabled, transmitted data will be treated as received data. Useful in ASCII mode when
        the device on the other end of the serial port does not echo back characters. Disable this if
        you see two of every character appear."
        placement="top"
        followCursor
        arrow
      >
        <FormControlLabel
          control={
            <Checkbox
              name="localTxEcho"
              checked={
                app.settings.dataProcessing.visibleData.fields.localTxEcho.value
              }
              onChange={(e) => {
                app.settings.dataProcessing.onFieldChange(
                  e.target.name,
                  e.target.checked
                );
              }}
            />
          }
          label="Local TX Echo"
          sx={{ marginBottom: "10px" }}
        />
      </Tooltip>
      {/* =============================================================================== */}
      {/* APPLY BUTTON */}
      {/* =============================================================================== */}
      <Button
        variant="contained"
        color="success"
        disabled={!app.settings.dataProcessing.isApplyable}
        onClick={() => {
          app.settings.dataProcessing.applyChanges();
        }}
      >
        Apply
      </Button>

      {/* =============================================================================== */}
      {/* NEW LINE SECTION */}
      {/* =============================================================================== */}
      <BorderedSection title="New Lines">
        <div style={{ display: "flex", flexDirection: "column", maxWidth: '300px', gap: '20px' }}>
          {/* NEW LINE BEHAVIOR */}
          <FormControl>
            <FormLabel>When a \n byte is received:</FormLabel>
            <RadioGroup
              value={app.settings.dataProcessing.newLineBehavior}
              onChange={(e) => {
                app.settings.dataProcessing.setNewLineBehavior(e.target.value as any);
              }}
            >
              <FormControlLabel value={NewLineBehaviors.DO_NOTHING} control={<Radio />} label="Don't move the cursor" />
              <FormControlLabel value={NewLineBehaviors.NEW_LINE} control={<Radio />} label="Move cursor down one line (new line)" />
              <FormControlLabel value={NewLineBehaviors.NEW_LINE_AND_CARRIAGE_RETURN} control={<Radio />} label="Move cursor down and to start of line (new line and carriage return)." />
            </RadioGroup>
          </FormControl>
          {/* SWALLOW \n */}
          <Tooltip
            title="If enabled, new line characters will not be printed to the terminal display."
            placement="top"
            arrow
          >
            <FormControlLabel
              control={
                <Checkbox
                  name="swallowNewLine"
                  checked={app.settings.dataProcessing.swallowNewLine}
                  onChange={(e) => {
                    app.settings.dataProcessing.setSwallowNewLine(e.target.checked);
                  }}
                />
              }
              label="Swallow \n bytes"
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
        </div>
      </BorderedSection>
    </div>
  );
}

export default observer(DataProcessingView);
