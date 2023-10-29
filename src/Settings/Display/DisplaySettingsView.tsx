import { InputAdornment, TextField, Tooltip } from '@mui/material';
import { App } from 'src/App';

interface Props {
  app: App;
}

export default function DataProcessingView(props: Props) {
  const { app } = props;

  return (
    <div style={{ paddingTop: '20px' }}>
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
          value={app.settings.displaySettings.charSizePx.dispValue}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            app.settings.displaySettings.setCharSizePxDisp(event.target.value);
          }}
          onBlur={() => {
            app.settings.displaySettings.applyCharSizePx();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              app.settings.displaySettings.applyCharSizePx();
            }
          }}
          error={app.settings.displaySettings.charSizePx.hasError}
          helperText={app.settings.displaySettings.charSizePx.errorMsg}
          sx={{ marginBottom: "20px" }}
        />
      </Tooltip>
    </div>
  );
}
