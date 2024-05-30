import { Checkbox, FormControl, FormControlLabel, FormLabel, InputAdornment, Radio, RadioGroup, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";

import TxSettings, { BackspaceKeyPressBehavior, DeleteKeyPressBehavior, EnterKeyPressBehavior } from "src/model/Settings/TxSettings/TxSettings";
import BorderedSection from "src/view/Components/BorderedSection";

interface Props {
  txSettings: TxSettings;
}

function TxSettingsView(props: Props) {
  const { txSettings } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      {/* =============================================================================== */}
      {/* ENTER PRESSED */}
      {/* =============================================================================== */}
      <BorderedSection title="Enter" childStyle={{ display: "flex", flexDirection: "column" }} style={{ width: "400px" }}>
        {/* BACKSPACE */}
        <FormControl>
          <FormLabel>When enter is pressed:</FormLabel>
          <RadioGroup
            value={txSettings.enterKeyPressBehavior}
            onChange={(e) => {
              txSettings.setEnterKeyPressBehavior(e.target.value as any);
            }}
          >
            {/* SEND LF */}
            <Tooltip title='Send the line feed (LF, "\n") char (0x0A) when the Enter key is pressed.' placement="right" arrow>
              <FormControlLabel value={EnterKeyPressBehavior.SEND_LF} control={<Radio />} label="Send LF (0x0A)" />
            </Tooltip>
            {/* SEND CR */}
            <Tooltip title='Send the carriage return (CR, "\r") char (0x0D) when the Enter key is pressed.' placement="right" arrow>
              <FormControlLabel value={EnterKeyPressBehavior.SEND_CR} control={<Radio />} label="Send CR (0x0D)" />
            </Tooltip>
            {/* SEND CRLF */}
            <Tooltip title="Send both the carriage return and line feed chars (0x0D 0x0A) when the Enter key is pressed." placement="right" arrow>
              <FormControlLabel value={EnterKeyPressBehavior.SEND_CRLF} control={<Radio />} label="Send CRLF (0x0D 0x0A)" />
            </Tooltip>
          </RadioGroup>
        </FormControl>
      </BorderedSection>
      {/* =============================================================================== */}
      {/* ROW FOR DELETE AND BACKSPACE */}
      {/* =============================================================================== */}
      <div style={{ display: "flex" }}>
        {/* =============================================================================== */}
        {/* COL1: BACKSPACE */}
        {/* =============================================================================== */}
        <BorderedSection title="Backspace" childStyle={{ display: "flex", flexDirection: "column" }}>
          {/* BACKSPACE */}
          <FormControl>
            <FormLabel>When backspace is pressed:</FormLabel>
            <RadioGroup
              value={txSettings.backspaceKeyPressBehavior}
              onChange={(e) => {
                txSettings.setBackspaceKeyPressBehavior(e.target.value as any);
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
        {/* COL2: DELETE */}
        {/* =============================================================================== */}
        <BorderedSection title="Delete" childStyle={{ display: "flex", flexDirection: "column" }}>
          <FormControl>
            <FormLabel>When delete is pressed:</FormLabel>
            <RadioGroup
              value={txSettings.deleteKeyPressBehavior}
              onChange={(e) => {
                txSettings.setDeleteKeyPressBehavior(e.target.value as any);
              }}
            >
              {/* SEND BACKSPACE (0x08) */}
              <Tooltip title="Send the backspace control char (0x08) when the delete key is pressed." placement="right" arrow>
                <FormControlLabel value={DeleteKeyPressBehavior.SEND_BACKSPACE} control={<Radio />} label="Send backspace (0x08)" />
              </Tooltip>
              {/* SEND DELETE (0x7F) */}
              <Tooltip title="Send the delete control char (0x7F) when the delete key is pressed." placement="right" arrow>
                <FormControlLabel value={DeleteKeyPressBehavior.SEND_DELETE} control={<Radio />} label="Send delete (0x7F)" />
              </Tooltip>
              {/* SEND CSI_3_TILDE ([ESC] [3~) */}
              <Tooltip
                title="Send the VT sequence [ESC][3~ when the delete key is pressed. This is probably what you want if you are interacting with something that expects a terminal, such as the Zephyr Shell. This is also what PuTTY and the nRF Serial Terminal send by default."
                placement="right"
                arrow
              >
                <FormControlLabel value={DeleteKeyPressBehavior.SEND_VT_SEQUENCE} control={<Radio />} label="Send VT sequence ( ESC [ 3 ~ )" />
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
                checked={txSettings.send0x01Thru0x1AWhenCtrlAThruZPressed}
                onChange={(e) => {
                  txSettings.setSend0x01Thru0x1AWhenCtrlAThruZPressed(e.target.checked);
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
                checked={txSettings.sendEscCharWhenAltKeyPressed}
                onChange={(e) => {
                  txSettings.setSendEscCharWhenAltKeyPressed(e.target.checked);
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
