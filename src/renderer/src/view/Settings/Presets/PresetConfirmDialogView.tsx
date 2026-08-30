import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { App } from '@/model/App';

interface Props {
  app: App;
}

/**
 * Asks the user to confirm applying a preset, showing exactly which settings
 * will change and what they will change from.
 *
 * The diff is not only a safety net. For someone who doesn't know which of the
 * app's ~90 settings matter for their device, being shown the four that do is
 * the most useful thing here — it teaches them where to look next time.
 */
function PresetConfirmDialogView(props: Props) {
  const { app } = props;
  const presetController = app.presetController;
  const preset = presetController.presetPendingConfirmation;

  if (preset === null) {
    return null;
  }

  const changes = presetController.computeChanges(preset);
  const alreadyApplied = changes.length === 0;

  return (
    <Dialog
      open
      maxWidth="md"
      fullWidth
      onClose={() => {
        presetController.closeConfirmation();
      }}
      data-testid="preset-confirm-dialog"
    >
      <DialogTitle>Apply preset &quot;{preset.name}&quot;?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ marginBottom: '15px' }}>{preset.details}</DialogContentText>

        {alreadyApplied ? (
          <Typography data-testid="preset-already-applied">
            This preset matches your current settings, so there is nothing to change.
          </Typography>
        ) : (
          <>
            <Table size="small" data-testid="preset-changes-table">
              <TableHead>
                <TableRow>
                  <TableCell>Setting</TableCell>
                  <TableCell>Now</TableCell>
                  <TableCell />
                  <TableCell>After</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {changes.map((change) => (
                  <TableRow key={change.path} data-testid={`preset-change-${change.path}`}>
                    <TableCell>{change.label}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{change.oldValue}</TableCell>
                    <TableCell sx={{ width: '24px', padding: 0 }}>
                      <ArrowForwardIcon fontSize="inherit" sx={{ color: 'text.secondary' }} />
                    </TableCell>
                    <TableCell>{change.newValue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', marginTop: '10px' }}>
              All other settings are left unchanged, including your connection settings, colours and
              logging. You can undo this straight afterwards.
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            presetController.closeConfirmation();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={alreadyApplied}
          data-testid="preset-confirm-apply"
          onClick={() => {
            presetController.applyPreset(preset);
          }}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default observer(PresetConfirmDialogView);
