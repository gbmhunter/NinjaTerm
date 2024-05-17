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
import SingleTerminalView from "../SingleTerminal/SingleTerminalView";
import { DataViewConfiguration, dataViewConfigEnumToDisplayName } from "src/model/Settings/DisplaySettings/DisplaySettings";
import ApplyableTextFieldView from "src/view/Components/ApplyableTextFieldView";
import { portStateToButtonProps } from "src/view/Components/PortStateToButtonProps";
import { Macro } from "src/model/Terminals/RightDrawer/Macros/Macros";

interface Props {
  macro: Macro;
}

export default observer((props: Props) => {
  const { macro } = props;

  return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <span>{macro.name}</span>
        {/* ================================================ */}
        {/* MACRO DATA */}
        {/* ================================================ */}
        <Tooltip
          title='The data to send for this macro.'
          enterDelay={500}
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
        <Tooltip
          title='Send the data to the serial port.'
          enterDelay={500}
          arrow
        >
        <IconButton aria-label="delete" size="small" style={{ padding: '1px' }}>
          <ArrowForwardIcon />
        </IconButton>
        </Tooltip>
        {/* MACRO MORE SETTINGS BUTTON */}
        {/* ================================================ */}
        <Tooltip
          title='More settings for this macro.'
          enterDelay={500}
          arrow
        >
        <IconButton aria-label="delete" size="small" style={{ padding: '1px' }}>
          <MoreHorizIcon />
        </IconButton>
        </Tooltip>
      </div>
  );
});
