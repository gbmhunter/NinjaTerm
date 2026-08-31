import { Button, Checkbox, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Tooltip } from '@mui/material';
import { observer } from 'mobx-react-lite';

import TxSettings, { BackspaceKeyPressBehavior, DeleteKeyPressBehavior, EnterKeyPressBehavior, TxMode } from 'src/model/Settings/TxSettings/TxSettings';
import BorderedSection from 'src/view/Components/BorderedSection';

interface Props {
  txSettings: TxSettings;
}

function TxSettingsView(props: Props) {
  const { txSettings } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      {/* =============================================================================== */}
      {/* TX MODE */}
      {/* =============================================================================== */}
      <BorderedSection
        title="TX Mode"
        childStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
        style={{ width: '400px' }}
      >
        <FormControl>
          <FormLabel>How typed data is sent:</FormLabel>
          <RadioGroup
            value={txSettings.txMode}
            onChange={(e) => {
              txSettings.setTxMode(e.target.value as any);
            }}
            data-testid="tx-mode-radio-group"
          >
            {/* CHARACTER MODE */}
            <Tooltip title="Send each keystroke the moment it is pressed. This is how a traditional terminal behaves, and is what you want when talking to something with a shell or command-line interface." placement="right" {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}>
              <FormControlLabel value={TxMode.CHARACTER} control={<Radio />} label="Character (send as you type)" data-testid="tx-mode-character" />
            </Tooltip>
            {/* LINE MODE */}
            <Tooltip title="Compose a line in the bar below the terminal and send the whole thing as a single write when you press Enter. Some devices - SCPI instruments over TCP being the common case - only accept a command that arrives in one piece, and will ignore one split across a write per character." placement="right" {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}>
              <FormControlLabel value={TxMode.LINE} control={<Radio />} label="Line (send on Enter, as one write)" data-testid="tx-mode-line" />
            </Tooltip>
          </RadioGroup>
        </FormControl>
        {/* =============================================================================== */}
        {/* OPEN MANUAL (TX mode section) */}
        {/* =============================================================================== */}
        <Tooltip
          title="Open the NinjaTerm manual in your browser, at the section explaining the difference between character and line mode."
          placement="top"
          {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}
        >
          <Button
            variant="outlined"
            color="primary"
            size="small"
            sx={{ textTransform: 'none', alignSelf: 'start', marginTop: '8px' }}
            onClick={async () => {
              try {
                await window.electronAPI.shell.openExternal('https://ninjaterm.mbedded.ninja/manual#sending-data-tx-mode');
              } catch (error) {
                console.error('Failed to open manual:', error);
              }
            }}
          >
            Open Manual
          </Button>
        </Tooltip>
      </BorderedSection>
      {/* =============================================================================== */}
      {/* ENTER PRESSED */}
      {/* =============================================================================== */}
      <BorderedSection
        title="Enter"
        childStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
        style={{ width: '400px' }}
      >
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
            <Tooltip title='Send the line feed (LF, "\n") char (0x0A) when the Enter key is pressed.' placement="right" {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}>
              <FormControlLabel value={EnterKeyPressBehavior.SEND_LF} control={<Radio />} label="Send LF (0x0A)" />
            </Tooltip>
            {/* SEND CR */}
            <Tooltip title='Send the carriage return (CR, "\r") char (0x0D) when the Enter key is pressed.' placement="right" {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}>
              <FormControlLabel value={EnterKeyPressBehavior.SEND_CR} control={<Radio />} label="Send CR (0x0D)" />
            </Tooltip>
            {/* SEND CRLF */}
            <Tooltip title="Send both the carriage return and line feed chars (0x0D 0x0A) when the Enter key is pressed." placement="right" {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}>
              <FormControlLabel value={EnterKeyPressBehavior.SEND_CRLF} control={<Radio />} label="Send CRLF (0x0D 0x0A)" />
            </Tooltip>
            {/* SEND BREAK */}
            <Tooltip title="Send a break signal when the Enter key is pressed." placement="right" {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}>
              <FormControlLabel value={EnterKeyPressBehavior.SEND_BREAK} control={<Radio />} label="Send a break signal" />
            </Tooltip>
          </RadioGroup>
        </FormControl>
      </BorderedSection>
      {/* =============================================================================== */}
      {/* ROW FOR DELETE AND BACKSPACE */}
      {/* =============================================================================== */}
      <div style={{ display: 'flex' }}>
        {/* =============================================================================== */}
        {/* COL1: BACKSPACE */}
        {/* =============================================================================== */}
        <BorderedSection title="Backspace" childStyle={{ display: 'flex', flexDirection: 'column' }}>
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
              <Tooltip title="Send the backspace control char (0x08) when the backspace key is pressed." placement="right" {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}>
                <FormControlLabel value={BackspaceKeyPressBehavior.SEND_BACKSPACE} control={<Radio />} label="Send backspace (0x08)" />
              </Tooltip>
              {/* SEND DELETE (0x7F) */}
              <Tooltip title="Send the delete control char (0x7F) when the delete key is pressed." placement="right" {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}>
                <FormControlLabel value={BackspaceKeyPressBehavior.SEND_DELETE} control={<Radio />} label="Send delete (0x7F)" />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </BorderedSection>
        {/* =============================================================================== */}
        {/* COL2: DELETE */}
        {/* =============================================================================== */}
        <BorderedSection title="Delete" childStyle={{ display: 'flex', flexDirection: 'column' }}>
          <FormControl>
            <FormLabel>When delete is pressed:</FormLabel>
            <RadioGroup
              value={txSettings.deleteKeyPressBehavior}
              onChange={(e) => {
                txSettings.setDeleteKeyPressBehavior(e.target.value as any);
              }}
            >
              {/* SEND BACKSPACE (0x08) */}
              <Tooltip title="Send the backspace control char (0x08) when the delete key is pressed." placement="right" {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}>
                <FormControlLabel value={DeleteKeyPressBehavior.SEND_BACKSPACE} control={<Radio />} label="Send backspace (0x08)" />
              </Tooltip>
              {/* SEND DELETE (0x7F) */}
              <Tooltip title="Send the delete control char (0x7F) when the delete key is pressed." placement="right" {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}>
                <FormControlLabel value={DeleteKeyPressBehavior.SEND_DELETE} control={<Radio />} label="Send delete (0x7F)" />
              </Tooltip>
              {/* SEND CSI_3_TILDE ([ESC] [3~) */}
              <Tooltip
                title="Send the VT sequence [ESC][3~ when the delete key is pressed. This is probably what you want if you are interacting with something that expects a terminal, such as the Zephyr Shell. This is also what PuTTY and the nRF Serial Terminal send by default."
                placement="right"
                {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}
              >
                <FormControlLabel value={DeleteKeyPressBehavior.SEND_VT_SEQUENCE} control={<Radio />} label="Send VT sequence ( ESC [ 3 ~ )" />
              </Tooltip>
            </RadioGroup>
          </FormControl>
        </BorderedSection>
      </div>{' '}
      {/* End of row for TX */}
      {/* =============================================================================== */}
      {/* META KEYS */}
      {/* =============================================================================== */}
      <BorderedSection title="Meta Keys" childStyle={{ display: 'flex', flexDirection: 'column' }}>
        {/* =============================================================================== */}
        {/* CTRL KEYS */}
        {/* =============================================================================== */}
        <Tooltip title="Send ASCII control characters 0x01 through 0x1A when Ctrl+A through Ctrl+Z key combinations are pressed. This enables standard terminal control sequences." placement="top" followCursor {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}>
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
            sx={{ marginBottom: '10px' }}
          />
        </Tooltip>
        {/* =============================================================================== */}
        {/* ALT KEYS */}
        {/* =============================================================================== */}
        <Tooltip
          title="This emulates terminal Meta key behavior. Some key presses like Alt-F (move cursor forward by 1 word) and Alt-B (move cursor backwards by 1 word) are supported by Zephyr and other shells. Unfortunately a few key combos get caught by the browser and not passed to NinjaTerm so we can't catch them. This includes Alt-F."
          placement="top"
          followCursor
          {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}
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
            sx={{ marginBottom: '10px' }}
          />
        </Tooltip>
        {/* =============================================================================== */}
        {/* SMART CTRL-C/V */}
        {/* =============================================================================== */}
        <Tooltip
          title="When enabled (default): Ctrl+C copies selected text to clipboard; if nothing is selected, Ctrl+C sends 0x03 as normal (requires 'Send 0x01-0x1A when Ctrl+A thru Ctrl+Z is pressed' to also be enabled). Ctrl+V always pastes clipboard text to the serial port. This matches the behavior of Windows Terminal and iTerm2. When disabled: Ctrl+C/V always send control codes (0x03/0x16); use Ctrl+Shift+C/V for copy/paste."
          placement="top"
          followCursor
          {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={txSettings.useCtrlCVForCopyPaste}
                onChange={(e) => {
                  txSettings.setUseCtrlCVForCopyPaste(e.target.checked);
                }}
              />
            }
            label="Use Ctrl+C/V for copy/paste (Ctrl+C copies if text selected, Ctrl+V always pastes, will override sending 0x01-0x1A)"
            sx={{ marginBottom: '10px' }}
          />
        </Tooltip>
        {/* =============================================================================== */}
        {/* CTRL+F → FIND */}
        {/* =============================================================================== */}
        <Tooltip
          title="When enabled (default): Ctrl+F opens the Find bar over the focused terminal pane. When disabled: Ctrl+F passes through to the Ctrl+A-Z handler, sending the ACK control byte (0x06) to the connected device — useful if your target firmware listens for it. The on-screen Find magnifier buttons next to each terminal still open Find regardless of this setting."
          placement="top"
          followCursor
          {...txSettings.profileManager.app.settings.displaySettings.getBasicTooltipConfig()}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={txSettings.useCtrlFForFind}
                onChange={(e) => {
                  txSettings.setUseCtrlFForFind(e.target.checked);
                }}
              />
            }
            label="Use Ctrl+F to open Find in scrollback (will override sending 0x01-0x1A)"
            sx={{ marginBottom: '10px' }}
          />
        </Tooltip>
      </BorderedSection>
    </div>
  );
}

export default observer(TxSettingsView);
