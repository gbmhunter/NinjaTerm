import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { App } from 'src/model/App';
import RulesSettings from 'src/model/Settings/RulesSettings/RulesSettings';
import { HighlightRuleSound } from 'src/model/AppDataManager/DataClasses/HighlightRuleData';
import PopoverColorPicker from 'src/view/Components/PopoverColorPicker';

interface Props {
  app: App;
  rulesSettings: RulesSettings;
}

/**
 * Add/edit modal for a single highlight rule. Opened via
 * `rulesSettings.setIsModalOpen(true)` after pointing
 * `rulesSettings.ruleToDisplayInModal` at the rule to edit. Mirrors the
 * Macros modal pattern: a single mutable model object, every field's
 * setter persists via `RulesSettings._saveConfig` so there's no
 * "apply / cancel" — changes are live and the modal just closes.
 */
export default observer((props: Props) => {
  const { app, rulesSettings } = props;
  const rule = rulesSettings.ruleToDisplayInModal;

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null);

  if (!rule) return null;

  // Touching `compiledRegex` populates `errorMsg`. Read it via the observer
  // chain so the helper text below updates in real time.
  const _ = rule.compiledRegex; // eslint-disable-line @typescript-eslint/no-unused-vars
  const regexError = rule.errorMsg;

  return (
    <Modal
      open={rulesSettings.isModalOpen}
      onClose={() => rulesSettings.setIsModalOpen(false)}
      aria-labelledby="rule-modal-title"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          padding: '20px',
          backgroundColor: '#202020',
          width: '600px',
          maxHeight: '80%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        <span id="rule-modal-title" style={{ fontSize: '18px' }}>Edit highlight rule</span>

        {/* NAME */}
        <TextField
          label="Name"
          variant="outlined"
          size="small"
          value={rule.name}
          onChange={(e) => rule.setName(e.target.value)}
          inputProps={{ 'data-testid': 'rule-name-input' }}
        />

        {/* PATTERN */}
        <Tooltip
          {...app.settings.displaySettings.getBasicTooltipConfig()}
          title="JavaScript regex source. Matches are evaluated per finalised row (i.e. once the newline arrives). Catastrophic regexes — e.g. nested quantifiers — can hang the renderer; you supply the pattern, so write it sensibly."
          placement="top"
        >
          <TextField
            label="Pattern (regex)"
            variant="outlined"
            size="small"
            value={rule.pattern}
            onChange={(e) => rule.setPattern(e.target.value)}
            error={regexError !== ''}
            helperText={regexError !== '' ? regexError : ' '}
            inputProps={{ 'data-testid': 'rule-pattern-input' }}
          />
        </Tooltip>

        {/* CASE SENSITIVE */}
        <FormControlLabel
          control={
            <Checkbox
              checked={rule.caseSensitive}
              onChange={(e) => rule.setCaseSensitive(e.target.checked)}
              data-testid="rule-case-sensitive"
            />
          }
          label="Case sensitive"
        />

        {/* BACKGROUND COLOR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Background color:</span>
          <button
            type="button"
            onClick={(e) => {
              setColorAnchorEl(e.currentTarget);
              setColorPickerOpen(true);
            }}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: rule.backgroundColor,
              border: '1px solid #888',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            data-testid="rule-color-swatch"
            aria-label="Pick background color"
          />
          <span style={{ fontFamily: 'monospace', color: '#aaa' }}>{rule.backgroundColor}</span>
        </div>
        <PopoverColorPicker
          show={colorPickerOpen}
          setShow={setColorPickerOpen}
          anchorEl={colorAnchorEl}
          setAnchorEl={setColorAnchorEl}
          initialColor={rule.backgroundColor}
          onApply={(color) => rule.setBackgroundColor(color)}
          onCancel={() => {}}
        />

        {/* SOUND */}
        <FormControl size="small">
          <InputLabel id="rule-sound-label">Sound</InputLabel>
          <Select
            labelId="rule-sound-label"
            label="Sound"
            value={rule.sound}
            onChange={(e) => rule.setSound(e.target.value as HighlightRuleSound)}
            data-testid="rule-sound-select"
          >
            <MenuItem value={HighlightRuleSound.NONE}>None</MenuItem>
            <MenuItem value={HighlightRuleSound.DING}>Ding (pass)</MenuItem>
            <MenuItem value={HighlightRuleSound.BUZZER}>Buzzer (fail)</MenuItem>
          </Select>
        </FormControl>

        {/* TEST SOUND BUTTONS */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outlined" size="small" onClick={() => app.soundPlayer.playDing()}>
            Test ding
          </Button>
          <Button variant="outlined" size="small" onClick={() => app.soundPlayer.playBuzzer()}>
            Test buzzer
          </Button>
        </div>

        {/* ENABLED */}
        <FormControlLabel
          control={
            <Checkbox
              checked={rule.enabled}
              onChange={(e) => rule.setEnabled(e.target.checked)}
              data-testid="rule-enabled"
            />
          }
          label="Enabled"
        />

        {/* CLOSE */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={() => rulesSettings.setIsModalOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
});
