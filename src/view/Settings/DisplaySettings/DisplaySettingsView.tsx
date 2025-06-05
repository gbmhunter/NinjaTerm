import { FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField, Tooltip, Button, FormLabel, Popover, IconButton } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { App } from 'src/model/App';
import ApplyableTextFieldView from 'src/view/Components/ApplyableTextFieldView';
import BorderedSection from 'src/view/Components/BorderedSection';
import { DataViewConfiguration, TerminalHeightMode, dataViewConfigEnumToDisplayName } from 'src/model/Settings/DisplaySettings/DisplaySettings';
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
    backgroundColor: app.settings.displaySettings.backgroundColor.appliedValue,
    '&:hover': {
      ...baseIconStyle['&:hover'],
      backgroundColor: app.settings.displaySettings.backgroundColor.appliedValue,
    },
  };

  const txColorPickerIconStyle = {
    ...baseIconStyle,
    backgroundColor: app.settings.displaySettings.txColor.appliedValue,
    '&:hover': {
      ...baseIconStyle['&:hover'],
      backgroundColor: app.settings.displaySettings.txColor.appliedValue,
    },
  };

  const rxColorPickerIconStyle = {
    ...baseIconStyle,
    backgroundColor: app.settings.displaySettings.rxColor.appliedValue,
    '&:hover': {
      ...baseIconStyle['&:hover'],
      backgroundColor: app.settings.displaySettings.rxColor.appliedValue,
    },
  };

  return (
    <div style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', maxWidth: '500px' }}>
      {/* =============================================================================== */}
      {/* CHAR SIZE */}
      {/* =============================================================================== */}
      <Tooltip
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
        title="The amount of vertical padding to apply (in pixels) to apply above and below the characters in each row. The char size plus this row padding determines the total row height. Decrease for a denser display of data."
        followCursor
        arrow
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

      {/* =============================================================================== */}
      {/* TERMINAL WIDTH (IN CHARS) */}
      {/* =============================================================================== */}
      <Tooltip
        title="The max. number of characters to display per line in the terminal before wrapping to the next line. Must be a positive integer. New line characters also cause text to jump to the next line."
        followCursor
        arrow
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
        enterDelay={500}
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
        arrow
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
      {/* SCROLLBACK BUFFER SIZE */}
      {/* =============================================================================== */}
      <Tooltip
        title="The max. number of rows to store in any terminal scrollback buffer (TX, RX, TX/RX).
        Increasing this will give you more history but decrease performance and increase memory usage. Must be a positive non-zero integer."
        followCursor
        arrow
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
      <BorderedSection title="Color Settings" childStyle={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <FormLabel style={{ marginTop: '10px' }}>The default colours for the terminal background, TX text, and RX text. If ANSI escape code parsing is enabled, these default colours may be overridden by data.
          <br />
          <br />
          Sending the "reset" ANSI escape code (ESC(39;49m) or the reset all attributes (ESC(0m) will reset the colors to these defaults.
        </FormLabel>
        <div> {/* Wrapper for grid and popovers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'max-content auto', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
            {/* Background Color */}
            <div>Background color</div>
            <IconButton
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                setBgAnchorEl(event.currentTarget);
                setBgColorPickerOpen(true);
              }}
              sx={bgColorPickerIconStyle}
            >
            </IconButton>

            {/* TX Text Color */}
            <div>TX text color</div>
            <IconButton
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                setTxAnchorEl(event.currentTarget);
                setTxColorPickerOpen(true);
              }}
              sx={txColorPickerIconStyle}
            >
            </IconButton>

            {/* RX Text Color */}
            <div>RX text color</div>
            <IconButton
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                setRxAnchorEl(event.currentTarget);
                setRxColorPickerOpen(true);
              }}
              sx={rxColorPickerIconStyle}
            >
            </IconButton>
          </div>

          {/* Popover Color Pickers. These are popovers, not in document flow. */}
          <PopoverColorPicker
            show={bgColorPickerOpen}
            setShow={setBgColorPickerOpen}
            anchorEl={bgAnchorEl}
            setAnchorEl={setBgAnchorEl}
            color={app.settings.displaySettings.backgroundColor.appliedValue}
            setColor={(color) => {
              app.settings.displaySettings.backgroundColor.setDispValue(color);
              app.settings.displaySettings.backgroundColor.apply();
            }}
          />
          <PopoverColorPicker
            show={txColorPickerOpen}
            setShow={setTxColorPickerOpen}
            anchorEl={txAnchorEl}
            setAnchorEl={setTxAnchorEl}
            color={app.settings.displaySettings.txColor.appliedValue}
            setColor={(color) => {
              app.settings.displaySettings.txColor.setDispValue(color);
              app.settings.displaySettings.txColor.apply();
            }}
          />
          <PopoverColorPicker
            show={rxColorPickerOpen}
            setShow={setRxColorPickerOpen}
            anchorEl={rxAnchorEl}
            setAnchorEl={setRxAnchorEl}
            color={app.settings.displaySettings.rxColor.appliedValue}
            setColor={(color) => {
              app.settings.displaySettings.rxColor.setDispValue(color);
              app.settings.displaySettings.rxColor.apply();
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
      </BorderedSection>

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
