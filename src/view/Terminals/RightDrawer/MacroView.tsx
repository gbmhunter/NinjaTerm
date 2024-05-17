import { IconButton, TextField, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import "react-resizable/css/styles.css";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { Macro } from "src/model/Terminals/RightDrawer/Macros/Macros";
import { App } from "src/model/App";
import { PortState } from "src/model/Settings/PortConfigurationSettings/PortConfigurationSettings";

interface Props {
  app: App;
  macro: Macro;
}

export default observer((props: Props) => {
  const { app, macro } = props;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span>{macro.name}</span>
      {/* ================================================ */}
      {/* MACRO DATA */}
      {/* ================================================ */}
      <Tooltip title="The data to send for this macro." enterDelay={500} arrow>
        <TextField
          size="small"
          variant="outlined"
          inputProps={{
            style: {
              padding: 5,
            },
          }}
          value={macro.data}
          onChange={(e) => macro.setData(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
          }} // Don't want the global keydown event to trigger
        />
      </Tooltip>
      {/* ================================================ */}
      {/* MACRO SEND BUTTON */}
      {/* ================================================ */}
      <Tooltip title="Send the data to the serial port." enterDelay={500} arrow>
        <IconButton
          aria-label="send-macro-data"
          size="small"
          style={{ padding: "1px" }}
          disabled={app.portState !== PortState.OPENED}
          onClick={() => {
            macro.send();
          }}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Tooltip>
      {/* MACRO MORE SETTINGS BUTTON */}
      {/* ================================================ */}
      <Tooltip title="More settings for this macro." enterDelay={500} arrow>
        <IconButton aria-label="more-settings-for-macro" size="small" style={{ padding: "1px" }}>
          <MoreHorizIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
});
