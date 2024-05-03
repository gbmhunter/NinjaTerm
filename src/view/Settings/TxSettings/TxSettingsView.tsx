import { Checkbox, FormControl, FormControlLabel, FormLabel, InputAdornment, Radio, RadioGroup, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";

import TxSettings from "src/model/Settings/TxSettings/TxSettings";
import RxSettings, {
  BackspaceKeyPressBehavior,
  CarriageReturnCursorBehaviors,
  DataTypes,
  DeleteKeyPressBehaviors,
  NewLineCursorBehaviors,
  NonVisibleCharDisplayBehaviors,
} from "src/model/Settings/RxSettings/RxSettings";
import BorderedSection from "src/view/Components/BorderedSection";
import ApplyableTextFieldView from "src/view/Components/ApplyableTextFieldView";
import { number } from "zod";

interface Props {
  txSettings: TxSettings;
}

function TxSettingsView(props: Props) {
  const { txSettings: dataProcessingSettings } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      {/* =============================================================================== */}
      {/* ROW FOR TX */}
      {/* =============================================================================== */}
      <div style={{ display: "flex" }}>
        {/* =============================================================================== */}
        {/* BACKSPACE */}
        {/* =============================================================================== */}
        <BorderedSection title="Backspace" childStyle={{ display: "flex", flexDirection: "column" }}>
          {/* BACKSPACE */}
          <FormControl>
            <FormLabel>When backspace is pressed:</FormLabel>
            <RadioGroup
              value={dataProcessingSettings.backspaceKeyPressBehavior}
              onChange={(e) => {
                dataProcessingSettings.setBackspaceKeyPressBehavior(e.target.value as any);
              }}
            >
              {/* SEND BACKSPACE (0x08) */}
              <Tooltip title="Send the backspace control char (0x08) when the backspace key is pressed." placement="right" arrow>
                <FormControlLabel value={BackspaceKeyPressBehavior.SEND_BACKSPACE} control={<Radio />} label="Send backspace (0x08)" />
              </Tooltip>
              {/* SEND DELETE (0x7F) */}
              <Tooltip title="Send the delete control char (0x7F) when the delete key is pressed." placement="right" arrow>
                <FormControlLabel value={BackspaceKeyPressBehavior.SEND_DELETE} control={<Radio />} label="Send delete (0x7F)" />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </BorderedSection>
        {/* =============================================================================== */}
        {/* DELETE */}
        {/* =============================================================================== */}
        <BorderedSection title="Delete" childStyle={{ display: "flex", flexDirection: "column" }}>
          <FormControl>
            <FormLabel>When delete is pressed:</FormLabel>
            <RadioGroup
              value={dataProcessingSettings.deleteKeyPressBehavior}
              onChange={(e) => {
                dataProcessingSettings.setDeleteKeyPressBehavior(e.target.value as any);
              }}
            >
              {/* SEND BACKSPACE (0x08) */}
              <Tooltip title="Send the backspace control char (0x08) when the delete key is pressed." placement="right" arrow>
                <FormControlLabel value={DeleteKeyPressBehaviors.SEND_BACKSPACE} control={<Radio />} label="Send backspace (0x08)" />
              </Tooltip>
              {/* SEND DELETE (0x7F) */}
              <Tooltip title="Send the delete control char (0x7F) when the delete key is pressed." placement="right" arrow>
                <FormControlLabel value={DeleteKeyPressBehaviors.SEND_DELETE} control={<Radio />} label="Send delete (0x7F)" />
              </Tooltip>
              {/* SEND CSI_3_TILDE ([ESC] [3~) */}
              <Tooltip
                title="Send the VT sequence [ESC][3~ when the delete key is pressed. This is probably what you want if you are interacting with something that expects a terminal, such as the Zephyr Shell. This is also what PuTTY and the nRF Serial Terminal send by default."
                placement="right"
                arrow
              >
                <FormControlLabel value={DeleteKeyPressBehaviors.SEND_VT_SEQUENCE} control={<Radio />} label="Send VT sequence ( ESC [ 3 ~ )" />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </BorderedSection>
      </div>{" "}
      {/* End of row for TX */}
      {/* =============================================================================== */}
      {/* META KEYS */}
      {/* =============================================================================== */}
      <BorderedSection title="Meta Keys" childStyle={{ display: "flex", flexDirection: "column" }}>
        {/* =============================================================================== */}
        {/* CTRL KEYS */}
        {/* =============================================================================== */}
        <Tooltip title="" placement="top" followCursor arrow>
          <FormControlLabel
            control={
              <Checkbox
                checked={dataProcessingSettings.send0x01Thru0x1AWhenCtrlAThruZPressed}
                onChange={(e) => {
                  dataProcessingSettings.setSend0x01Thru0x1AWhenCtrlAThruZPressed(e.target.checked);
                }}
              />
            }
            label="Send 0x01-0x1A when Ctrl+A thru Ctrl+Z is pressed"
            sx={{ marginBottom: "10px" }}
          />
        </Tooltip>
        {/* =============================================================================== */}
        {/* ALT KEYS */}
        {/* =============================================================================== */}
        <Tooltip
          title="This emulates terminal Meta key behavior. Some key presses like Alt-F (move cursor forward by 1 word) and Alt-B (move cursor backwards by 1 word) are supported by Zephyr and other shells. Unfortunately a few key combos get caught by the browser and not passed to NinjaTerm so we can't catch them. This includes Alt-F."
          placement="top"
          followCursor
          arrow
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={dataProcessingSettings.sendEscCharWhenAltKeyPressed}
                onChange={(e) => {
                  dataProcessingSettings.setSendEscCharWhenAltKeyPressed(e.target.checked);
                }}
              />
            }
            label="Send [ESC] + <char> when Alt-<char> is pressed (e.g. Alt-A sends 0x1B 0x41)."
            sx={{ marginBottom: "10px" }}
          />
        </Tooltip>
      </BorderedSection>
    </div>
  );
}

export default observer(TxSettingsView);
