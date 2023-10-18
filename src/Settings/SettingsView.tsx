import {
  Box,
  List,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import { observer } from 'mobx-react-lite';

import { App } from '../App';
import { SettingsCategories } from './Settings';

import PortConfigurationView from './PortConfigurationView';
import DataProcessingView from './DataProcessingSettingsView';

interface Props {
  appStore: App;
}

function SettingsDialog(props: Props) {
  const { appStore } = props;

  const displayedSettingsCategory = {
    [SettingsCategories.PORT_CONFIGURATION]: (
      <PortConfigurationView appStore={appStore} />
    ),
    [SettingsCategories.DATA_PROCESSING]: (
      <DataProcessingView app={appStore} />
    ),
  };

  return (
      <div data-testid="settings-pane" style={{ height: '100%', display: 'flex' }}>
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
                  selected={
                    appStore.settings.activeSettingsCategory ===
                    SettingsCategories.PORT_CONFIGURATION
                  }
                >
                  <ListItemText>Port Configuration</ListItemText>
                </ListItemButton>
                <ListItemButton
                  onClick={() => {
                    appStore.settings.setActiveSettingsCategory(
                      SettingsCategories.DATA_PROCESSING
                    );
                  }}
                  selected={
                    appStore.settings.activeSettingsCategory ===
                    SettingsCategories.DATA_PROCESSING
                  }
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
      </div>
  );
}

export default observer(SettingsDialog);
