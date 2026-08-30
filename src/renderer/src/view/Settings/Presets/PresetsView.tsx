import {
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

import { App } from '@/model/App';
import { PresetRow } from '@/model/Presets/PresetRow';
import PresetConfirmDialogView from './PresetConfirmDialogView';
import SavePresetDialogView from './SavePresetDialogView';

interface Props {
  app: App;
}

/**
 * One row of the preset list. Built-in and saved presets render through the same
 * component, so the list reads as one concept rather than two that happen to
 * share a page.
 */
const PresetListItemView = observer((props: { app: App; row: PresetRow }) => {
  const { app, row } = props;
  const presetController = app.presetController;
  const tooltipConfig = app.settings.displaySettings.getBasicTooltipConfig();
  const isBuiltIn = row.preset.source === 'built-in';
  const scopeChips = presetController.scopeChipsFor(row.preset);

  return (
    <ListItem
      divider
      data-testid={`preset-row-${row.key}`}
      secondaryAction={
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip
            title={`Apply "${row.preset.name}" to your current settings.`}
            {...tooltipConfig}
          >
            <Button
              variant="outlined"
              size="small"
              data-testid={`apply-preset-${row.key}`}
              onClick={() => {
                presetController.requestApply(row.preset);
              }}
            >
              Apply
            </Button>
          </Tooltip>
          {!isBuiltIn && (
            <>
              <Tooltip title="Replace this preset with your current settings." {...tooltipConfig}>
                <Button
                  size="small"
                  startIcon={<SaveIcon />}
                  data-testid={`update-preset-${row.key}`}
                  onClick={() => {
                    presetController.updateStoredPreset(row);
                  }}
                >
                  Update
                </Button>
              </Tooltip>
              <Tooltip title="Delete this preset." {...tooltipConfig}>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  data-testid={`delete-preset-${row.key}`}
                  onClick={() => {
                    presetController.deleteStoredPreset(row);
                  }}
                >
                  Delete
                </Button>
              </Tooltip>
            </>
          )}
        </Stack>
      }
    >
      <ListItemText
        sx={{ paddingRight: '260px' }}
        primary={
          <Stack direction="row" spacing={1} alignItems="center">
            <span>{row.preset.name}</span>
          </Stack>
        }
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <>
            {row.preset.description !== '' && <div>{row.preset.description}</div>}
            {/* `gap` rather than Stack's `spacing`, which uses negative margins
            and mis-spaces the second line once the chips wrap. */}
            <Stack
              direction="row"
              sx={{ marginTop: '4px', flexWrap: 'wrap', gap: 0.5 }}
              data-testid={`preset-scope-${row.key}`}
            >
              {scopeChips.labels.map((label) => (
                <Chip
                  key={label}
                  size="small"
                  variant="outlined"
                  label={
                    label === 'Connection settings' && row.connectionSummary !== null
                      ? `Connection · ${row.connectionSummary}`
                      : label
                  }
                />
              ))}
            </Stack>
          </>
        }
      />
    </ListItem>
  );
});

/**
 * The presets pane: the ones the user has saved, and the ones that ship with
 * NinjaTerm.
 *
 * These used to be two separate concepts — built-in "presets" that patched a few
 * settings, and saved "profiles" that replaced everything including the serial
 * port. They are now one thing, distinguished by what each covers, which every
 * row shows as scope chips. The two groups are still shown as separate cards,
 * because where a preset came from decides what you can do to it: the built-in
 * ones can't be renamed, updated or deleted.
 */
function PresetsView(props: Props) {
  const { app } = props;
  const presetController = app.presetController;
  const rows = presetController.filteredRows;
  const userRows = rows.filter((row) => row.preset.source === 'user');
  const builtInRows = rows.filter((row) => row.preset.source === 'built-in');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      <h2>Presets</h2>
      <p style={{ maxWidth: 800 }}>
        Save your current settings as a preset, or apply one of the built-in presets. When saving a preset, you can choose to only save certain settings.
      </p>

      <Stack direction="row" spacing={1} sx={{ marginBottom: '10px' }}>
        <TextField
          label="Search presets"
          variant="outlined"
          size="small"
          value={presetController.searchText}
          onChange={(event) => {
            presetController.setSearchText(event.target.value);
          }}
          inputProps={{ 'data-testid': 'preset-search-input' }}
          sx={{ width: '300px' }}
        />
        <Tooltip
          title="Save your current settings as a new preset, choosing what it should cover."
          {...app.settings.displaySettings.getBasicTooltipConfig()}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            data-testid="save-preset-button"
            onClick={() => {
              presetController.openSaveDialog();
            }}
          >
            Save current settings as preset...
          </Button>
        </Tooltip>
      </Stack>

      {/* Two separate cards rather than one list with subheadings: the two
      groups are the same kind of thing but have different origins, and a card
      each makes that legible at a glance without needing a per-row badge. */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: '4px' }}>
        Your presets
      </Typography>
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 900 }}>
        <List dense disablePadding data-testid="preset-list">
          {userRows.map((row) => (
            <PresetListItemView key={row.key} app={app} row={row} />
          ))}
          {userRows.length === 0 && (
            <ListItem data-testid="preset-list-no-user-presets">
              <ListItemText
                secondary={
                  presetController.searchText === ''
                    ? "You haven't saved any presets yet."
                    : 'No saved presets match your search.'
                }
              />
            </ListItem>
          )}
        </List>
      </Paper>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, marginTop: '28px', marginBottom: '4px' }}>
        Built in
      </Typography>
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 900 }}>
        <List dense disablePadding data-testid="built-in-preset-list">
          {builtInRows.map((row) => (
            <PresetListItemView key={row.key} app={app} row={row} />
          ))}
          {builtInRows.length === 0 && (
            <ListItem data-testid="preset-list-no-built-ins">
              <ListItemText secondary="No built-in presets match your search." />
            </ListItem>
          )}
        </List>
      </Paper>

      {presetController.canUndo && (
        <Tooltip
          title="Restore the settings as they were before the last preset was applied."
          {...app.settings.displaySettings.getBasicTooltipConfig()}
        >
          <Button
            size="small"
            data-testid="undo-preset-button"
            sx={{ marginTop: '10px' }}
            onClick={() => {
              presetController.undoLastPreset();
            }}
          >
            Undo last preset
          </Button>
        </Tooltip>
      )}

      <PresetConfirmDialogView app={app} />
      <SavePresetDialogView app={app} />

      <div style={{ height: '30px' }} />
    </div>
  );
}

export default observer(PresetsView);
