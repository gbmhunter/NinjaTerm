import { Checkbox, FormControlLabel, Tooltip, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import GeneralSettings from "src/model/Settings/GeneralSettings/GeneralSettings";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import BorderedSection from "src/view/Components/BorderedSection";

interface Props {
  generalSettings: GeneralSettings;
}

function GeneralSettingsView(props: Props) {
  const { generalSettings } = props;
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleConfirmClearData = () => {
    generalSettings.clearAppDataAndRefresh();
    handleCloseConfirmDialog();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      {/* =============================================================================== */}
      {/* COPY/PASTE SETTINGS */}
      {/* =============================================================================== */}
      <BorderedSection title="Copy/Paste Settings">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "600px",
          }}
        >
          <Tooltip
            title="The two common ways of new terminal rows being created is either by receiving a LF char, or by running out of columns in the terminal, and the text wrapping onto a new row. When enabled, LF will not be added to the clipboard if the row was created due to wrapping. You generally want this enabled so that you can paste large chunks of received data into an external program without getting new lines inserted where they weren't in the original data."
            placement="top"
            followCursor
            arrow
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={generalSettings.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping}
                  onChange={(e) => {
                    generalSettings.setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping(e.target.checked);
                  }}
                  data-testid="do-not-add-lf-if-row-was-created-due-to-wrapping"
                />
              }
              label="When copying text from the terminal to the clipboard with Ctrl-Shift-C, do not insert LF into clipboard if row was created due to wrapping."
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
          <Tooltip
            title="You usually want this enabled, as when copying text TO the clipboard on Windows, LF is automatically replaced with CRLF. So this will undo that operation when pasting, meaning you can copy terminal text and then paste it and get the same data."
            placement="top"
            followCursor
            arrow
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={generalSettings.whenPastingOnWindowsReplaceCRLFWithLF}
                  onChange={(e) => {
                    generalSettings.setWhenPastingOnWindowsReplaceCRLFWithLF(e.target.checked);
                  }}
                />
              }
              label="When pasting text from the clipboard into a terminal with Ctrl-Shift-V, convert CRLF to LF when on Windows."
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
        </div>
      </BorderedSection>

      {/* =============================================================================== */}
      {/* APP DATA */}
      {/* =============================================================================== */}
      <BorderedSection title="App Data">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "600px",
          }}
        >
          <Button variant="outlined" size="large" startIcon={<DeleteForeverIcon />} onClick={handleOpenConfirmDialog} color="error">
            Clear app data and reload app
          </Button>
        </div>
      </BorderedSection>

      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Action"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to clear all app data and reload?<br/>
            <br/>
            You will lose all profiles and all settings will be reset to default. Logged data saved to disk will NOT be deleted.<br/>
            <br/>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>
            Cancel
          </Button>
          <Button onClick={handleConfirmClearData} color="error" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default observer(GeneralSettingsView);
