import { FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField, Tooltip, Button, FormLabel, IconButton, Checkbox, FormControlLabel } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { App } from 'src/model/App';
import ApplyableTextFieldView from 'src/view/Components/ApplyableTextFieldView';
import { DataViewConfiguration, TerminalFont, TerminalHeightMode, dataViewConfigEnumToDisplayName, terminalFontEnumToDisplayName } from 'src/model/Settings/DisplaySettings/DisplaySettings';
import PopoverColorPicker from 'src/view/Components/PopoverColorPicker';

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;

  // State for the color picker popovers. Not relevant enough to put in the app model so
  // stays in the view.
  const [bgColorPickerOpen, setBgColorPickerOpen] = useState(false);
  const [bgAnchorEl, setBgAnchorEl] = useState<HTMLElement | null>(null);
  const [txColorPickerOpen, setTxColorPickerOpen] = useState(false);
  const [txAnchorEl, setTxAnchorEl] = useState<HTMLElement | null>(null);
  const [rxColorPickerOpen, setRxColorPickerOpen] = useState(false);
  const [rxAnchorEl, setRxAnchorEl] = useState<HTMLElement | null>(null);

  const baseIconStyle = {
    marginLeft: '10px',
    width: `20px`, // Adjust size as needed
    height: `20px`,
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: 0, // Remove default IconButton padding
    '&:hover': {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)', // MUI-like hover shadow
      transform: 'scale(1.05)',
    },
  };

  const bgColorPickerIconStyle = {
    ...baseIconStyle,
    backgroundColor: app.settings.displaySettings.defaultBackgroundColor.appliedValue,
    '&:hover': {
      ...baseIconStyle['&:hover'],
      backgroundColor: app.settings.displaySettings.defaultBackgroundColor.appliedValue,
    },
  };

  const txColorPickerIconStyle = {
    ...baseIconStyle,
    backgroundColor: app.settings.displaySettings.defaultTxTextColor.appliedValue,
    '&:hover': {
      ...baseIconStyle['&:hover'],
      backgroundColor: app.settings.displaySettings.defaultTxTextColor.appliedValue,
    },
  };

  const rxColorPickerIconStyle = {
    ...baseIconStyle,
    backgroundColor: app.settings.displaySettings.defaultRxTextColor.appliedValue,
    '&:hover': {
      ...baseIconStyle['&:hover'],
      backgroundColor: app.settings.displaySettings.defaultRxTextColor.appliedValue,
    },
  };

  return (
    <div style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', maxWidth: '500px' }}>
      {/* =============================================================================== */}
      {/* CHAR SIZE */}
      {/* =============================================================================== */}
      <Tooltip
        {...app.settings.displaySettings.getBasicTooltipConfig()}
        title="The font size (in pixels) of characters displayed in the terminal."
        followCursor
        arrow
      >
        <ApplyableTextFieldView
          id="outlined-basic"
          name="charSizePx"
          label="Char Size"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: <InputAdornment position="start">px</InputAdornment>,
          }}
          applyableTextField={app.settings.displaySettings.charSizePx}
          sx={{ marginBottom: "20px" }}
        />
      </Tooltip>

      {/* =============================================================================== */}
      {/* VERTICAL ROW PADDING */}
      {/* =============================================================================== */}
      <Tooltip
        title="The amount of vertical padding to apply (in pixels) to apply above and below the characters in each row. The char size plus this row padding determines the total row height. Decrease for a denser display of data. Set this to 0 when using a DOS font, otherwise the gap between rows breaks up the vertical strokes of box-drawing characters."
        followCursor
        {...app.settings.displaySettings.getBasicTooltipConfig()}
      >
        <ApplyableTextFieldView
          id="outlined-basic"
          label="Vertical Row Padding"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: <InputAdornment position="start">px</InputAdornment>,
          }}
          applyableTextField={app.settings.displaySettings.verticalRowPaddingPx}
          sx={{ marginBottom: "20px" }}
        />
      </Tooltip>

      {/* ============================================================== */}
      {/* TERMINAL FONT */}
      {/* ============================================================== */}
      <Tooltip
        title='The font used to display data in the terminal. The bundled NinjaTerm font covers ASCII only; pick "IBM VGA (DOS/CP437)" for the box-drawing characters that text-mode applications draw frames and borders with, or "Custom..." to name any monospace font installed on your computer. Characters missing from the selected font fall back to a system monospace font, so the character grid always lines up.'
        placement="right"
        {...app.settings.displaySettings.getBasicTooltipConfig()}
      >
        <FormControl sx={{ minWidth: 160, marginBottom: '20px' }} size="small">
          <InputLabel>Terminal Font</InputLabel>
          <Select
            name="terminalFont"
            data-testid="terminal-font-select"
            value={app.settings.displaySettings.terminalFont}
            onChange={(e) => {
              app.settings.displaySettings.setTerminalFont(e.target.value as TerminalFont);
            }}
          >
            {Object.values(TerminalFont).map((terminalFont) => {
              return (
                <MenuItem key={terminalFont} value={terminalFont}>
                  {terminalFontEnumToDisplayName[terminalFont]}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Tooltip>

      {/* =============================================================================== */}
      {/* CUSTOM TERMINAL FONT NAME */}
      {/* =============================================================================== */}
      {app.settings.displaySettings.terminalFont === TerminalFont.CUSTOM && (
        <Tooltip
          title='The font family name to use, exactly as the font is named on your system (e.g. "Perfect DOS VGA 437"). The font has to already be installed on this computer. If it cannot be found, the terminal falls back to the default font.'
          followCursor
          {...app.settings.displaySettings.getBasicTooltipConfig()}
        >
          <ApplyableTextFieldView
            id="outlined-basic"
            name="terminalFontCustomName"
            label="Custom Font Family"
            variant="outlined"
            size="small"
            applyableTextField={app.settings.displaySettings.terminalFontCustomName}
            sx={{ marginBottom: '20px' }}
          />
        </Tooltip>
      )}

      {/* =============================================================================== */}
      {/* TERMINAL WIDTH (IN CHARS) */}
      {/* =============================================================================== */}
      <Tooltip
        title="The max. number of characters to display per line in the terminal before wrapping to the next line. Must be a positive integer. New line characters also cause text to jump to the next line."
        followCursor
        {...app.settings.displaySettings.getBasicTooltipConfig()}
      >
        <ApplyableTextFieldView
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
          applyableTextField={app.settings.displaySettings.terminalWidthChars}
          sx={{ marginBottom: "20px" }}
        />
      </Tooltip>

      {/* ============================================================== */}
      {/* TERMINAL HEIGHT MODE */}
      {/* ============================================================== */}
      <Tooltip
        title="Determines how the terminal height is set (excluding scrollback). When set to auto, the terminal height will be automatically set to the max. number of whole rows that can fit in the terminal height (and it will change as the window height changes). When set to fixed, the terminal height will be set to the number of rows specified in the terminal height field below. Sometimes fixed is needed for compatibility with certain terminal applications. This setting has implications for ASCII escape codes just as Erase in Display."
        placement="right"
        {...app.settings.displaySettings.getBasicTooltipConfig()}
      >
        <FormControl
          sx={{ minWidth: 160, marginBottom: '20px' }}
          size="small"
        >
          <InputLabel>Terminal Height Mode</InputLabel>
          <Select
            value={app.settings.displaySettings.terminalHeightMode}
            onChange={(e) => {
              app.settings.displaySettings.setTerminalHeightMode(e.target.value as TerminalHeightMode);
            }}
          >
            {Object.values(TerminalHeightMode).map((terminalHeightMode) => {
              return (
                <MenuItem key={terminalHeightMode} value={terminalHeightMode}>
                  {terminalHeightMode}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Tooltip>

      {/* =============================================================================== */}
      {/* TERMINAL HEIGHT (IN CHARS/ROWS) */}
      {/* =============================================================================== */}
      <Tooltip
        title="Sets the terminal height (in terms of number of chars a.k.a. rows) when the terminal height mode is set to fixed. Must be a positive integer between 1 and 100."
        followCursor
        {...app.settings.displaySettings.getBasicTooltipConfig()}
      >
        <ApplyableTextFieldView
          id="outlined-basic"
          label="Terminal Height"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">chars</InputAdornment>
            ),
            disabled: app.settings.displaySettings.terminalHeightMode === TerminalHeightMode.AUTO_HEIGHT,
          }}
          applyableTextField={app.settings.displaySettings.terminalHeightChars}
          sx={{ marginBottom: '20px' }}
        />
      </Tooltip>

      {/* =============================================================================== */}
      {/* TAB STOP WIDTH */}
      {/* =============================================================================== */}
      <Tooltip
        title="The number of spaces for each tab stop. When a tab character is received, the cursor will move to the next tab stop. Must be an integer between 1 and 16. A line will not wrap due to receiving tab characters, the cursor will stay at the end of the line."
        followCursor
        {...app.settings.displaySettings.getBasicTooltipConfig()}
      >
        <ApplyableTextFieldView
          id="outlined-basic"
          name="tabStopWidth"
          label="Tab Stop Width"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">spaces</InputAdornment>
            ),
          }}
          applyableTextField={app.settings.displaySettings.tabStopWidth}
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
        {...app.settings.displaySettings.getBasicTooltipConfig()}
      >
        <ApplyableTextFieldView
          name="scrollbackBufferSizeRows"
          label="Scrollback Buffer Size"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">rows</InputAdornment>
            ),
          }}
          applyableTextField={app.settings.displaySettings.scrollbackBufferSizeRows}
          sx={{ marginBottom: "20px" }}
        />
      </Tooltip>

      {/* =============================================================================== */}
      {/* AUTO SCROLL LOCK ON TX */}
      {/* =============================================================================== */}
      <Tooltip
        title="Automatically jump to the bottom of the terminal and scroll lock when you type TX data into a terminal."
        placement="right"
        {...app.settings.displaySettings.getBasicTooltipConfig()}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={app.settings.displaySettings.autoScrollLockOnTx}
              onChange={(e) => {
                app.settings.displaySettings.setAutoScrollLockOnTx(e.target.checked);
              }}
            />
          }
          label="Auto Scroll Lock on TX"
          sx={{
            marginBottom: '20px',
            width: 'fit-content', // Fit content is needed so that the checkbox does not take up the entire width of the parent
          }}
        />
      </Tooltip>

      <FormLabel sx={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '10px', marginTop: '20px', display: 'block' }}>
        Tooltips
      </FormLabel>

      {/* =============================================================================== */}
      {/* ENABLE TOOLTIPS */}
      {/* =============================================================================== */}
      <Tooltip
        title="Enable or disable tooltips globally throughout the application. Disabling them might be useful if you know what you are doing and you find they are just getting in the way."
        placement="right"
        {...app.settings.displaySettings.getBasicTooltipConfig()}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={app.settings.displaySettings.tooltipsEnabled}
              onChange={(e) => {
                app.settings.displaySettings.setTooltipsEnabled(e.target.checked);
              }}
            />
          }
          label="Enable Tooltips"
          sx={{
            marginBottom: '20px',
            width: 'fit-content', // Fit content is needed so that the checkbox does not take up the entire width of the parent
          }}
        />
      </Tooltip>

      {/* =============================================================================== */}
      {/* TOOLTIP DELAY */}
      {/* =============================================================================== */}
      <Tooltip
        title="The delay time (in milliseconds) before tooltips are shown when hovering over elements. Must be between 0 and 5000ms. You can increase this if you find the tooltips are appearing too soon and getting in the way. Another option is to disable tooltips entirely."
        placement="right"
        {...app.settings.displaySettings.getBasicTooltipConfig()}
      >
        <ApplyableTextFieldView
          id="outlined-basic"
          name="tooltipDelayMs"
          label="Tooltip Delay"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: <InputAdornment position="start">ms</InputAdornment>,
            disabled: !app.settings.displaySettings.tooltipsEnabled,
          }}
          applyableTextField={app.settings.displaySettings.tooltipDelayMs}
          sx={{ marginBottom: "20px" }}
        />
      </Tooltip>

      {/* =============================================================================== */}
      {/* DATA VIEW CONFIGURATION */}
      {/* =============================================================================== */}
      <FormLabel sx={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '10px', marginTop: '20px', display: 'block' }}>Data View Configuration</FormLabel>
      <Tooltip
        title="Control whether a combined TX/RX terminal or two separate terminals are displayed."
        placement="top"
        followCursor
        {...app.settings.displaySettings.getBasicTooltipConfig()}
      >
        <FormControl size="small" sx={{ minWidth: "210px" }}>
          <InputLabel>Data View Configuration</InputLabel>
          <Select
            name="dataViewConfiguration"
            value={app.settings.displaySettings.dataViewConfiguration}
            onChange={(e) => {
              app.settings.displaySettings.setDataViewConfiguration(parseInt(e.target.value as string));
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
      {/* COLOR SETTINGS */}
      {/* =============================================================================== */}
      <FormLabel sx={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '10px', marginTop: '20px', display: 'block' }}>Color Settings</FormLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <FormLabel style={{ marginTop: '10px' }}>The default colours for the terminal background, TX text, and RX text. If ANSI escape code parsing is enabled, these default colours may be overridden by data.
          <br />
          Click on the coloured square to change the colour.
        </FormLabel>
        {/* BACKGROUND COLOR */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Background Color"
            value={app.settings.displaySettings.defaultBackgroundColor.dispValue}
            onChange={(e) => app.settings.displaySettings.defaultBackgroundColor.setDispValue(e.target.value)}
            onBlur={() => app.settings.displaySettings.defaultBackgroundColor.apply()}
            error={!app.settings.displaySettings.defaultBackgroundColor.isValid}
            helperText={!app.settings.displaySettings.defaultBackgroundColor.isValid ? app.settings.displaySettings.defaultBackgroundColor.errorMsg : ''}
            size="small"
            InputProps={{
              endAdornment: (
                <IconButton
                  size="small"
                  style={bgColorPickerIconStyle}
                  onClick={(event) => {
                    setBgAnchorEl(event.currentTarget);
                    setBgColorPickerOpen(true);
                  }}
                  data-testid="bg-color-picker-button"
                />
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <PopoverColorPicker
            show={bgColorPickerOpen}
            setShow={setBgColorPickerOpen}
            anchorEl={bgAnchorEl}
            setAnchorEl={setBgAnchorEl}
            initialColor={app.settings.displaySettings.defaultBackgroundColor.appliedValue}
            onApply={(newColor) => {
              app.settings.displaySettings.defaultBackgroundColor.setDispValue(newColor);
              app.settings.displaySettings.defaultBackgroundColor.apply();
              setBgColorPickerOpen(false);
            }}
            onCancel={() => {
              setBgColorPickerOpen(false);
            }}
          />
        </div>

        {/* TX TEXT COLOR */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label="TX Text Color"
            value={app.settings.displaySettings.defaultTxTextColor.dispValue}
            onChange={(e) => app.settings.displaySettings.defaultTxTextColor.setDispValue(e.target.value)}
            onBlur={() => app.settings.displaySettings.defaultTxTextColor.apply()}
            error={!app.settings.displaySettings.defaultTxTextColor.isValid}
            helperText={!app.settings.displaySettings.defaultTxTextColor.isValid ? app.settings.displaySettings.defaultTxTextColor.errorMsg : ''}
            size="small"
            InputProps={{
              endAdornment: (
                <IconButton
                  size="small"
                  style={txColorPickerIconStyle}
                  onClick={(event) => {
                    setTxAnchorEl(event.currentTarget);
                    setTxColorPickerOpen(true);
                  }}
                />
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <PopoverColorPicker
            show={txColorPickerOpen}
            setShow={setTxColorPickerOpen}
            anchorEl={txAnchorEl}
            setAnchorEl={setTxAnchorEl}
            initialColor={app.settings.displaySettings.defaultTxTextColor.appliedValue}
            onApply={(newColor) => {
              app.settings.displaySettings.defaultTxTextColor.setDispValue(newColor);
              app.settings.displaySettings.defaultTxTextColor.apply();
              setTxColorPickerOpen(false);
            }}
            onCancel={() => {
              setTxColorPickerOpen(false);
            }}
          />
        </div>

        {/* RX TEXT COLOR */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label="RX Text Color"
            value={app.settings.displaySettings.defaultRxTextColor.dispValue}
            onChange={(e) => app.settings.displaySettings.defaultRxTextColor.setDispValue(e.target.value)}
            onBlur={() => app.settings.displaySettings.defaultRxTextColor.apply()}
            error={!app.settings.displaySettings.defaultRxTextColor.isValid}
            helperText={!app.settings.displaySettings.defaultRxTextColor.isValid ? app.settings.displaySettings.defaultRxTextColor.errorMsg : ''}
            size="small"
            InputProps={{
              endAdornment: (
                <IconButton
                  size="small"
                  style={rxColorPickerIconStyle}
                  onClick={(event) => {
                    setRxAnchorEl(event.currentTarget);
                    setRxColorPickerOpen(true);
                  }}
                />
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <PopoverColorPicker
            show={rxColorPickerOpen}
            setShow={setRxColorPickerOpen}
            anchorEl={rxAnchorEl}
            setAnchorEl={setRxAnchorEl}
            initialColor={app.settings.displaySettings.defaultRxTextColor.appliedValue}
            onApply={(newColor) => {
              app.settings.displaySettings.defaultRxTextColor.setDispValue(newColor);
              app.settings.displaySettings.defaultRxTextColor.apply();
              setRxColorPickerOpen(false);
            }}
            onCancel={() => {
              setRxColorPickerOpen(false);
            }}
          />
        </div>

        <Button
          variant="contained"
          onClick={() => app.settings.displaySettings.setRxColorEqualToTx()}
          sx={{ alignSelf: 'flex-start' }}
        >
          Set RX color equal to TX
        </Button>
      </div>

      {/* <Popover
        open={bgColorPickerOpen}
        anchorEl={anchorEl}
        onClose={() => {
          setBgColorPickerOpen(false);
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Sketch
            color={sketchPickerColor}
            onChange={(color) => {
              setSketchPickerColor(color.hex);
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button
              size="small"
              onClick={() => {
                setBgColorPickerOpen(false);
                setAnchorEl(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                // app.settings.displaySettings.backgroundColor.setValue(sketchPickerColor);
                setBgColorPickerOpen(false);
                setAnchorEl(null);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </Popover> */}
    </div>
  );
});
