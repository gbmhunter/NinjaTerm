import { Button, Checkbox, FormControl, FormControlLabel, FormLabel, InputLabel, MenuItem, Modal, Radio, RadioGroup, Select, TextField, Tooltip } from '@mui/material';
import { observer } from 'mobx-react-lite';
import 'react-resizable/css/styles.css';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';

import { MacroController } from 'src/model/Terminals/RightDrawer/Macros/MacroController';
import { App } from 'src/model/App';
import { PortState } from 'src/model/Settings/PortSettings/PortSettings';
import { MacroDataType } from 'src/model/Terminals/RightDrawer/Macros/Macro';
import { EnterKeyPressBehavior } from 'src/model/Settings/TxSettings/TxSettings';
import BorderedSection from 'src/view/Components/BorderedSection';

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
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          padding: '20px',
          backgroundColor: '#202020',
          width: '80%',
          maxHeight: '80%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        <span>Macro Settings</span>
        <div className="row" style={{ display: 'flex', alignItems: 'start', gap: '30px' }}>
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
              <Tooltip title="Treat the data as ASCII." placement="right" arrow enterDelay={500}>
                <FormControlLabel value={MacroDataType.ASCII} control={<Radio data-testid={'macro-data-type-ascii-rb'} />} label="ASCII" />
              </Tooltip>
              {/* HEX */}
              <Tooltip title="Treat the data as HEX." placement="right" arrow enterDelay={500}>
                <FormControlLabel value={MacroDataType.HEX} control={<Radio data-testid={'macro-data-type-hex-rb'} />} label="HEX" />
              </Tooltip>
            </RadioGroup>
          </FormControl>

          {/* This div contains the ASCII and HEX settings containers */}
          <div
            className="column"
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}
          >
            <BorderedSection
              title="ASCII Settings"
              childStyle={{
                display: 'flex',
                flexDirection: 'column',
                padding: '5px',
                // gap: '10px',
              }}
            >
              {/* ================================================================= */}
              {/* PROCESS ESCAPE CHARS */}
              {/* ================================================================= */}
              <Tooltip
                title='If enabled, and the data type is ASCII, the text will be processed for escape characters (by calling JSON.parse()). This means you can use things like "\n" to insert a LF character (0x0A) and "\r" to insert a CR character (0x0D).'
                arrow
                enterDelay={500}
              >
                <FormControlLabel
                  disabled={macro.dataType !== MacroDataType.ASCII}
                  control={
                    <Checkbox
                      checked={macro.processEscapeChars}
                      onChange={(e) => {
                        macro.setProcessEscapeChars(e.target.checked);
                      }}
                      data-testid="macro-process-escape-chars-cb"
                    />
                  }
                  label="Process escape chars (\r, \n, \t, e.t.c.)"
                />
              </Tooltip>
              {/* ================================================================= */}
              {/* SEND ON ENTER VALUE FOR EVERY LINE IN TEXT BOX */}
              {/* ================================================================= */}
              <Tooltip
                title={
                  <div>
                    If enabled, the "On Enter" sequence will be appended to every line in the macro data. This is useful if you want each line of ASCII macro data to behave to same
                    in this text box as it would if typed in the terminal.
                    <br />
                    <br />
                    You can also change the "On Enter" sequence below.
                  </div>
                }
                arrow
                enterDelay={500}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={macro.sendOnEnterValueForEveryNewLineInTextBox}
                      onChange={(e) => {
                        macro.setSendOnEnterValueForEveryNewLineInTextBox(e.target.checked);
                      }}
                    />
                  }
                  label='Send "On Enter" sequence at the end of every line'
                  disabled={macro.dataType !== MacroDataType.ASCII}
                />
              </Tooltip>
              {/* ================================================================= */}
              {/* ENTER KEY PRESS BEHAVIOR */}
              {/* ================================================================= */}
              <Tooltip
                title={
                  <div>
                    What to send at the end of every line in the macro data text box, if the above checkbox is ticked.
                    <br />
                    <br />
                    This is the same setting as in the TX Settings view.
                  </div>
                }
                arrow
                placement="right"
                enterDelay={500}
              >
                <FormControl sx={{ m: 1, minWidth: 160 }} size="small" disabled={macro.dataType !== MacroDataType.ASCII || !macro.sendOnEnterValueForEveryNewLineInTextBox}>
                  <InputLabel>On Enter Value</InputLabel>
                  <Select
                    value={app.settings.txSettings.enterKeyPressBehavior}
                    onChange={(e) => {
                      app.settings.txSettings.setEnterKeyPressBehavior(e.target.value as EnterKeyPressBehavior);
                    }}
                  >
                    {Object.values(EnterKeyPressBehavior).map((item) => {
                      return (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Tooltip>
            </BorderedSection>
            <BorderedSection
              title="Hex Settings"
              childStyle={{
                display: 'flex',
                flexDirection: 'column',
                padding: '5px',
                // gap: '10px',
              }}
            >
              {/* ================================================================= */}
              {/* SEND BREAK AT END OF EVERY LINE OF HEX */}
              {/* ================================================================= */}
              <Tooltip
                title="If ticked, a break signal will be sent at the end of every line of hex in the macro data. This can be useful if the device you are talking to uses the break signal to frame raw data."
                arrow
                enterDelay={500}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={macro.sendBreakAtEndOfEveryLineOfHex}
                      onChange={(e) => {
                        macro.setSendBreakAtEndOfEveryLineOfHex(e.target.checked);
                      }}
                    />
                  }
                  label="Send the break signal at the end of every line of hex."
                  disabled={macro.dataType !== MacroDataType.HEX}
                  style={{ width: '250px' }}
                />
              </Tooltip>
            </BorderedSection>
          </div>
        </div>
        {/* ================================================================= */}
        {/* MACRO DATA */}
        {/* ================================================================= */}
        <Tooltip
          title={
            <div>
              If ASCII, all printable characters are allowed. If the "Send On Enter sequence at the end of every line" checkbox is ticked, there will be additional bytes sent at the end of every line.
              <br />
              <br />
              If HEX, only the characters 0-9 and A-F, spaces and new lines are allowed. There must be an even number of characters as to make up a complete number of bytes (e.g. 08 A2 FF). If the "Send break at end of every line of hex" checkbox is ticked, each line has to contain an even number of characters rather than just the whole textbox.
            </div>
          }
          enterDelay={500}
          arrow
        >
          <TextField
            variant="outlined"
            label="Macro Data"
            inputProps={{
              style: {
                padding: 5,
              },
            }}
            multiline={true}
            minRows={5}
            value={macro.data}
            helperText={macro.errorMsg}
            error={macro.errorMsg !== ''}
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
            onClick={async () => {
              await macroController.send(macro);
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
            data-testid="macro-settings-modal-close-button"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
});
