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
  CarriageReturnCursorBehaviors,
  NewLineCursorBehaviors,
  NonVisibleCharDisplayBehaviors,
} from "src/Settings/DataProcessingSettings/DataProcessingSettings";
import BorderedSection from "src/Components/BorderedSection";
import ApplyableTextFieldView from "src/Components/ApplyableTextFieldView";

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
      {/* ROW FOR ANSI ESCAPE CODES AND ECHO SETTINGS */}
      {/* =============================================================================== */}
      <div style={{ display: 'flex' }}>
        {/* =============================================================================== */}
        {/* ANSI ESCAPE CODES */}
        {/* =============================================================================== */}
        <BorderedSection title="ANSI Escape Codes" childStyle={{ display: 'flex', flexDirection: 'column' }}>
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
                  checked={app.settings.dataProcessingSettings.ansiEscapeCodeParsingEnabled}
                  onChange={(e) => {
                    app.settings.dataProcessingSettings.setAnsiEscapeCodeParsingEnabled(e.target.checked);
                  }}
                />
              }
              label="Enable ANSI Escape Code Parsing"
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
            <ApplyableTextFieldView
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
              applyableTextField={app.settings.dataProcessingSettings.maxEscapeCodeLengthChars}
              sx={{ marginBottom: "20px" }}
            />
          </Tooltip>

        </BorderedSection>

        <BorderedSection title="Echo" childStyle={{ display: 'flex', flexDirection: 'column' }}>

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
                checked={app.settings.dataProcessingSettings.localTxEcho}
                onChange={(e) => {
                  app.settings.dataProcessingSettings.setLocalTxEcho(e.target.checked);
                }}
              />
            }
            label="Local TX Echo"
            sx={{ marginBottom: "10px" }}
          />
        </Tooltip>
        </BorderedSection>
      </div> {/* End of row for ANSI escape codes and echo settings */}

      {/* Row with new line and carriage return settings */}
      <div style={{ display: "flex" }}>
        {/* =============================================================================== */}
        {/* NEW LINE SETTINGS */}
        {/* =============================================================================== */}
        <BorderedSection title="New Lines">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "300px",
              gap: "20px",
            }}
          >
            {/* NEW LINE BEHAVIOR */}
            <FormControl>
              <FormLabel>When a \n byte is received:</FormLabel>
              <RadioGroup
                value={
                  app.settings.dataProcessingSettings.newLineCursorBehavior
                }
                onChange={(e) => {
                  app.settings.dataProcessingSettings.setNewLineCursorBehavior(
                    e.target.value as any
                  );
                }}
              >
                {/* DO NOTHING */}
                <Tooltip
                  title="Don't move the cursor at all when a new line character is received."
                  placement="right"
                  arrow
                >
                  <FormControlLabel
                    value={NewLineCursorBehaviors.DO_NOTHING}
                    control={<Radio />}
                    label="Don't move the cursor"
                    data-testid="new-line-dont-move-cursor"
                  />
                </Tooltip>
                {/* MOVE DOWN ONE LINE */}
                <Tooltip
                  title="Move the cursor directly down one line. A separate carriage return is required if you want to move the cursor to the start of the new line."
                  placement="right"
                  arrow
                >
                  <FormControlLabel
                    value={NewLineCursorBehaviors.NEW_LINE}
                    control={<Radio />}
                    label="Move cursor down one line (new line)"
                  />
                </Tooltip>
                {/* NEW LINE AND CARRIAGE RETURN */}
                <Tooltip
                  title="Move the cursor back to the start of the line and then down one line. This is the most common behavior for receiving a new line character."
                  placement="right"
                  arrow
                >
                  <FormControlLabel
                    value={NewLineCursorBehaviors.CARRIAGE_RETURN_AND_NEW_LINE}
                    control={<Radio />}
                    label="Move cursor to the start of line and then down one line."
                  />
                </Tooltip>
              </RadioGroup>
            </FormControl>
            {/* SWALLOW \n */}
            <Tooltip
              title="If enabled, new line characters will not be printed to the terminal display. If disabled, new line characters will be printed before any cursor movement occurs because of the new line, such that the new line character will be printed at the end of the existing line, not the start of the new line."
              placement="top"
              arrow
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name="swallowNewLine"
                    checked={app.settings.dataProcessingSettings.swallowNewLine}
                    onChange={(e) => {
                      app.settings.dataProcessingSettings.setSwallowNewLine(
                        e.target.checked
                      );
                    }}
                  />
                }
                label="Swallow \n bytes"
                sx={{ marginBottom: "10px" }}
              />
            </Tooltip>
          </div>
        </BorderedSection>

        {/* =============================================================================== */}
        {/* CARRIAGE RETURN SETTINGS */}
        {/* =============================================================================== */}
        <BorderedSection title="Carriage Returns">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "300px",
              gap: "20px",
            }}
          >
            {/* CARRIAGE RETURN CURSOR BEHAVIOR */}
            <FormControl>
              <FormLabel>When a \r byte is received:</FormLabel>
              <RadioGroup
                value={
                  app.settings.dataProcessingSettings
                    .carriageReturnCursorBehavior
                }
                onChange={(e) => {
                  app.settings.dataProcessingSettings.setCarriageReturnBehavior(
                    e.target.value as any
                  );
                }}
              >
                {/* DO NOTHING */}
                <Tooltip
                  title="Don't move the cursor at all when a carriage return character is received."
                  placement="right"
                  arrow
                >
                  <FormControlLabel
                    value={CarriageReturnCursorBehaviors.DO_NOTHING}
                    control={<Radio />}
                    label="Don't move the cursor"
                  />
                </Tooltip>
                {/* MOVE CURSOR TO START OF LINE */}
                <Tooltip
                  title="Move the cursor to the start of the current line. A separate new line character is required if you want to move the cursor down one line."
                  placement="right"
                  arrow
                >
                  <FormControlLabel
                    value={CarriageReturnCursorBehaviors.CARRIAGE_RETURN}
                    control={<Radio />}
                    label="Move cursor to the start of the current line"
                  />
                </Tooltip>
                {/* CARRIAGE RETURN AND NEW LINE */}
                <Tooltip
                  title="Move the cursor back to the start of the line and then down one line."
                  placement="right"
                  arrow
                >
                  <FormControlLabel
                    value={
                      CarriageReturnCursorBehaviors.CARRIAGE_RETURN_AND_NEW_LINE
                    }
                    control={<Radio />}
                    label="Move cursor to the start and then down one line."
                  />
                </Tooltip>
              </RadioGroup>
            </FormControl>
            {/* SWALLOW \r */}
            <Tooltip
              title="If enabled, carriage return characters will not be printed to the terminal display. If disabled, carriage return characters will be printed before any cursor movement occurs because of the carriage return, such that the carriage return character will be printed at the end of the row, not the start of the row."
              placement="top"
              arrow
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name="swallowCarriageReturn"
                    checked={
                      app.settings.dataProcessingSettings.swallowCarriageReturn
                    }
                    onChange={(e) => {
                      app.settings.dataProcessingSettings.setSwallowCarriageReturn(
                        e.target.checked
                      );
                    }}
                  />
                }
                label="Swallow \r bytes"
                sx={{ marginBottom: "10px" }}
              />
            </Tooltip>
          </div>
        </BorderedSection>
      </div>{" "}
      {/* End of row with new line and carriage return settings */}
      {/* =============================================================================== */}
      {/* NON-VISIBLE CHAR DISPLAY */}
      {/* =============================================================================== */}
      <BorderedSection title="Non-visible Character Display">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "600px",
            gap: "20px",
          }}
        >
          {/* RADIO GROUP */}
          <FormControl>
            <FormLabel>
              For all received bytes in the range 0x00-0xFF that are not visible
              ASCII characters AND that are not swallowed above:
            </FormLabel>
            <RadioGroup
              value={
                app.settings.dataProcessingSettings
                  .nonVisibleCharDisplayBehavior
              }
              onChange={(e) => {
                app.settings.dataProcessingSettings.setNonVisibleCharDisplayBehavior(
                  e.target.value as any
                );
              }}
            >
              {/* SWALLOW */}
              <Tooltip title="" placement="right" arrow>
                <FormControlLabel
                  value={NonVisibleCharDisplayBehaviors.SWALLOW}
                  control={<Radio />}
                  label="Swallow"
                />
              </Tooltip>
              {/* ASCII CONTROL CODES GLYPHS AND HEX GLYPHS */}
              <Tooltip title="" placement="right" arrow>
                <FormControlLabel
                  value={
                    NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS
                  }
                  control={<Radio />}
                  label="Convert ASCII control codes to control code glyphs, and all others to hex code glyphs"
                />
              </Tooltip>
              {/* ALL TO HEX CODE GLYPHS */}
              <Tooltip title="" placement="right" arrow>
                <FormControlLabel
                  value={NonVisibleCharDisplayBehaviors.HEX_GLYPHS}
                  control={<Radio />}
                  label="Convert all to hex code glyphs"
                />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </div>
      </BorderedSection>
    </div>
  );
}

export default observer(DataProcessingView);
