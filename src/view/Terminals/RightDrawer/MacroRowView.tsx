import { IconButton, TextField, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import "react-resizable/css/styles.css";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { MacroController } from "src/model/Terminals/RightDrawer/Macros/MacroController";
import { App } from "src/model/App";
import { PortState } from "src/model/Settings/PortConfigurationSettings/PortConfigurationSettings";
import MacroSettingsModalView from "./MacroSettingsModalView";
import { Macro } from "src/model/Terminals/RightDrawer/Macros/Macro";

interface Props {
  app: App;
  macroController: MacroController;
  macro: Macro;
}

export default observer((props: Props) => {
  const { app, macroController, macro } = props;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ paddingRight: '5px' }}>{macro.name}</span>
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
          error={macro.errorMsg !== ""}
          fullWidth // Take up available width (so it changes size as the drawer is resized)
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
        <span>
          {/* This is a hack to get the tooltip to work when the button is disabled */}
          <IconButton
            aria-label="send-macro-data"
            size="small"
            style={{ padding: "1px" }}
            disabled={app.portState !== PortState.OPENED || !macro.canSend}
            onClick={() => {
              macroController.send(macro);
            }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </span>
      </Tooltip>
      {/* ================================================ */}
      {/* MACRO MORE SETTINGS BUTTON */}
      {/* ================================================ */}
      <Tooltip title="More settings for this macro." enterDelay={500} arrow>
        <IconButton
          aria-label="more-settings-for-macro"
          size="small"
          style={{ padding: "1px" }}
          onClick={() => {
            macroController.setMacroToDisplayInModal(macro);
            macroController.setIsModalOpen(true);
          }}
        >
          <MoreHorizIcon />
        </IconButton>
      </Tooltip>
      {/* It shouldn't be a performance problem to create a modal component per macro row, as per
      https://mui.com/material-ui/react-modal/ the modal content is unmounted when closed. If it does become
      a problem, we could instead just have one modal and it's populated with the contents of whatever macro
      settings button is clicked */}
      {/* <MacroSettingsModalView app={app} macro={macro} /> */}
    </div>
  );
});
