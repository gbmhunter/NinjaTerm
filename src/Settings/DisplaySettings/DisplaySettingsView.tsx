import { FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField, Tooltip } from '@mui/material';
import { observer } from 'mobx-react-lite';

import { App } from 'src/App';
import ApplyableTextFieldView from 'src/Components/ApplyableTextFieldView';
import { DataViewConfiguration, dataViewConfigEnumToDisplayName } from 'src/Settings/DisplaySettings/DisplaySettings';

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;

  return (
    <div style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', maxWidth: '300px' }}>
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
        {/* <TextField
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
          value={app.settings.displaySettings.terminalWidthChars.dispValue}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            app.settings.displaySettings.setTerminalWidthCharsDisp(event.target.value);
          }}
          error={app.settings.displaySettings.terminalWidthChars.hasError}
          helperText={app.settings.displaySettings.terminalWidthChars.errorMsg}
          sx={{ marginBottom: "20px" }}
        /> */}
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
    </div>
  );
});
