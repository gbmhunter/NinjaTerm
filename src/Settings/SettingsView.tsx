import {
  Box,
  List,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import { observer } from 'mobx-react-lite';

import { App } from '../App';
import { SettingsCategories } from './Settings';

import PortConfigurationSettingsView from './PortConfigurationSettings/PortConfigurationSettingsView';
import DataProcessingSettingsView from './DataProcessingSettings/DataProcessingSettingsView';
import DisplaySettingsView from './DisplaySettings/DisplaySettingsView';

interface Props {
  appStore: App;
}

function SettingsDialog(props: Props) {
  const { appStore } = props;

  const displayedSettingsCategory = {
    [SettingsCategories.PORT_CONFIGURATION]: (
      <PortConfigurationSettingsView app={appStore} />
    ),
    [SettingsCategories.DATA_PROCESSING]: (
      <DataProcessingSettingsView dataProcessingSettings={appStore.settings.dataProcessingSettings} />
    ),
    [SettingsCategories.DISPLAY]: (
      <DisplaySettingsView app={appStore} />
    ),
  };

  return (
      <div data-testid="settings-pane" style={{ width: '100%', height: '100%', display: 'flex', flexGrow: 1, flexDirection: 'row', overflowY: 'hidden' }}>
          {/* Outer box containing left-hand fixed-width column with setting sub-categories, and right-hand adjustable width colum with selected subcategory settings. Force height to 100% so that the left hand list border always stretches from top to bottom */}
          {/* Add a little border to the right-hand side to separate from sub-category settings */}
          <div
            id="settings-pane-left"
            style={{
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
                <ListItemButton
                  onClick={() => {
                    appStore.settings.setActiveSettingsCategory(
                      SettingsCategories.DISPLAY
                    );
                  }}
                  selected={
                    appStore.settings.activeSettingsCategory ===
                    SettingsCategories.DISPLAY
                  }
                >
                  <ListItemText>Display</ListItemText>
                </ListItemButton>
              </List>
            </nav>
          </div>
          {/* Container to wrap scrollable content in right-hand side pane */}
          <div style={{ flexGrow: 1, overflowY: 'auto', height: '100%' }}>
            {
              displayedSettingsCategory[
                appStore.settings.activeSettingsCategory
              ]
            }
          </div>
      </div>
  );
}

export default observer(SettingsDialog);
