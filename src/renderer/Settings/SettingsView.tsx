import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  List,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import React from 'react';
import { observer } from 'mobx-react-lite';

import { AppStore } from 'stores/AppStore';
import { SettingsCategories } from 'stores/Settings/Settings';

import PortConfiguration from './PortConfiguration';
import DataProcessingView from './DataProcessingView';

interface Props {
  appStore: AppStore;
}

function SettingsDialog(props: Props) {
  const { appStore } = props;

  const displayedSettingsCategory = {
    [SettingsCategories.PORT_CONFIGURATION]: (
      <PortConfiguration appStore={appStore} />
    ),
    [SettingsCategories.DATA_PROCESSING]: (
      <DataProcessingView appStore={appStore} />
    ),
  };

  return (
    <Dialog
      open={appStore.settingsDialogOpen}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        style: {
          minHeight: '90%', // Overriding the interior paper style to force a fixed height
          maxHeight: '90%',
        },
      }}
    >
      <DialogTitle>Settings</DialogTitle>
      <DialogContent sx={{ height: '100%', display: 'flex' }}>
        {/* Outer box containing left-hand fixed-width column with setting sub-categories, and right-hand adjustable width
        colum with selected subcategory settings. Force height to 100% so that the left hand list border always stretches from
        top to bottom */}
        <Box id="test" sx={{ display: 'flex', flexDirection: 'row' }}>
          {/* Add a little border to the right-hand side to separate from sub-category settings */}
          <Box
            sx={{
              minWidth: '180px',
              marginRight: '10px',
              borderRight: 1,
              borderColor: 'grey.700',
            }}
          >
            <nav aria-label="main">
              <List sx={{ marginRight: '10px' }}>
                <ListItemButton
                  onClick={() => {
                    appStore.settings.setActiveSettingsCategory(
                      SettingsCategories.PORT_CONFIGURATION
                    );
                  }}
                >
                  <ListItemText>Port Configuration</ListItemText>
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    appStore.settings.setActiveSettingsCategory(
                      SettingsCategories.DATA_PROCESSING
                    );
                  }}
                >
                  <ListItemText>Data Processing</ListItemText>
                </ListItemButton>
              </List>
            </nav>
          </Box>
          {/* Container to wrap scrollable content in right-hand side pane */}
          <Box sx={{ overflowY: 'auto' }}>
            {
              displayedSettingsCategory[
                appStore.settings.activeSettingsCategory
              ]
            }
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => {
            appStore.setSettingsDialogOpen(false);
          }}
        >
          Close Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default observer(SettingsDialog);
