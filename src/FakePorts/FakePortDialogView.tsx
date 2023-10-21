import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { observer } from "mobx-react-lite";

import { App } from "../App";

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
      <DialogTitle>{"Select fake port to connect to."}</DialogTitle>
      <DialogContent>
        <List dense={true}>
          {app.fakePortController.fakePorts.map((fakePort, idx) => {
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
        </List>
      </DialogContent>
      <DialogActions>
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
