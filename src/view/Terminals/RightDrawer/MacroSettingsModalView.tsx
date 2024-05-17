import { IconButton, Modal, TextField, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import "react-resizable/css/styles.css";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { Macro, MacroController } from "src/model/Terminals/RightDrawer/Macros/MacroController";
import { App } from "src/model/App";

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
      <div style={{ padding: "20px", backgroundColor: "#202020", width: "80%", height: "80%", display: "flex", flexDirection: "column", gap: "20px" }}>
        <span>Macro Settings</span>
        <TextField
          size="small"
          variant="outlined"
          label="Data"
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
            e.stopPropagation();
          }} // Don't want the global keydown event to trigger
        />
        <IconButton
          aria-label="send-macro-data"
          size="small"
          style={{ padding: "1px" }}
          onClick={() => {
            macroController.macroToDisplayInModal?.send();
          }}
        >
          <ArrowForwardIcon />
        </IconButton>
      </div>
    </Modal>
  );
});
