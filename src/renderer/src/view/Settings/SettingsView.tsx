import {
  List,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  ListSubheader,
} from '@mui/material';
import CableIcon from '@mui/icons-material/Cable';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import MonitorIcon from '@mui/icons-material/Monitor';
import RuleIcon from '@mui/icons-material/Rule';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import { observer } from 'mobx-react-lite';

import { App } from '../../model/App';
import { SettingsCategories } from '../../model/Settings/Settings';

import PortConfigurationSettingsView from './ConnectionSettings/ConnectionSettingsView';
import DataProcessingSettingsView from './RxSettings/RxSettingsView';
import DisplaySettingsView from './DisplaySettings/DisplaySettingsView';
import TxSettingsView from './TxSettings/TxSettingsView';
import GeneralSettingsView from './GeneralSettings/GeneralSettingsView';
import PresetsView from './Presets/PresetsView';
import RulesSettingsView from './RulesSettings/RulesSettingsView';

interface Props {
  app: App;
}

type Section = {
  id: SettingsCategories;
  label: string;
  icon: React.ReactNode;
  testId?: string;
};

type Group = {
  heading: string;
  sections: Section[];
};

const groups: Group[] = [
  {
    // Deliberately first. Someone who opens Settings and is faced with ~90
    // options should hit the task-shaped entry point before the mechanism-shaped
    // ones. The pane hosts the built-in presets and the user's saved profiles.
    heading: 'Get started',
    sections: [
      {
        id: SettingsCategories.PROFILES,
        label: 'Presets',
        icon: <TuneIcon fontSize="small" />,
        // Unchanged: e2e tests and ElectronUtil.goToProfiles depend on it.
        testId: 'profile-settings-button',
      },
    ],
  },
  {
    heading: 'Communication',
    sections: [
      {
        id: SettingsCategories.CONNECTION_CONFIGURATION,
        label: 'Connection',
        icon: <CableIcon fontSize="small" />,
      },
      {
        id: SettingsCategories.TX_SETTINGS,
        label: 'TX Settings',
        icon: <ArrowUpwardIcon fontSize="small" />,
        testId: 'tx-settings-button',
      },
      {
        id: SettingsCategories.RX_SETTINGS,
        label: 'RX Settings',
        icon: <ArrowDownwardIcon fontSize="small" />,
        testId: 'rx-settings-button',
      },
    ],
  },
  {
    heading: 'Appearance',
    sections: [
      {
        id: SettingsCategories.DISPLAY,
        label: 'Display',
        icon: <MonitorIcon fontSize="small" />,
        testId: 'display-settings-button',
      },
      {
        id: SettingsCategories.RULES,
        label: 'Rules',
        icon: <RuleIcon fontSize="small" />,
        testId: 'rules-settings-button',
      },
    ],
  },
  {
    heading: 'Application',
    sections: [
      {
        id: SettingsCategories.GENERAL,
        label: 'General',
        icon: <SettingsIcon fontSize="small" />,
        testId: 'general-settings-button',
      },
    ],
  },
];

function SettingsDialog(props: Props) {
  const { app } = props;

  const displayedSettingsCategory = {
    [SettingsCategories.CONNECTION_CONFIGURATION]: (
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
      <GeneralSettingsView generalSettings={app.settings.generalSettings} app={app} />
    ),
    [SettingsCategories.PROFILES]: (
      <PresetsView app={app} />
    ),
    [SettingsCategories.RULES]: (
      <RulesSettingsView app={app} />
    ),
  };

  return (
      <div data-testid="settings-pane" style={{ width: '100%', height: '100%', display: 'flex', flexGrow: 1, flexDirection: 'row', overflowY: 'hidden' }}>
          {/* Outer box containing left-hand fixed-width column with setting sub-categories, and right-hand adjustable width colum with selected subcategory settings. */}
          <div
            id="settings-pane-left"
            style={{
              minWidth: '200px',
              marginRight: '16px',
            }}
          >
            <nav aria-label="main">
              <List sx={{ paddingTop: 0 }}>
                {groups.map((group, groupIdx) => (
                  <li key={group.heading} style={{ listStyle: 'none' }}>
                    <ul style={{ padding: 0, margin: 0 }}>
                      <ListSubheader
                        disableSticky
                        sx={{
                          backgroundColor: 'transparent',
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          lineHeight: 2,
                          paddingLeft: 1.5,
                          paddingRight: 1.5,
                          marginTop: groupIdx === 0 ? 0.5 : 1.5,
                        }}
                      >
                        {group.heading}
                      </ListSubheader>
                      {group.sections.map((section) => {
                        const isSelected =
                          app.settings.activeSettingsCategory === section.id;
                        return (
                          <ListItemButton
                            key={section.id}
                            data-testid={section.testId}
                            onClick={() => {
                              app.settings.setActiveSettingsCategory(section.id);
                            }}
                            selected={isSelected}
                            sx={{
                              marginX: 0.75,
                              marginY: 0.25,
                              borderRadius: 1,
                              paddingY: 0.6,
                              paddingX: 1.25,
                              '&.Mui-selected': {
                                // Brand-primary (muted teal #5eead4) at low opacity for the chip background.
                                backgroundColor: 'rgba(94, 234, 212, 0.16)',
                                '&:hover': {
                                  backgroundColor: 'rgba(94, 234, 212, 0.22)',
                                },
                                '& .MuiListItemIcon-root': {
                                  color: 'primary.main',
                                },
                                '& .MuiListItemText-primary': {
                                  color: 'primary.main',
                                  fontWeight: 600,
                                },
                              },
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 32,
                                color: 'text.secondary',
                              }}
                            >
                              {section.icon}
                            </ListItemIcon>
                            <ListItemText
                              primaryTypographyProps={{
                                fontSize: '0.875rem',
                              }}
                            >
                              {section.label}
                            </ListItemText>
                          </ListItemButton>
                        );
                      })}
                    </ul>
                  </li>
                ))}
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
