import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material';
import { observer } from 'mobx-react-lite';

import { App } from '../../model/App';

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;
  return (
    <Dialog
      open={app.fakePortController.isDialogOpen}
      keepMounted
      onClose={() => {
        app.fakePortController.setIsDialogOpen(false);
      }}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle>{'Select fake port to connect to.'}</DialogTitle>
      <DialogContent>
        <TextField
          name="fakePortSearch"
          label="Search fake ports"
          variant="outlined"
          size="small"
          fullWidth
          autoFocus
          value={app.fakePortController.searchText}
          onChange={(e) => {
            app.fakePortController.setSearchText(e.target.value);
          }}
          sx={{ mt: 1, mb: 1 }}
        />
        <List dense={true} sx={{ maxHeight: '600px', scroll: 'auto' }}>
          {app.fakePortController.filteredFakePorts.map(({ fakePort, idx }) => {
            return (
              <ListItem key={idx}>
                <ListItemButton
                  role={undefined}
                  onClick={() => {
                    app.fakePortController.onClick(idx);
                  }}
                  dense
                  sx={{ py: 0, minHeight: 22 }}

                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={app.fakePortController.selFakePortIdx === idx}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={fakePort.name}
                    secondary={fakePort.description}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
          {app.fakePortController.filteredFakePorts.length === 0 && (
            <Typography sx={{ p: 2, color: 'text.secondary' }}>No fake ports match "{app.fakePortController.searchText}".</Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions>
      <Button
          onClick={() => {
            app.fakePortController.setIsDialogOpen(false);
          }}
        >
          Close
        </Button>
        <Button
          onClick={() => {
            app.fakePortController.openPort();
            app.fakePortController.setIsDialogOpen(false);
          }}
        >
          Connect
        </Button>
      </DialogActions>
    </Dialog>
  );
});
