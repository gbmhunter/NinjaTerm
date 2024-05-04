import { Checkbox, FormControl, FormControlLabel, FormLabel, InputAdornment, Radio, RadioGroup, TextField, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";

import RxSettings, {
  CarriageReturnCursorBehavior,
  DataType,
  HexCase,
  NewLineCursorBehavior,
  NonVisibleCharDisplayBehaviors,
} from "src/model/Settings/RxSettings/RxSettings";
import BorderedSection from "src/view/Components/BorderedSection";
import ApplyableTextFieldView from "src/view/Components/ApplyableTextFieldView";
import { number } from "zod";
import ApplyableTextFieldV2View from "src/view/Components/ApplyableTextFieldV2/ApplyableTextFieldV2View";

interface Props {
  rxSettings: RxSettings;
}

function RxSettingsView(props: Props) {
  const { rxSettings } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      {/* =============================================================================== */}
      {/* DATA TYPE */}
      {/* =============================================================================== */}
      <div style={{ display: "flex" }}>
        <BorderedSection title="Data Type" childStyle={{ display: "flex", flexDirection: "column" }}>
          <FormControl>
            <FormLabel>How to interpret RX data:</FormLabel>
            <RadioGroup
              value={rxSettings.config.dataType}
              onChange={(e) => {
                rxSettings.setDataType(parseInt(e.target.value));
              }}
            >
              {/* ASCII */}
              <Tooltip title="Interpret RX data as ASCII characters." placement="right" arrow>
                <FormControlLabel value={DataType.ASCII} control={<Radio />} label="ASCII" />
              </Tooltip>
              {/* HEX */}
              <Tooltip title="Interpret RX data as hexidecimal numbers." placement="right" arrow>
                <FormControlLabel value={DataType.HEX} control={<Radio />} label="Hex" />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </BorderedSection>
      </div>
      {/* =============================================================================== */}
      {/* DATA TYPE = ASCII */}
      {/* =============================================================================== */}
      <div className="ascii-block" style={{ display: rxSettings.config.dataType === DataType.ASCII ? "block" : "none" }}>
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
                    checked={rxSettings.config.ansiEscapeCodeParsingEnabled}
                    onChange={(e) => {
                      rxSettings.setAnsiEscapeCodeParsingEnabled(e.target.checked);
                    }}
                    disabled={rxSettings.config.dataType !== 1}
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
              <ApplyableTextFieldV2View
                id="outlined-basic"
                name="maxEscapeCodeLengthChars"
                label="Max. Escape Code Length"
                variant="outlined"
                size="small"
                InputProps={{
                  endAdornment: <InputAdornment position="start">chars</InputAdornment>,
                }}
                applyableTextField={rxSettings.maxEscapeCodeLengthChars}
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
                    checked={rxSettings.config.localTxEcho}
                    onChange={(e) => {
                      rxSettings.setLocalTxEcho(e.target.checked);
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
                  value={rxSettings.config.newLineCursorBehavior}
                  onChange={(e) => {
                    rxSettings.setNewLineCursorBehavior(e.target.value as any);
                  }}
                >
                  {/* DO NOTHING */}
                  <Tooltip title="Don't move the cursor at all when a new line character is received." placement="right" arrow>
                    <FormControlLabel value={NewLineCursorBehavior.DO_NOTHING} control={<Radio />} label="Don't move the cursor" data-testid="new-line-dont-move-cursor" />
                  </Tooltip>
                  {/* MOVE DOWN ONE LINE */}
                  <Tooltip
                    title="Move the cursor directly down one line. A separate carriage return is required if you want to move the cursor to the start of the new line."
                    placement="right"
                    arrow
                  >
                    <FormControlLabel value={NewLineCursorBehavior.NEW_LINE} control={<Radio />} label="Move cursor down one line (new line)" />
                  </Tooltip>
                  {/* NEW LINE AND CARRIAGE RETURN */}
                  <Tooltip
                    title="Move the cursor back to the start of the line and then down one line. This is the most common behavior for receiving a new line character."
                    placement="right"
                    arrow
                  >
                    <FormControlLabel
                      value={NewLineCursorBehavior.CARRIAGE_RETURN_AND_NEW_LINE}
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
                      checked={rxSettings.config.swallowNewLine}
                      onChange={(e) => {
                        rxSettings.setSwallowNewLine(e.target.checked);
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
                  value={rxSettings.config.carriageReturnCursorBehavior}
                  onChange={(e) => {
                    rxSettings.setCarriageReturnBehavior(e.target.value as any);
                  }}
                >
                  {/* DO NOTHING */}
                  <Tooltip title="Don't move the cursor at all when a carriage return character is received." placement="right" arrow>
                    <FormControlLabel value={CarriageReturnCursorBehavior.DO_NOTHING} control={<Radio />} label="Don't move the cursor" />
                  </Tooltip>
                  {/* MOVE CURSOR TO START OF LINE */}
                  <Tooltip
                    title="Move the cursor to the start of the current line. A separate new line character is required if you want to move the cursor down one line."
                    placement="right"
                    arrow
                  >
                    <FormControlLabel value={CarriageReturnCursorBehavior.CARRIAGE_RETURN} control={<Radio />} label="Move cursor to the start of the current line" />
                  </Tooltip>
                  {/* CARRIAGE RETURN AND NEW LINE */}
                  <Tooltip title="Move the cursor back to the start of the line and then down one line." placement="right" arrow>
                    <FormControlLabel
                      value={CarriageReturnCursorBehavior.CARRIAGE_RETURN_AND_NEW_LINE}
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
                      checked={rxSettings.config.swallowCarriageReturn}
                      onChange={(e) => {
                        rxSettings.setSwallowCarriageReturn(e.target.checked);
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
                value={rxSettings.config.nonVisibleCharDisplayBehavior}
                onChange={(e) => {
                  rxSettings.setNonVisibleCharDisplayBehavior(e.target.value as any);
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
      </div>{" "}
      {/* End of ASCII block */}
      {/* =============================================================================== */}
      {/* DATA TYPE = HEX */}
      {/* =============================================================================== */}
      <div className="hex-block" style={{ display: rxSettings.config.dataType === DataType.HEX ? "block" : "none" }}>
        <BorderedSection title="Hex Settings" childStyle={{ display: "flex", flexDirection: "column" }}>
          {/* HEX SEPARATOR */}
          {/* ================================================ */}
          <Tooltip
            title="This string is append to every displayed hex value. For example, use &quot; &quot; to separate hex values with a space, or &quot;,&quot; to create CSV-like data. You can also use an empty string to have no separator at all."
            followCursor
            arrow
          >
            <ApplyableTextFieldView
              id="outlined-basic"
              name="hexSeparator"
              label="Separator Between Hex Values"
              variant="outlined"
              size="small"
              applyableTextField={rxSettings.config.hexSeparator}
              sx={{ marginBottom: "20px" }}
            />
          </Tooltip>
          {/* UPPERCASE/LOWERCASE HEX */}
          {/* ================================================ */}
          <FormControl>
            <FormLabel>Upper/lowercase hex:</FormLabel>
            <RadioGroup
              value={rxSettings.config.hexCase}
              onChange={(e) => {
                rxSettings.setHexCase(parseInt(e.target.value));
              }}
            >
              {/* UPPERCASE */}
              <Tooltip title="Use uppercase A-F when printing hex values." placement="right" arrow>
                <FormControlLabel value={HexCase.UPPERCASE} control={<Radio />} label="Uppercase" />
              </Tooltip>
              {/* LOWERCASE */}
              <Tooltip title="Use lowercase a-f when printing hex values." placement="right" arrow>
                <FormControlLabel value={HexCase.LOWERCASE} control={<Radio />} label="Lowercase" />
              </Tooltip>
            </RadioGroup>
          </FormControl>
          {/* PREFIX HEX VALUES WITH 0x */}
          {/* ================================================ */}
          <Tooltip
            title="If enabled, &quot;0x&quot; will be prefixed to all hex values displayed in the terminal. Normally this just adds more clutter to the data, but might be useful in some cases!"
            placement="right"
            followCursor
            arrow
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={rxSettings.config.prefixHexValuesWith0x}
                  onChange={(e) => {
                    rxSettings.setPrefixHexValuesWith0x(e.target.checked);
                  }}
                />
              }
              label="Prefix hex values with &quot;0x&quot;."
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
          {/* PREVENT HEX VALUES FROM WRAPPING ACROSS ROWS */}
          {/* ================================================ */}
          <Tooltip
            title="If enabled, hex values will not be broken into two to wrap to the next row if the terminal reaches the last column. A new row will be created when a whole hex value cannot fit onto the existing row. This has no effect if a hex value cannot fit into a single row (e.g. small column count)."
            placement="right"
            followCursor
            arrow
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={rxSettings.config.preventHexValuesWrappingAcrossRows}
                  onChange={(e) => {
                    rxSettings.setPreventHexValuesWrappingAcrossRows(e.target.checked);
                  }}
                />
              }
              label="Prevent hex values from wrapping across rows."
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
          {/* INSERT NEW LINE ON HEX VALUE */}
          {/* ================================================ */}
          <Tooltip
            title="Check this if you want to insert new lines when specific bytes arrive from the serial port. Handy when to have specific start-of-packet/end-of-packet delimiters."
            placement="right"
            followCursor
            arrow
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={rxSettings.config.insetNewLineOnHexValue}
                  onChange={(e) => {
                    rxSettings.setInsetNewLineOnHexValue(e.target.checked);
                  }}
                />
              }
              label="Insert new line on hex value."
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
          {/* NEW LINE HEX VALUE */}
          {/* ================================================ */}
          <Tooltip
            title="The hex value to look for in the RX stream. If found, a new line will be inserted either before or after the value (depending on the setting). Must be a valid hex value, e.g. &quot;0A&quot; or &quot;ff&quot;."
            followCursor
            arrow
          >
            {/* <TextField
              id="outlined-basic"
              name="newLineHexValue"
              label="Hex value to insert new line on"
              variant="outlined"
              size="small"
              disabled={!rxSettings.data.insetNewLineOnHexValue}
              value={rxSettings.data.newLineHexValue.displayed}
              error={rxSettings.data.newLineHexValue.errorMsg !== ""}
              helperText={rxSettings.data.newLineHexValue.errorMsg}
              sx={{ marginBottom: "20px" }}
              onChange={(e) => {
                rxSettings.setNewlineHexValueDisplayed(e.target.value);
              }}
              onBlur={() => {
                rxSettings.applyNewlineHexValue();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  rxSettings.applyNewlineHexValue();
                }
              }}
            /> */}
            <ApplyableTextFieldV2View
              id="outlined-basic"
              name="newLineHexValue"
              label="Hex value to insert new line on"
              variant="outlined"
              size="small"
              applyableTextField={rxSettings.newLineHexValue}
              sx={{ marginBottom: "20px" }}
            />
          </Tooltip>
          {/* NEWLINE BEFORE OR AFTER HEX VALUE */}
          {/* ================================================ */}
          <FormControl disabled={!rxSettings.config.insetNewLineOnHexValue}>
            <FormLabel>Insert new line before or after hex value?</FormLabel>
            <RadioGroup
              value={rxSettings.config.newLinePlacementOnHexValue}
              onChange={(e) => {
                rxSettings.setNewLinePlacementOnHexValue(parseInt(e.target.value));
              }}
            >
              {/* UPPERCASE */}
              <Tooltip title="Insert new line before the detected hex value. Useful if the hex value indicates the start of a packet." placement="right" arrow>
                <FormControlLabel value={HexCase.UPPERCASE} control={<Radio />} label="Before" />
              </Tooltip>
              {/* LOWERCASE */}
              <Tooltip title="Insert new line after the detected hex value. Useful if the hex value indicates the end of a packet." placement="right" arrow>
                <FormControlLabel value={HexCase.LOWERCASE} control={<Radio />} label="After" />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </BorderedSection>
      </div>
      {/* End of HEX block */}
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
                  checked={rxSettings.config.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping}
                  onChange={(e) => {
                    rxSettings.setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping(e.target.checked);
                  }}
                  data-testid="do-not-add-lf-if-row-was-created-due-to-wrapping"
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
                  checked={rxSettings.config.whenPastingOnWindowsReplaceCRLFWithLF}
                  onChange={(e) => {
                    rxSettings.setWhenPastingOnWindowsReplaceCRLFWithLF(e.target.checked);
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

export default observer(RxSettingsView);
