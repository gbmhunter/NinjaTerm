import { Checkbox, FormControl, FormControlLabel, FormLabel, InputAdornment, Radio, RadioGroup, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";

import DataProcessingSettings, {
  BackspaceKeyPressBehavior,
  CarriageReturnCursorBehaviors,
  DeleteKeyPressBehaviors,
  NewLineCursorBehaviors,
  NonVisibleCharDisplayBehaviors,
} from "src/Settings/DataProcessingSettings/DataProcessingSettings";
import BorderedSection from "src/Components/BorderedSection";
import ApplyableTextFieldView from "src/Components/ApplyableTextFieldView";

interface Props {
  dataProcessingSettings: DataProcessingSettings;
}

function DataProcessingView(props: Props) {
  const { dataProcessingSettings } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      {/* =============================================================================== */}
      {/* ROW FOR TX */}
      {/* =============================================================================== */}
      <div style={{ display: "flex" }}>
        {/* =============================================================================== */}
        {/* BACKSPACE */}
        {/* =============================================================================== */}
        <BorderedSection title="Backspace" childStyle={{ display: "flex", flexDirection: "column" }}>
          {/* BACKSPACE */}
          <FormControl>
            <FormLabel>When backspace is pressed:</FormLabel>
            <RadioGroup
              value={dataProcessingSettings.backspaceKeyPressBehavior}
              onChange={(e) => {
                dataProcessingSettings.setBackspaceKeyPressBehavior(e.target.value as any);
              }}
            >
              {/* SEND BACKSPACE (0x08) */}
              <Tooltip title="Send the backspace control char (0x08) when the backspace key is pressed." placement="right" arrow>
                <FormControlLabel value={BackspaceKeyPressBehavior.SEND_BACKSPACE} control={<Radio />} label="Send backspace (0x08)" />
              </Tooltip>
              {/* SEND DELETE (0x7F) */}
              <Tooltip title="Send the delete control char (0x7F) when the delete key is pressed." placement="right" arrow>
                <FormControlLabel value={BackspaceKeyPressBehavior.SEND_DELETE} control={<Radio />} label="Send delete (0x7F)" />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </BorderedSection>
        {/* =============================================================================== */}
        {/* DELETE */}
        {/* =============================================================================== */}
        <BorderedSection title="Delete" childStyle={{ display: "flex", flexDirection: "column" }}>
          <FormControl>
            <FormLabel>When delete is pressed:</FormLabel>
            <RadioGroup
              value={dataProcessingSettings.deleteKeyPressBehavior}
              onChange={(e) => {
                dataProcessingSettings.setDeleteKeyPressBehavior(e.target.value as any);
              }}
            >
              {/* SEND BACKSPACE (0x08) */}
              <Tooltip title="Send the backspace control char (0x08) when the delete key is pressed." placement="right" arrow>
                <FormControlLabel value={DeleteKeyPressBehaviors.SEND_BACKSPACE} control={<Radio />} label="Send backspace (0x08)" />
              </Tooltip>
              {/* SEND DELETE (0x7F) */}
              <Tooltip title="Send the delete control char (0x7F) when the delete key is pressed." placement="right" arrow>
                <FormControlLabel value={DeleteKeyPressBehaviors.SEND_DELETE} control={<Radio />} label="Send delete (0x7F)" />
              </Tooltip>
              {/* SEND CSI_3_TILDE ([ESC] [3~) */}
              <Tooltip
                title="Send the VT sequence [ESC][3~ when the delete key is pressed. This is probably what you want if you are interacting with something that expects a terminal, such as the Zephyr Shell. This is also what PuTTY and the nRF Serial Terminal send by default."
                placement="right"
                arrow
              >
                <FormControlLabel value={DeleteKeyPressBehaviors.SEND_VT_SEQUENCE} control={<Radio />} label="Send VT sequence ( ESC [ 3 ~ )" />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </BorderedSection>
      </div>{" "}
      {/* End of row for TX */}
      {/* =============================================================================== */}
      {/* META KEYS */}
      {/* =============================================================================== */}
      <BorderedSection title="Meta Keys" childStyle={{ display: "flex", flexDirection: "column" }}>
        {/* =============================================================================== */}
        {/* CTRL KEYS */}
        {/* =============================================================================== */}
        <Tooltip title="" placement="top" followCursor arrow>
          <FormControlLabel
            control={
              <Checkbox
                checked={dataProcessingSettings.send0x01Thru0x1AWhenCtrlAThruZPressed}
                onChange={(e) => {
                  dataProcessingSettings.setSend0x01Thru0x1AWhenCtrlAThruZPressed(e.target.checked);
                }}
              />
            }
            label="Send 0x01-0x1A when Ctrl+A thru Ctrl+Z is pressed"
            sx={{ marginBottom: "10px" }}
          />
        </Tooltip>
        {/* =============================================================================== */}
        {/* ALT KEYS */}
        {/* =============================================================================== */}
        <Tooltip
          title="This emulates terminal Meta key behavior. Some key presses like Alt-F (move cursor forward by 1 word) and Alt-B (move cursor backwards by 1 word) are supported by Zephyr and other shells. Unfortunately a few key combos get caught by the browser and not passed to NinjaTerm so we can't catch them. This includes Alt-F."
          placement="top"
          followCursor
          arrow
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={dataProcessingSettings.sendEscCharWhenAltKeyPressed}
                onChange={(e) => {
                  dataProcessingSettings.setSendEscCharWhenAltKeyPressed(e.target.checked);
                }}
              />
            }
            label="Send [ESC] + <char> when Alt-<char> is pressed (e.g. Alt-A sends 0x1B 0x41)."
            sx={{ marginBottom: "10px" }}
          />
        </Tooltip>
      </BorderedSection>
      {/* =============================================================================== */}
      {/* ROW FOR ANSI ESCAPE CODES AND ECHO SETTINGS */}
      {/* =============================================================================== */}
      <div style={{ display: "flex" }}>
        {/* =============================================================================== */}
        {/* ANSI ESCAPE CODES */}
        {/* =============================================================================== */}
        <BorderedSection title="ANSI Escape Codes" childStyle={{ display: "flex", flexDirection: "column" }}>
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
                  checked={dataProcessingSettings.ansiEscapeCodeParsingEnabled}
                  onChange={(e) => {
                    dataProcessingSettings.setAnsiEscapeCodeParsingEnabled(e.target.checked);
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
                endAdornment: <InputAdornment position="start">chars</InputAdornment>,
              }}
              applyableTextField={dataProcessingSettings.maxEscapeCodeLengthChars}
              sx={{ marginBottom: "20px" }}
            />
          </Tooltip>
        </BorderedSection>

        <BorderedSection title="Echo" childStyle={{ display: "flex", flexDirection: "column" }}>
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
                  checked={dataProcessingSettings.localTxEcho}
                  onChange={(e) => {
                    dataProcessingSettings.setLocalTxEcho(e.target.checked);
                  }}
                />
              }
              label="Local TX Echo"
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
        </BorderedSection>
      </div>{" "}
      {/* End of row for ANSI escape codes and echo settings */}
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
                value={dataProcessingSettings.newLineCursorBehavior}
                onChange={(e) => {
                  dataProcessingSettings.setNewLineCursorBehavior(e.target.value as any);
                }}
              >
                {/* DO NOTHING */}
                <Tooltip title="Don't move the cursor at all when a new line character is received." placement="right" arrow>
                  <FormControlLabel value={NewLineCursorBehaviors.DO_NOTHING} control={<Radio />} label="Don't move the cursor" data-testid="new-line-dont-move-cursor" />
                </Tooltip>
                {/* MOVE DOWN ONE LINE */}
                <Tooltip
                  title="Move the cursor directly down one line. A separate carriage return is required if you want to move the cursor to the start of the new line."
                  placement="right"
                  arrow
                >
                  <FormControlLabel value={NewLineCursorBehaviors.NEW_LINE} control={<Radio />} label="Move cursor down one line (new line)" />
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
              placement="right"
              arrow
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name="swallowNewLine"
                    checked={dataProcessingSettings.swallowNewLine}
                    onChange={(e) => {
                      dataProcessingSettings.setSwallowNewLine(e.target.checked);
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
                value={dataProcessingSettings.carriageReturnCursorBehavior}
                onChange={(e) => {
                  dataProcessingSettings.setCarriageReturnBehavior(e.target.value as any);
                }}
              >
                {/* DO NOTHING */}
                <Tooltip title="Don't move the cursor at all when a carriage return character is received." placement="right" arrow>
                  <FormControlLabel value={CarriageReturnCursorBehaviors.DO_NOTHING} control={<Radio />} label="Don't move the cursor" />
                </Tooltip>
                {/* MOVE CURSOR TO START OF LINE */}
                <Tooltip
                  title="Move the cursor to the start of the current line. A separate new line character is required if you want to move the cursor down one line."
                  placement="right"
                  arrow
                >
                  <FormControlLabel value={CarriageReturnCursorBehaviors.CARRIAGE_RETURN} control={<Radio />} label="Move cursor to the start of the current line" />
                </Tooltip>
                {/* CARRIAGE RETURN AND NEW LINE */}
                <Tooltip title="Move the cursor back to the start of the line and then down one line." placement="right" arrow>
                  <FormControlLabel
                    value={CarriageReturnCursorBehaviors.CARRIAGE_RETURN_AND_NEW_LINE}
                    control={<Radio />}
                    label="Move cursor to the start and then down one line."
                  />
                </Tooltip>
              </RadioGroup>
            </FormControl>
            {/* SWALLOW \r */}
            <Tooltip
              title="If enabled, carriage return characters will not be printed to the terminal display. If disabled, carriage return characters will be printed before any cursor movement occurs because of the carriage return, such that the carriage return character will be printed at the end of the row, not the start of the row."
              placement="right"
              arrow
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name="swallowCarriageReturn"
                    checked={dataProcessingSettings.swallowCarriageReturn}
                    onChange={(e) => {
                      dataProcessingSettings.setSwallowCarriageReturn(e.target.checked);
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
            <FormLabel>For all received bytes in the range 0x00-0xFF that are not visible ASCII characters AND that are not swallowed above:</FormLabel>
            <RadioGroup
              value={dataProcessingSettings.nonVisibleCharDisplayBehavior}
              onChange={(e) => {
                dataProcessingSettings.setNonVisibleCharDisplayBehavior(e.target.value as any);
              }}
            >
              {/* SWALLOW */}
              <Tooltip title="Do not display bytes that are not visible ASCII characters." placement="right" arrow>
                <FormControlLabel value={NonVisibleCharDisplayBehaviors.SWALLOW} control={<Radio />} label="Swallow" />
              </Tooltip>
              {/* ASCII CONTROL CODES GLYPHS AND HEX GLYPHS */}
              <Tooltip
                title="Convert bytes that are control chars into control char glyphs, and all other bytes that are not valid ASCII characters ([0x80-0xFF]) into hex code glyphs."
                placement="right"
                arrow
              >
                <FormControlLabel
                  value={NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS}
                  control={<Radio />}
                  label="Convert ASCII control codes to control code glyphs, and all others to hex code glyphs"
                />
              </Tooltip>
              {/* ALL TO HEX CODE GLYPHS */}
              <Tooltip title="Convert all non-visible ASCII characters into hex code glyphs." placement="right" arrow>
                <FormControlLabel value={NonVisibleCharDisplayBehaviors.HEX_GLYPHS} control={<Radio />} label="Convert all to hex code glyphs" />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </div>
      </BorderedSection>
      {/* =============================================================================== */}
      {/* COPY/PASTE SETTINGS */}
      {/* =============================================================================== */}
      <BorderedSection title="Copy/Paste Settings">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "600px",
          }}
        >
          <Tooltip
            title="The two common ways of new terminal rows being created is either by receiving a LF char, or by running out of columns in the terminal, and the text wrapping onto a new row. When enabled, LF will not be added to the clipboard if the row was created due to wrapping. You generally want this enabled so that you can paste large chunks of received data into an external program without getting new lines inserted where they weren't in the original data."
            placement="top"
            followCursor
            arrow
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={dataProcessingSettings.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping}
                  onChange={(e) => {
                    dataProcessingSettings.setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping(e.target.checked);
                  }}
                />
              }
              label="When copying text from the terminal to the clipboard with Ctrl-Shift-C, do not insert LF into clipboard if row was created due to wrapping."
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
          <Tooltip
            title="You usually want this enabled, as when copying text TO the clipboard on Windows, LF is automatically replaced with CRLF. So this will undo that operation when pasting, meaning you can copy terminal text and then paste it and get the same data."
            placement="top"
            followCursor
            arrow
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={dataProcessingSettings.whenPastingOnWindowsReplaceCRLFWithLF}
                  onChange={(e) => {
                    dataProcessingSettings.setWhenPastingOnWindowsReplaceCRLFWithLF(e.target.checked);
                  }}
                />
              }
              label="When pasting text from the clipboard into a terminal with Ctrl-Shift-V, convert CRLF to LF when on Windows."
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
        </div>
      </BorderedSection>
    </div>
  );
}

export default observer(DataProcessingView);
