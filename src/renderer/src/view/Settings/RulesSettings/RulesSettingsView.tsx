import {
  Button,
  Checkbox,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { observer } from 'mobx-react-lite';

import { App } from 'src/model/App';
import { HighlightRule } from 'src/model/Settings/RulesSettings/HighlightRule';
import { HighlightRuleSound } from 'src/model/AppDataManager/DataClasses/HighlightRuleData';
import BorderedSection from 'src/view/Components/BorderedSection';
import RuleEditModal from './RuleEditModal';

interface Props {
  app: App;
}

const soundLabel: Record<HighlightRuleSound, string> = {
  [HighlightRuleSound.NONE]: '—',
  [HighlightRuleSound.DING]: 'Ding',
  [HighlightRuleSound.BUZZER]: 'Buzzer',
};

function RulesSettingsView(props: Props) {
  const { app } = props;
  const rulesSettings = app.settings.rulesSettings;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      <BorderedSection title="Highlight Rules">
        <div style={{ display: 'flex', flexDirection: 'column', width: '900px', gap: '8px' }}>
          <p style={{ margin: 0, color: '#bbb' }}>
            Rules paint the background of matching characters in the terminal scrollback and can
            optionally play a sound when a matching line completes. Rules are evaluated per
            finalised row.
          </p>

          {/* HEADER */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 2fr 60px 100px 80px',
              gap: '8px',
              padding: '6px 4px',
              borderBottom: '1px solid #444',
              fontSize: '12px',
              color: '#aaa',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <span>On</span>
            <span>Name</span>
            <span>Pattern</span>
            <span>Color</span>
            <span>Sound</span>
            <span>Actions</span>
          </div>

          {/* RULES */}
          {rulesSettings.rules.length === 0 ? (
            <div style={{ padding: '16px 4px', color: '#888' }}>
              No rules yet. Click <em>Add rule</em> to create one.
            </div>
          ) : (
            rulesSettings.rules.map((rule, idx) => (
              <RuleRow key={idx} rule={rule} index={idx} rulesSettings={rulesSettings} />
            ))
          )}

          {/* ADD */}
          <div style={{ marginTop: '12px' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => rulesSettings.addRule()}
              data-testid="add-rule-button"
            >
              Add rule
            </Button>
          </div>
        </div>
      </BorderedSection>

      <RuleEditModal app={app} rulesSettings={rulesSettings} />
    </div>
  );
}

interface RuleRowProps {
  rule: HighlightRule;
  index: number;
  rulesSettings: App['settings']['rulesSettings'];
}

const RuleRow = observer((props: RuleRowProps) => {
  const { rule, index, rulesSettings } = props;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 1fr 2fr 60px 100px 80px',
        gap: '8px',
        alignItems: 'center',
        padding: '4px',
        borderBottom: '1px solid #333',
      }}
      data-testid={`rule-row-${index}`}
    >
      <Checkbox
        checked={rule.enabled}
        onChange={(e) => rule.setEnabled(e.target.checked)}
        size="small"
        inputProps={{ 'aria-label': `Toggle rule ${rule.name}` }}
      />
      <span>{rule.name || <em style={{ color: '#888' }}>(no name)</em>}</span>
      <span
        style={{
          fontFamily: 'monospace',
          color: rule.errorMsg ? '#e57373' : '#ddd',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={rule.errorMsg || rule.pattern}
      >
        {rule.pattern || <em style={{ color: '#888' }}>(empty)</em>}
      </span>
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          backgroundColor: rule.backgroundColor,
          border: '1px solid #555',
        }}
      />
      <span>{soundLabel[rule.sound]}</span>
      <div style={{ display: 'flex', gap: '0px' }}>
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={() => {
              rulesSettings.setRuleToDisplayInModal(rule);
              rulesSettings.setIsModalOpen(true);
            }}
            data-testid={`edit-rule-${index}`}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => rulesSettings.deleteRule(index)}
            data-testid={`delete-rule-${index}`}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
});

export default observer(RulesSettingsView);
