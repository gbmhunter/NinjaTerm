import { Button, IconButton, Modal, TextField, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import "react-resizable/css/styles.css";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from '@mui/icons-material/Close';

import { Macro, MacroController } from "src/model/Terminals/RightDrawer/Macros/MacroController";
import { App } from "src/model/App";
import { PortState } from "src/model/Settings/PortConfigurationSettings/PortConfigurationSettings";

interface Props {
  app: App;
  macroController: MacroController;
}

export default observer((props: Props) => {
  const { app, macroController } = props;

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
          value={macroController.macroToDisplayInModal?.data}
          onChange={(e) => macroController.macroToDisplayInModal?.setData(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation(); // Don't want the global keydown event to trigger
          }}
        />
        <div className="button-row" style={{ display: 'flex', justifyContent: 'end', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="contained"
            aria-label="send-macro-data"
            startIcon={<ArrowForwardIcon />}
            disabled={app.portState !== PortState.OPENED}
            onClick={() => {
              macroController.macroToDisplayInModal?.send();
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
