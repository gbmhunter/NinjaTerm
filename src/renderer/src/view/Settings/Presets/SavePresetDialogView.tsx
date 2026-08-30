import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';

import { App } from '@/model/App';
import { ALL_PRESET_CATEGORIES, PRESET_CATEGORIES } from '@/model/Presets/PresetScope';

interface Props {
  app: App;
}

/**
 * Asks for a name and, crucially, what the new preset should cover.
 *
 * The scope checkboxes are the whole point of the merged model: a preset for a
 * particular board wants its serial port in it, while a logging preset very much
 * does not. Everything starts ticked, since capturing the current setup whole is
 * the common case and unticking is easier than hunting.
 */
function SavePresetDialogView(props: Props) {
  const { app } = props;
  const presetController = app.presetController;
  const saveDialog = presetController.saveDialog;

  if (saveDialog === null) {
    return null;
  }

  const overwriteIndex = presetController.saveDialogOverwriteIndex;
  const clashesWithBuiltIn = presetController.saveDialogNameClashesWithBuiltIn;

  let helperText = '';
  if (clashesWithBuiltIn) {
    helperText = 'That name is used by a built-in preset.';
  } else if (overwriteIndex !== null) {
    helperText = `A preset called "${saveDialog.name.trim()}" already exists and will be replaced.`;
  }

  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      onClose={() => {
        presetController.closeSaveDialog();
      }}
      data-testid="save-preset-dialog"
    >
      <DialogTitle>Save current settings as a preset</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Preset name"
          sx={{ marginTop: '8px', marginBottom: '16px' }}
          value={saveDialog.name}
          error={clashesWithBuiltIn}
          helperText={helperText}
          onChange={(event) => {
            presetController.setSaveDialogName(event.target.value);
          }}
          inputProps={{ 'data-testid': 'save-preset-name-input' }}
        />

        <Stack direction="row" spacing={2} alignItems="center" sx={{ marginBottom: '4px' }}>
          <Typography variant="subtitle2">What should this preset cover?</Typography>
          <Button
            size="small"
            data-testid="save-preset-select-all"
            onClick={() => {
              presetController.setSaveDialogScope(ALL_PRESET_CATEGORIES);
            }}
          >
            Select all
          </Button>
          <Button
            size="small"
            data-testid="save-preset-select-none"
            onClick={() => {
              presetController.setSaveDialogScope([]);
            }}
          >
            Select none
          </Button>
        </Stack>

        <FormGroup data-testid="save-preset-scope-group">
          {PRESET_CATEGORIES.map((def) => (
            <FormControlLabel
              key={def.category}
              control={
                <Checkbox
                  size="small"
                  checked={saveDialog.scope.includes(def.category)}
                  onChange={() => {
                    presetController.toggleSaveDialogCategory(def.category);
                  }}
                  inputProps={
                    { 'data-testid': `save-preset-scope-${def.category}` } as React.InputHTMLAttributes<HTMLInputElement>
                  }
                />
              }
              label={
                <div>
                  <Typography variant="body2">{def.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {def.description}
                  </Typography>
                </div>
              }
              sx={{ alignItems: 'flex-start', marginBottom: '4px' }}
            />
          ))}
        </FormGroup>

        {saveDialog.scope.length === 0 && (
          <FormHelperText error data-testid="save-preset-empty-scope-error">
            Pick at least one thing to save, otherwise applying this preset would do nothing.
          </FormHelperText>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            presetController.closeSaveDialog();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!presetController.canSave}
          data-testid="save-preset-confirm"
          onClick={() => {
            presetController.confirmSaveDialog();
          }}
        >
          {overwriteIndex !== null ? 'Overwrite' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default observer(SavePresetDialogView);
