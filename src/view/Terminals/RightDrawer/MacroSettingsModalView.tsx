import { Button, FormControl, FormControlLabel, FormLabel, IconButton, Modal, Radio, RadioGroup, TextField, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import "react-resizable/css/styles.css";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from '@mui/icons-material/Close';

import { MacroController } from "src/model/Terminals/RightDrawer/Macros/MacroController";
import { App } from "src/model/App";
import { PortState } from "src/model/Settings/PortConfigurationSettings/PortConfigurationSettings";
import { MacroDataType } from "src/model/Terminals/RightDrawer/Macros/Macro";

interface Props {
  app: App;
  macroController: MacroController;
}

export default observer((props: Props) => {
  const { app, macroController } = props;

  const macro = macroController.macroToDisplayInModal!;
  if (!macro) {
    return null;
  }

  return (
    <Modal
      open={macroController.isModalOpen}
      onClose={() => {
        macroController.setIsModalOpen(false);
      }}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div style={{ padding: "20px", backgroundColor: "#202020", width: "80%", maxHeight: "80%", display: "flex", flexDirection: "column", gap: "20px" }}>
        <span>Macro Settings</span>
        {/* ================================================================= */}
        {/* TREAT DATA AS */}
        {/* ================================================================= */}
        <FormControl>
          <FormLabel>Treat data as:</FormLabel>
          <RadioGroup
            value={macro.dataType}
            onChange={(e) => {
              macro.setDataType(e.target.value as any);
            }}
          >
            {/* ASCII */}
            <Tooltip title="Treat the data as ASCII." placement="right" arrow>
              <FormControlLabel value={MacroDataType.ASCII} control={<Radio />} label="ASCII" />
            </Tooltip>
            {/* HEX */}
            <Tooltip title="Treat the data as HEX." placement="right" arrow>
              <FormControlLabel value={MacroDataType.HEX} control={<Radio />} label="HEX" />
            </Tooltip>
          </RadioGroup>
        </FormControl>
        {/* ================================================================= */}
        {/* MACRO DATA */}
        {/* ================================================================= */}
        <Tooltip title={<div>
          If ASCII, all printable characters are allowed. New lines (e.g. if you press Enter in the text field) will be sent as LF, CR or CRLF depending on what is selected in the TX Settings.<br/><br/>
          If HEX, only the characters 0-9 and A-F, spaces and new lines are allowed. Spaces and new lines will be ignored. There must be an even number of characters as to make up a complete number of bytes (e.g. 08 A2 FF).
        </div>} enterDelay={500} arrow>
        <TextField
          variant="outlined"
          label="Macro Data"
          inputProps={{
            style: {
              padding: 5,
            },
          }}
          multiline={true}
          minRows={10}
          value={macro.data}
          helperText={macro.errorMsg}
          error={macro.errorMsg !== ""}
          onChange={(e) => macro.setData(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation(); // Don't want the global keydown event to trigger
          }}
        />
        </Tooltip>
        <div className="button-row" style={{ display: 'flex', justifyContent: 'end', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="contained"
            aria-label="send-macro-data"
            startIcon={<ArrowForwardIcon />}
            disabled={app.portState !== PortState.OPENED || !macro.canSend}
            onClick={() => {
              macroController.send(macro);
            }}
          >
            Send
          </Button>
          <Button
            variant="outlined"
            aria-label="send-macro-data"
            startIcon={<CloseIcon />}
            onClick={() => {
              macroController.setIsModalOpen(false);
            }}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
});
