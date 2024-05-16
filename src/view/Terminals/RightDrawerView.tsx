import {
  Box,
  Button,
  ButtonPropsColorOverrides,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import { OverridableStringUnion } from "@mui/types";
import KofiButton from "kofi-button";
import { observer } from "mobx-react-lite";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import SendIcon from "@mui/icons-material/Send";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

import { App, PortType } from "src/model/App";
import { PortState } from "src/model/Settings/PortConfigurationSettings/PortConfigurationSettings";
import SingleTerminalView from "./SingleTerminal/SingleTerminalView";
import { DataViewConfiguration, dataViewConfigEnumToDisplayName } from "src/model/Settings/DisplaySettings/DisplaySettings";
import ApplyableTextFieldView from "src/view/Components/ApplyableTextFieldView";
import { portStateToButtonProps } from "src/view/Components/PortStateToButtonProps";

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;

  return (
    <ResizableBox
      className="box"
      width={200}
      resizeHandles={["w"]}
      axis="x"
      style={{ padding: "0px 0px 0px 10px", margin: "0px 0px 10px 0px", fontSize: "12px" }}
      handle={
        <div
          style={{
            height: "100%",
            width: "5px",
            backgroundColor: "#DC3545",
            position: "absolute",
            left: 0,
            top: 0,
            cursor: "ew-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        ></div>
      }
    >
      <div>Macros</div>

      {/* ================================================ */}
      {/* MACRO ROW */}
      {/* ================================================ */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <span>M1</span>
        {/* ================================================ */}
        {/* MACRO DATA */}
        {/* ================================================ */}
        <Tooltip
          title='The data to send for this macro.'
          followCursor
          arrow
        >
          <TextField
            size="small"
            variant="outlined"
            inputProps={{
              style: {
                padding: 5,
              },
            }}
          ></TextField>
        </Tooltip>
        {/* ================================================ */}
        {/* MACRO SEND BUTTON */}
        {/* ================================================ */}
        <IconButton aria-label="delete" size="small" style={{ padding: '1px' }}>
          <ArrowForwardIcon />
        </IconButton>
        {/* ================================================ */}
        {/* MACRO MORE OPTIONS BUTTON */}
        {/* ================================================ */}
        <IconButton aria-label="delete" size="small" style={{ padding: '1px' }}>
          <MoreHorizIcon />
        </IconButton>
      </div>
    </ResizableBox>
  );
});
