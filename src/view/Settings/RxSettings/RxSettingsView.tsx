import { Checkbox, FormControl, FormControlLabel, FormLabel, InputAdornment, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Tooltip } from '@mui/material';
import { observer } from 'mobx-react-lite';

import RxSettings, {
  CarriageReturnCursorBehavior,
  DataType,
  Endianness,
  FloatStringConversionMethod,
  HexCase,
  NewLineCursorBehavior,
  NewLinePlacementOnHexValue,
  NonVisibleCharDisplayBehaviors,
  NumberType,
  PaddingCharacter,
  TimestampFormat,
} from 'src/model/Settings/RxSettings/RxSettings';
import BorderedSection from 'src/view/Components/BorderedSection';
import ApplyableTextFieldView from 'src/view/Components/ApplyableTextFieldView';

interface Props {
  rxSettings: RxSettings;
}

function RxSettingsView(props: Props) {
  const { rxSettings } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      {/* =============================================================================== */}
      {/* DATA TYPE */}
      {/* =============================================================================== */}
      <div style={{ display: 'flex' }}>
        <BorderedSection title="Data Type" childStyle={{ display: 'flex', flexDirection: 'column', width: '500px' }}>
          <FormControl>
            <FormLabel>How to interpret RX data:</FormLabel>
            <RadioGroup
              value={rxSettings.dataType}
              onChange={(e) => {
                rxSettings.setDataType(parseInt(e.target.value));
              }}
            >
              {/* ASCII */}
              <Tooltip title="Interpret RX data as ASCII characters." placement="right" arrow enterDelay={500}>
                <FormControlLabel value={DataType.ASCII} control={<Radio />} label="ASCII" />
              </Tooltip>
              {/* NUMBER */}
              <Tooltip title="Interpret RX data as a type of number." placement="right" arrow enterDelay={500}>
                <FormControlLabel value={DataType.NUMBER} control={<Radio data-testid="data-type-number-radio-button" />} label="Number (e.g. hex, uint8, int16, ...)" />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </BorderedSection>
      </div>
      {/* =============================================================================== */}
      {/* ASCII SETTINGS (only shown if data type is ASCII) */}
      {/* =============================================================================== */}
      <div className="ascii-block" style={{ display: rxSettings.dataType === DataType.ASCII ? 'block' : 'none' }}>
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
              enterDelay={500}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name="ansiEscapeCodeParsingEnabled"
                    checked={rxSettings.ansiEscapeCodeParsingEnabled}
                    onChange={(e) => {
                      rxSettings.setAnsiEscapeCodeParsingEnabled(e.target.checked);
                    }}
                    disabled={rxSettings.dataType !== 1}
                  />
                }
                label="Enable ANSI Escape Code Parsing"
                sx={{ marginBottom: '15px' }}
              />
            </Tooltip>
            {/* =============================================================================== */}
            {/* MAX. ESCAPE CODE LENGTH */}
            {/* =============================================================================== */}
            <Tooltip
              title="The max. length of escape code allowed (in characters). Certain malformed escape codes (or data interruptions) could cause the escape code parser to get stuck thinking the incoming data stream is part of an escape code. This limit is so that at a certain length the parser rejects the partial code and goes back to the IDLE state. This includes all characters in the escape code, including the starting \x1B byte. Must be a least 2 chars."
              followCursor
              arrow
              enterDelay={500}
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
                applyableTextField={rxSettings.maxEscapeCodeLengthChars}
                sx={{ marginBottom: '15px' }}
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
              enterDelay={500}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name="localTxEcho"
                    checked={rxSettings.localTxEcho}
                    onChange={(e) => {
                      rxSettings.setLocalTxEcho(e.target.checked);
                    }}
                  />
                }
                label="Local TX Echo"
                sx={{ marginBottom: '15px' }}
              />
            </Tooltip>
          </BorderedSection>
        </div>{' '}
        {/* End of row for ANSI escape codes and echo settings */}
        {/* Row with new line and carriage return settings */}
        <div style={{ display: 'flex' }}>
          {/* =============================================================================== */}
          {/* NEW LINE SETTINGS */}
          {/* =============================================================================== */}
          <BorderedSection title="New Lines">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '300px',
                gap: '20px',
              }}
            >
              {/* NEW LINE BEHAVIOR */}
              <FormControl>
                <FormLabel>When a \n byte is received:</FormLabel>
                <RadioGroup
                  value={rxSettings.newLineCursorBehavior}
                  onChange={(e) => {
                    rxSettings.setNewLineCursorBehavior(e.target.value as any);
                  }}
                >
                  {/* DO NOTHING */}
                  <Tooltip title="Don't move the cursor at all when a new line character is received." placement="right" arrow enterDelay={500}>
                    <FormControlLabel value={NewLineCursorBehavior.DO_NOTHING} control={<Radio />} label="Don't move the cursor" data-testid="new-line-dont-move-cursor" />
                  </Tooltip>
                  {/* MOVE DOWN ONE LINE */}
                  <Tooltip
                    title="Move the cursor directly down one line. A separate carriage return is required if you want to move the cursor to the start of the new line."
                    placement="right"
                    arrow
                    enterDelay={500}
                  >
                    <FormControlLabel value={NewLineCursorBehavior.NEW_LINE} control={<Radio />} label="Move cursor down one line (new line)" />
                  </Tooltip>
                  {/* NEW LINE AND CARRIAGE RETURN */}
                  <Tooltip
                    title="Move the cursor back to the start of the line and then down one line. This is the most common behavior for receiving a new line character."
                    placement="right"
                    arrow
                    enterDelay={500}
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
                enterDelay={500}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      name="swallowNewLine"
                      checked={rxSettings.swallowNewLine}
                      onChange={(e) => {
                        rxSettings.setSwallowNewLine(e.target.checked);
                      }}
                    />
                  }
                  label="Swallow \n bytes"
                  sx={{ marginBottom: '15px' }}
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
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '300px',
                gap: '20px',
              }}
            >
              {/* CARRIAGE RETURN CURSOR BEHAVIOR */}
              <FormControl>
                <FormLabel>When a \r byte is received:</FormLabel>
                <RadioGroup
                  value={rxSettings.carriageReturnCursorBehavior}
                  onChange={(e) => {
                    rxSettings.setCarriageReturnBehavior(e.target.value as any);
                  }}
                >
                  {/* DO NOTHING */}
                  <Tooltip title="Don't move the cursor at all when a carriage return character is received." placement="right" arrow enterDelay={500}>
                    <FormControlLabel value={CarriageReturnCursorBehavior.DO_NOTHING} control={<Radio />} label="Don't move the cursor" />
                  </Tooltip>
                  {/* MOVE CURSOR TO START OF LINE */}
                  <Tooltip
                    title="Move the cursor to the start of the current line. A separate new line character is required if you want to move the cursor down one line."
                    placement="right"
                    arrow
                    enterDelay={500}
                  >
                    <FormControlLabel value={CarriageReturnCursorBehavior.CARRIAGE_RETURN} control={<Radio />} label="Move cursor to the start of the current line" />
                  </Tooltip>
                  {/* CARRIAGE RETURN AND NEW LINE */}
                  <Tooltip title="Move the cursor back to the start of the line and then down one line." placement="right" arrow enterDelay={500}>
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
                enterDelay={500}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      name="swallowCarriageReturn"
                      checked={rxSettings.swallowCarriageReturn}
                      onChange={(e) => {
                        rxSettings.setSwallowCarriageReturn(e.target.checked);
                      }}
                    />
                  }
                  label="Swallow \r bytes"
                  sx={{ marginBottom: '15px' }}
                />
              </Tooltip>
            </div>
          </BorderedSection>
        </div>{' '}
        {/* End of row with new line and carriage return settings */}
        {/* =============================================================================== */}
        {/* NON-VISIBLE CHAR DISPLAY */}
        {/* =============================================================================== */}
        <BorderedSection title="Non-visible Character Display">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '600px',
              gap: '20px',
            }}
          >
            {/* RADIO GROUP */}
            <FormControl>
              <FormLabel>For all received bytes in the range 0x00-0xFF that are not visible ASCII characters AND that are not swallowed above:</FormLabel>
              <RadioGroup
                value={rxSettings.nonVisibleCharDisplayBehavior}
                onChange={(e) => {
                  rxSettings.setNonVisibleCharDisplayBehavior(e.target.value as any);
                }}
              >
                {/* SWALLOW */}
                <Tooltip title="Do not display bytes that are not visible ASCII characters." placement="right" arrow enterDelay={500}>
                  <FormControlLabel value={NonVisibleCharDisplayBehaviors.SWALLOW} control={<Radio />} label="Swallow" />
                </Tooltip>
                {/* ASCII CONTROL CODES GLYPHS AND HEX GLYPHS */}
                <Tooltip
                  title="Convert bytes that are control chars into control char glyphs, and all other bytes that are not valid ASCII characters ([0x80-0xFF]) into hex code glyphs."
                  placement="right"
                  arrow
                  enterDelay={500}
                >
                  <FormControlLabel
                    value={NonVisibleCharDisplayBehaviors.ASCII_CONTROL_GLYPHS_AND_HEX_GLYPHS}
                    control={<Radio />}
                    label="Convert ASCII control codes to control code glyphs, and all others to hex code glyphs"
                  />
                </Tooltip>
                {/* ALL TO HEX CODE GLYPHS */}
                <Tooltip title="Convert all non-visible ASCII characters into hex code glyphs." placement="right" arrow enterDelay={500}>
                  <FormControlLabel value={NonVisibleCharDisplayBehaviors.HEX_GLYPHS} control={<Radio />} label="Convert all to hex code glyphs" />
                </Tooltip>
              </RadioGroup>
            </FormControl>
          </div>
        </BorderedSection>
      </div>{' '}
      {/* End of ASCII block */}
      {/* =============================================================================== */}
      {/* NUMBER SETTINGS (only shown if data type is NUMBER) */}
      {/* =============================================================================== */}
      <div className="number-block" style={{ display: rxSettings.dataType === DataType.NUMBER ? 'block' : 'none' }}>
        <div className="columns" style={{ display: 'flex' }}>
          <BorderedSection title="Number Settings" childStyle={{ display: 'flex', flexDirection: 'column' }}>
            {/* ================================================ */}
            {/* NUMBER TYPE */}
            {/* ================================================ */}
            <Tooltip
              title="The type of number of interpret data as. Some types require only one byte, others are multi-byte which will buffer data and require the endianness to be set correctly."
              followCursor
              arrow
              enterDelay={500}
            >
              <FormControl sx={{ minWidth: 160, marginBottom: '15px' }} size="small">
                <InputLabel id="demo-select-small-label">Number Type</InputLabel>
                <Select
                  value={rxSettings.numberType}
                  label="Baud Rate"
                  onChange={(e) => {
                    rxSettings.setNumberType(e.target.value as NumberType);
                  }}
                  data-testid="number-type-select"
                >
                  {Object.values(NumberType).map((numberType) => {
                    return (
                      <MenuItem key={numberType} value={numberType}>
                        {numberType}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Tooltip>
            {/* ================================================ */}
            {/* ENDIANNESS */}
            {/* ================================================ */}
            <Tooltip
              title="The order in which multi-byte numbers are sent on the serial port. Little endian is when the LSB is sent first, big endian is when the MSB is sent first. Most MCUs use little endian for their memory layout, so if you are sending the lowest memory address first of a multi-byte type, you are probably using little endian."
              followCursor
              arrow
              enterDelay={500}
            >
              <FormControl sx={{ minWidth: 160, marginBottom: '15px' }} size="small">
                <InputLabel>Endianness</InputLabel>
                <Select
                  value={rxSettings.endianness}
                  label="Endianness"
                  onChange={(e) => {
                    rxSettings.setEndianness(e.target.value as Endianness);
                  }}
                  data-testid="endianness-select"
                >
                  {Object.values(Endianness).map((endianness) => {
                    return (
                      <MenuItem key={endianness} value={endianness}>
                        {endianness}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Tooltip>
            {/* ================================================ */}
            {/* SEPARATOR BETWEEN VALUES */}
            {/* ================================================ */}
            <Tooltip
              title='This string is append to every displayed numerical value. For example, use " " to separate values with a space, or "," to create CSV-like data. You can also use an empty string to have no separator at all.'
              followCursor
              arrow
              enterDelay={500}
            >
              <ApplyableTextFieldView
                id="outlined-basic"
                name="hexSeparator"
                label="Separator Between Values"
                variant="outlined"
                size="small"
                applyableTextField={rxSettings.numberSeparator}
                sx={{ marginBottom: '10px' }}
              />
            </Tooltip>
            {/* ================================================ */}
            {/* PREVENT VALUES FROM WRAPPING ACROSS ROWS */}
            {/* ================================================ */}
            <Tooltip
              title="If enabled, numerical values will not be broken into two to wrap to the next row if the terminal reaches the last column. A new row will be created when a whole value cannot fit onto the existing row. This has no effect if a hex value cannot fit into a single row even when starting from the first column (e.g. small column count)."
              placement="right"
              followCursor
              arrow
              enterDelay={500}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rxSettings.preventValuesWrappingAcrossRows}
                    onChange={(e) => {
                      rxSettings.setPreventHexValuesWrappingAcrossRows(e.target.checked);
                    }}
                  />
                }
                label="Prevent values from wrapping across rows."
                sx={{ marginBottom: '0px' }}
              />
            </Tooltip>
            {/* ================================================ */}
            {/* INSERT NEW LINE ON SPECIFIC VALUE */}
            {/* ================================================ */}
            <Tooltip
              title="Check this if you want to insert new lines when specific bytes arrive from the serial port. Handy when you have specific start-of-packet/end-of-packet delimiters and you want to display one packet per row."
              placement="right"
              followCursor
              arrow
              enterDelay={500}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rxSettings.insertNewLineOnMatchedValue}
                    onChange={(e) => {
                      rxSettings.setInsertNewLineOnValue(e.target.checked);
                    }}
                  />
                }
                label="Insert new line on specific value."
                sx={{ marginBottom: '15px' }}
              />
            </Tooltip>
            {/* ================================================ */}
            {/* NEW LINE HEX VALUE */}
            {/* ================================================ */}
            <Tooltip
              title='The hex value to look for in the RX stream. If found, a new line will be inserted either before or after the value (depending on the setting). Must be a valid hex value, e.g. "0A" or "ff". This is always a hex value, no matter what the selected number type is. It is compared against the raw bytes received that make up the number, not the interpreted number value. For example, if you were displaying uint16 and wanted to create a new line on the value 1000, you would enter "3E8". If you were displaying int16 and wanted a new line on -10, you would enter "FFF6".'
              followCursor
              arrow
              enterDelay={500}
            >
              <ApplyableTextFieldView
                label="Value to insert new line on"
                variant="outlined"
                size="small"
                applyableTextField={rxSettings.newLineMatchValueAsHex}
                disabled={!rxSettings.insertNewLineOnMatchedValue}
                sx={{ marginBottom: '15px' }}
              />
            </Tooltip>
            {/* ================================================ */}
            {/* NEWLINE BEFORE OR AFTER VALUE */}
            {/* ================================================ */}
            <FormControl disabled={!rxSettings.insertNewLineOnMatchedValue} sx={{ marginBottom: '15px' }}>
              <FormLabel>Insert new line before or after value?</FormLabel>
              <RadioGroup
                value={rxSettings.newLinePlacementOnHexValue}
                onChange={(e) => {
                  rxSettings.setNewLinePlacementOnValue(parseInt(e.target.value));
                }}
              >
                {/* UPPERCASE */}
                <Tooltip title="Insert new line before the detected value. Useful if the value indicates the start of a packet." placement="right" arrow enterDelay={500}>
                  <FormControlLabel value={NewLinePlacementOnHexValue.BEFORE} control={<Radio />} label="Before" />
                </Tooltip>
                {/* LOWERCASE */}
                <Tooltip title="Insert new line after the detected value. Useful if the value indicates the end of a packet." placement="right" arrow enterDelay={500}>
                  <FormControlLabel value={NewLinePlacementOnHexValue.AFTER} control={<Radio />} label="After" />
                </Tooltip>
              </RadioGroup>
            </FormControl>
          </BorderedSection>
          <BorderedSection title="Padding Settings" childStyle={{ display: 'flex', flexDirection: 'column' }}>
            {/* ================================================ */}
            {/* PAD VALUES */}
            {/* ================================================ */}
            <Tooltip
              title="Enable this to left-pad values to a consistent character width for integer and float types. Zeroes style padding is always applied to hex values."
              placement="right"
              followCursor
              arrow
              enterDelay={500}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rxSettings.padValues}
                    onChange={(e) => {
                      rxSettings.setPadValues(e.target.checked);
                    }}
                    disabled={rxSettings.numberType === NumberType.HEX}
                  />
                }
                label="Pad values"
                sx={{ marginBottom: '15px' }}
              />
            </Tooltip>
            {/* ================================================ */}
            {/* PADDING CHARACTER */}
            {/* ================================================ */}
            <FormControl disabled={!rxSettings.padValues || rxSettings.numberType == NumberType.HEX} sx={{ marginBottom: '15px' }}>
              <FormLabel>Padding character:</FormLabel>
              <RadioGroup
                value={rxSettings.paddingCharacter}
                onChange={(e) => {
                  rxSettings.setPaddingCharacter(parseInt(e.target.value));
                }}
              >
                {/* 0's */}
                <Tooltip title='Pad with 0&apos;s, e.g. "-003".' placement="right" arrow enterDelay={500}>
                  <FormControlLabel value={PaddingCharacter.ZERO} control={<Radio data-testid="pad-zeroes-radio-button" />} label="0's" />
                </Tooltip>
                {/* WHITESPACE */}
                <Tooltip title='Pad with whitespace, e.g. "  -3".' placement="right" arrow enterDelay={500}>
                  <FormControlLabel value={PaddingCharacter.WHITESPACE} control={<Radio data-testid="pad-whitespace-radio-button" />} label="<whitespace>" />
                </Tooltip>
              </RadioGroup>
            </FormControl>
            {/* ================================================ */}
            {/* PADDING WIDTH */}
            {/* ================================================ */}
            <Tooltip
              title="The width to pad numbers out to. Set to -1 if you want to automatically pad the value to the width of the largest possible number of the selected type (e.g. 2 chars for a 1-byte hex value, 3 chars for a uint8, 5 for a uint16). For floats, -1 equals 6 chars."
              followCursor
              arrow
              enterDelay={500}
            >
              <ApplyableTextFieldView
                id="outlined-basic"
                name="numPaddingChars"
                label="Num. of padding chars"
                variant="outlined"
                size="small"
                applyableTextField={rxSettings.numPaddingChars}
                disabled={!rxSettings.padValues || rxSettings.numberType == NumberType.HEX}
                sx={{ marginBottom: '15px' }}
              />
            </Tooltip>
          </BorderedSection>
        </div>
        <div className="hex-and-floating-point-settings" style={{ display: 'flex' }}>
          <BorderedSection title="Hex Specific Settings" childStyle={{ display: 'flex', flexDirection: 'column' }}>
            {/* ================================================ */}
            {/* NUMBER OF BYTES PER HEX NUMBER */}
            {/* ================================================ */}
            <Tooltip
              title="The number of received bytes to convert into a single hex. number. For example, setting this to 1 will result in terminal display like 8E FF 05 33. Setting this to 2 will result in FF8E 3305 (if little endian). Uses the endianness setting above."
              followCursor
              arrow
              enterDelay={500}
            >
              <ApplyableTextFieldView
                name="numBytesPerHexNumber"
                label="Num. of bytes per hex number"
                variant="outlined"
                size="small"
                applyableTextField={rxSettings.numBytesPerHexNumber}
                disabled={rxSettings.numberType !== NumberType.HEX}
                sx={{ marginBottom: '15px' }}
                inputProps={{
                  'data-testid': 'num-bytes-per-hex-number-input',
                }}
              />
            </Tooltip>
            {/* ================================================ */}
            {/* UPPERCASE/LOWERCASE HEX */}
            {/* ================================================ */}
            <FormControl disabled={rxSettings.numberType !== NumberType.HEX} sx={{ marginBottom: '15px' }}>
              <FormLabel>Upper/lowercase hex:</FormLabel>
              <RadioGroup
                value={rxSettings.hexCase}
                onChange={(e) => {
                  rxSettings.setHexCase(parseInt(e.target.value));
                }}
              >
                {/* UPPERCASE */}
                <Tooltip title="Use uppercase A-F when printing hex values." placement="right" arrow enterDelay={500}>
                  <FormControlLabel value={HexCase.UPPERCASE} control={<Radio data-testid="hex-uppercase-radio-button" />} label="Uppercase" />
                </Tooltip>
                {/* LOWERCASE */}
                <Tooltip title="Use lowercase a-f when printing hex values." placement="right" arrow enterDelay={500}>
                  <FormControlLabel value={HexCase.LOWERCASE} control={<Radio data-testid="hex-lowercase-radio-button" />} label="Lowercase" />
                </Tooltip>
              </RadioGroup>
            </FormControl>
            {/* ================================================ */}
            {/* PREFIX HEX VALUES WITH 0x */}
            {/* ================================================ */}
            <Tooltip
              title='If enabled, "0x" will be prefixed to all hex values displayed in the terminal. Normally this just adds more clutter to the data, but might be useful in some cases!'
              placement="right"
              followCursor
              arrow
              enterDelay={500}
            >
              <FormControlLabel
                disabled={rxSettings.numberType !== NumberType.HEX}
                control={
                  <Checkbox
                    checked={rxSettings.prefixHexValuesWith0x}
                    onChange={(e) => {
                      rxSettings.setPrefixHexValuesWith0x(e.target.checked);
                    }}
                  />
                }
                label='Prefix hex values with "0x".'
                sx={{ marginBottom: '15px' }}
              />
            </Tooltip>
          </BorderedSection>
          {/* ============================================================================================ */}
          {/* FLOAT SPECIFIC SETTINGS */}
          {/* ============================================================================================ */}
          <BorderedSection title="Float Specific Settings" childStyle={{ display: 'flex', flexDirection: 'column' }}>
            {/* ================================================ */}
            {/* FLOAT STRING CONVERSION METHOD */}
            {/* ================================================ */}
            <Tooltip
              title="Control how the float gets converted into a string. toString() converts the number to the smallest string representation which uniquely identifies the float. toFixed() creates the string representation with a fixed number of decimal places (settable in the input below)."
              // followCursor
              arrow
              placement="top"
              enterDelay={500}
            >
              <FormControl
                sx={{ minWidth: 160, marginBottom: '15px' }}
                size="small"
                disabled={rxSettings.numberType !== NumberType.FLOAT32 && rxSettings.numberType !== NumberType.FLOAT64}
              >
                <InputLabel>String Conversion Method</InputLabel>
                <Select
                  value={rxSettings.floatStringConversionMethod}
                  label="Float String Conversion Method"
                  onChange={(e) => {
                    rxSettings.setFloatStringConversionMethod(e.target.value as FloatStringConversionMethod);
                  }}
                  data-testid="float-string-conversion-method-select"
                >
                  {Object.values(FloatStringConversionMethod).map((method) => {
                    return (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Tooltip>
            {/* ================================================ */}
            {/* FLOAT NUM. OF DECIMAL PLACES */}
            {/* ================================================ */}
            <Tooltip title="The number of decimal places to round the float to if using toFixed()." followCursor arrow>
              <ApplyableTextFieldView
                name="floatNumOfDecimalPlaces"
                label="Float num. of decimal places"
                variant="outlined"
                size="small"
                applyableTextField={rxSettings.floatNumOfDecimalPlaces}
                disabled={
                  (rxSettings.numberType !== NumberType.FLOAT32 && rxSettings.numberType !== NumberType.FLOAT64) ||
                  rxSettings.floatStringConversionMethod !== FloatStringConversionMethod.TO_FIXED
                }
                sx={{ marginBottom: '15px' }}
              />
            </Tooltip>
          </BorderedSection>
        </div>
      </div>
      {/* End of NUMBER block */}
      {/* =============================================================================== */}
      {/* TIMESTAMP SETTINGS */}
      {/* =============================================================================== */}
      <BorderedSection title="Timestamp Settings" childStyle={{ display: 'flex', flexDirection: 'column' }}>
        <Tooltip title="If enabled, timestamps will be added to the terminal. Timestamps are added to the start of each new line of received data. The time shown is when the first visible character of the line is received (i.e. ASCII control codes don't count). Timestamps are not added if the line was created due to wrapping of the line above it." placement="right" arrow enterDelay={500}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rxSettings.addTimestamps}
                onChange={(e) => {
                  rxSettings.setAddTimestamps(e.target.checked);
                }}
              />
            }
            label="Add timestamps to the data."
          />
        </Tooltip>
        <FormControl sx={{ marginTop: '10px', marginLeft: '30px' }} disabled={!rxSettings.addTimestamps}>
          <FormLabel>Timestamp Format</FormLabel>
          <RadioGroup
            value={rxSettings.timestampFormat}
            onChange={(e) => {
              rxSettings.setTimestampFormat(e.target.value as any); // Assuming TimestampFormat enum exists and is imported
            }}
          >
            <Tooltip title="Display timestamps in the ISO8601 format with millisecond precision and no timezone (e.g. &quot;2025-06-04T12:04:45.832&quot;)." placement="right" arrow enterDelay={500}>
              <FormControlLabel value={TimestampFormat.ISO8601_WITHOUT_TIMEZONE} control={<Radio />} label="ISO8601, no timezone (e.g. &quot;2025-06-04T12:04:45.832&quot;)" />
            </Tooltip>
            <Tooltip title="Display timestamps in the ISO8601 format with millisecond precision and timezone (e.g. &quot;2025-06-04T12:04:45.832+12:00&quot;)." placement="right" arrow enterDelay={500}>
              <FormControlLabel value={TimestampFormat.ISO8601_WITH_TIMEZONE} control={<Radio />} label="ISO8601, with timezone (e.g. &quot;2025-06-04T12:04:45.832+12:00&quot;)" />
            </Tooltip>
            <Tooltip title="Display timestamps in local time (e.g. &quot;2025-06-04 12:04:45.832&quot;)." placement="right" arrow enterDelay={500}>
              <FormControlLabel value={TimestampFormat.LOCAL} control={<Radio />} label="Local Time (e.g. &quot;2025-06-04 12:04:45.832&quot;)" />
            </Tooltip>
            <Tooltip title="Display timestamps as a Unix time with seconds precision (e.g. &quot;1678886400&quot;)." placement="right" arrow enterDelay={500}>
              <FormControlLabel value={TimestampFormat.UNIX_SECONDS} control={<Radio />} label="Unix Time, in seconds (e.g. &quot;1678886400&quot;)" />
            </Tooltip>
            <Tooltip title="Display timestamps as a Unix time with in seconds with millisecond precision (e.g. &quot;1678886400.123&quot;)." placement="right" arrow enterDelay={500}>
              <FormControlLabel value={TimestampFormat.UNIX_SECONDS_AND_MILLISECONDS} control={<Radio />} label="Unix Time, seconds + milliseconds (e.g. &quot;1678886400.123&quot;)" />
            </Tooltip>
            <Tooltip title="Display timestamps using a custom Moment.js format string." placement="right" arrow enterDelay={500}>
              <FormControlLabel value={TimestampFormat.CUSTOM} control={<Radio />} label="Custom Format" />
            </Tooltip>
          </RadioGroup>
        </FormControl>
        <Tooltip
          title="Enter a Moment.js format string. E.g., 'YYYY-MM-DD HH:mm:ss.SSS' for local time, 'X' for Unix timestamp (seconds), 'x' for Unix timestamp (milliseconds)."
          placement="right"
          arrow
          enterDelay={500}
        >
          {/*
            The ApplyableTextFieldView needs to be wrapped in a div for the tooltip to work correctly when the text field is disabled.
            MUI Tooltip doesn't work directly on disabled elements unless they are wrapped.
          */}
          <div style={{
              marginTop: '10px',
              marginLeft: '55px',
              width: '300px',
              // The div itself might not need to be a flex container or have specific display if ApplyableTextFieldView handles its own width.
              // However, ensuring it's a block or inline-block can help with layout.
            }}>
            <ApplyableTextFieldView
              name="customTimestampFormatString"
              label="Custom Timestamp Format"
              variant="outlined"
              size="small"
              applyableTextField={rxSettings.customTimestampFormatString} // Assuming this is an ApplyableStringSetting
              disabled={!rxSettings.addTimestamps || rxSettings.timestampFormat !== TimestampFormat.CUSTOM}
              // sx prop for ApplyableTextFieldView itself, if needed for internal styling or if it doesn't take full width of the div.
              // sx={{ width: '100%' }} // Example: make it take full width of the wrapping div
            />
          </div>
        </Tooltip>
        <FormLabel style={{ marginTop: '10px' }}>The custom string must be a valid <a href="https://momentjscom.readthedocs.io/en/latest/moment/04-displaying/01-format/" target="_blank" rel="noopener noreferrer">Moment.js format string</a>. For example:
          <ul>
            <li>"YYYY-MM-DDTHH:mm:ssZ" for the ISO8601 format (e.g. "2025-06-04T11:18:50+12:00")</li>
            <li>"YYYY-MM-DD HH:mm:ss.SSS" for local time in milliseconds without time zone (e.g. "2025-06-04 11:18:50.833")</li>
            <li>"X" for Unix time in seconds (e.g. "1748992730")</li>
            <li>"x" for Unix time in milliseconds (e.g. "1748992730833")</li>
            <li>"X.SSS" for Unix time in seconds with millisecond precision (e.g. "1748992730.833")</li>
            <li>Any other format string for any other format</li>
          </ul>
        </FormLabel>
      </BorderedSection> {/* END OF TIMESTAMP SETTINGS */}
      {/* =============================================================================== */}
      {/* OTHER RX SETTINGS */}
      {/* =============================================================================== */}
      <BorderedSection title="Other RX Settings" childStyle={{ display: 'flex', flexDirection: 'column' }}>
        {/* ================================================ */}
        {/* SHOW A WARNING WHEN BREAK SIGNALS ARE RECEIVED */}
        {/* ================================================ */}
        <Tooltip
          title='If enabled, a warning "snackbar" will be shown when a break signal is received. It it recommended to enable this if you do not usually expect break signals. It is recommended to disable this if break signals are expected (e.g. to frame raw data).'
          placement="right"
          arrow
          enterDelay={500}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={rxSettings.showWarningOnRxBreakSignal}
                onChange={(e) => {
                  rxSettings.setShowWarningOnRxBreakSignal(e.target.checked);
                }}
              />
            }
            label='Show a warning when break signals are received.'
            sx={{ marginBottom: '15px' }}
          />
        </Tooltip>
      </BorderedSection>
    </div>
  );
}

export default observer(RxSettingsView);
