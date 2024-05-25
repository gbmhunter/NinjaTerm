import {
  Box,
  List,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import { observer } from 'mobx-react-lite';

import { App } from '../../model/App';
import { SettingsCategories } from '../../model/Settings/Settings';

import PortConfigurationSettingsView from './PortConfigurationSettings/PortConfigurationSettingsView';
import DataProcessingSettingsView from './RxSettings/RxSettingsView';
import DisplaySettingsView from './DisplaySettings/DisplaySettingsView';
import TxSettingsView from './TxSettings/TxSettingsView';
import GeneralSettingsView from './GeneralSettings/GeneralSettingsView';
import ProfileSettingsView from './ProfileSettings/ProfileSettingsView';

interface Props {
  app: App;
}

function SettingsDialog(props: Props) {
  const { app } = props;

  const displayedSettingsCategory = {
    [SettingsCategories.PORT_CONFIGURATION]: (
      <PortConfigurationSettingsView app={app} />
    ),
    [SettingsCategories.TX_SETTINGS]: (
      <TxSettingsView txSettings={app.settings.txSettings} />
    ),
    [SettingsCategories.RX_SETTINGS]: (
      <DataProcessingSettingsView rxSettings={app.settings.rxSettings} />
    ),
    [SettingsCategories.DISPLAY]: (
      <DisplaySettingsView app={app} />
    ),
    [SettingsCategories.GENERAL]: (
      <GeneralSettingsView generalSettings={app.settings.generalSettings} />
    ),
    [SettingsCategories.PROFILES]: (
      <ProfileSettingsView profileManager={app.profileManager} profilesSettings={app.settings.profilesSettings} />
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
                {/* ================================================ */}
                {/* PORT CONFIGURATION */}
                {/* ================================================ */}
                <ListItemButton
                  onClick={() => {
                    app.settings.setActiveSettingsCategory(
                      SettingsCategories.PORT_CONFIGURATION
                    );
                  }}
                  selected={
                    app.settings.activeSettingsCategory ===
                    SettingsCategories.PORT_CONFIGURATION
                  }
                >
                  <ListItemText>Port Configuration</ListItemText>
                </ListItemButton>
                {/* ================================================ */}
                {/* TX SETTINGS */}
                {/* ================================================ */}
                <ListItemButton
                  onClick={() => {
                    app.settings.setActiveSettingsCategory(
                      SettingsCategories.TX_SETTINGS
                    );
                  }}
                  selected={
                    app.settings.activeSettingsCategory ===
                    SettingsCategories.TX_SETTINGS
                  }
                >
                  <ListItemText>TX Settings</ListItemText>
                </ListItemButton>
                {/* ================================================ */}
                {/* RX SETTINGS */}
                {/* ================================================ */}
                <ListItemButton
                  onClick={() => {
                    app.settings.setActiveSettingsCategory(
                      SettingsCategories.RX_SETTINGS
                    );
                  }}
                  selected={
                    app.settings.activeSettingsCategory ===
                    SettingsCategories.RX_SETTINGS
                  }
                  data-testid="rx-settings-button"
                >
                  <ListItemText>RX Settings</ListItemText>
                </ListItemButton>
                {/* ================================================ */}
                {/* DISPLAY */}
                {/* ================================================ */}
                <ListItemButton
                  onClick={() => {
                    app.settings.setActiveSettingsCategory(
                      SettingsCategories.DISPLAY
                    );
                  }}
                  selected={
                    app.settings.activeSettingsCategory ===
                    SettingsCategories.DISPLAY
                  }
                  data-testid="display-settings-button"
                >
                  <ListItemText>Display</ListItemText>
                </ListItemButton>
                {/* ================================================ */}
                {/* GENERAL */}
                {/* ================================================ */}
                <ListItemButton
                  onClick={() => {
                    app.settings.setActiveSettingsCategory(
                      SettingsCategories.GENERAL
                    );
                  }}
                  selected={
                    app.settings.activeSettingsCategory ===
                    SettingsCategories.GENERAL
                  }
                  data-testid="general-settings-button"
                >
                  <ListItemText>General</ListItemText>
                </ListItemButton>
                {/* ================================================ */}
                {/* PROFILES */}
                {/* ================================================ */}
                <ListItemButton
                  onClick={() => {
                    app.settings.setActiveSettingsCategory(
                      SettingsCategories.PROFILES
                    );
                  }}
                  selected={
                    app.settings.activeSettingsCategory ===
                    SettingsCategories.PROFILES
                  }
                  data-testid="profile-settings-button"
                >
                  <ListItemText>Profiles</ListItemText>
                </ListItemButton>
              </List>
            </nav>
          </div>
          {/* Container to wrap scrollable content in right-hand side pane */}
          <div style={{ flexGrow: 1, overflowY: 'auto', height: '100%' }}>
            {
              displayedSettingsCategory[
                app.settings.activeSettingsCategory
              ]
            }
          </div>
      </div>
  );
}

export default observer(SettingsDialog);
