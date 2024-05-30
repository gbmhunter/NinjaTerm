import { Button, TextField, Tooltip } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import ProfilesSettings from 'src/model/Settings/ProfileSettings/ProfileSettings';
import { ProfileManager } from 'src/model/ProfileManager/ProfileManager';
import PortConfigurationSettings from 'src/model/Settings/PortConfigurationSettings/PortConfigurationSettings';
import RxSettings from 'src/model/Settings/RxSettings/RxSettings';

interface Props {
  profileManager: ProfileManager;
  profilesSettings: ProfilesSettings;
}

function ProfileSettingsView(props: Props) {
  const { profileManager, profilesSettings } = props;

  const profiles = profileManager.profiles;

  // Define the columns of the profiles table
  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'corePortSettings', headerName: 'Core port settings', width: 130 },
    { field: 'flowControl', headerName: 'Flow control', width: 80 },
    { field: 'portInfo', headerName: 'Port info', width: 300 },
    { field: 'dataType', headerName: 'RX data type', width: 100 },
    { field: 'terminalWidth', headerName: 'Terminal width', width: 100 },
  ];

  // Create rows in profiles table
  let rows: any = [];
  for (let idx = 0; idx < profiles.length; idx++) {
    const profile = profiles[idx];
    const portSettings = profile.rootConfig.settings.portSettings;
    const shorthandPortConfig = PortConfigurationSettings.computeShortSerialConfigName(portSettings.baudRate, portSettings.numDataBits, portSettings.parity, portSettings.stopBits);

    const rxSettings = profile.rootConfig.settings.rxSettings;
    const dataType = RxSettings.computeDataTypeNameForToolbarDisplay(rxSettings.dataType, rxSettings.numberType);

    const lastUsedSerialPort = profile.rootConfig.lastUsedSerialPort;
    const lastUsedSerialPortInfoJson = JSON.stringify(lastUsedSerialPort.serialPortInfo);
    rows.push({
      id: idx,
      name: profile.name,
      corePortSettings: shorthandPortConfig,
      flowControl: portSettings.flowControl,
      portInfo: lastUsedSerialPortInfoJson,
      dataType: dataType,
      terminalWidth: `${profile.rootConfig.settings.displaySettings.terminalWidthChars}chars`,
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      <h2>Profiles</h2>
      <p style={{ maxWidth: 800 }}>
        Profiles let you save and load settings and configuration to quickly switch between projects. Almost all settings are saved with each profile. The last selected serial port
        will be saved with the profile, and NinjaTerm will attempt to reconnect to that port when the profile is loaded (because of the limited information about the serial ports
        available in the browser, it might not be enough to uniquely identify the port).
      </p>
      <div style={{ height: 400 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 100 },
            },
          }}
          pageSizeOptions={[100]} // Just display as many as possible in one page (limited to 100 in community edition)
          density="compact"
          rowSelectionModel={profilesSettings.selectedProfiles}
          onRowSelectionModelChange={(newRowSelectionModel: GridRowSelectionModel) => {
            profilesSettings.setSelectedProfiles(newRowSelectionModel);
          }}
          // Hide the "select all" checkbox in the header row
          sx={{
            '& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-columnHeaderTitleContainer': {
              display: 'none',
            },
          }}
        />
      </div>

      <div style={{ height: 20 }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Tooltip
          title="Loads the configuration saved in the selected profile above and applies it to the app. If there is a saved serial port and it is still available, it will be connected to."
          enterDelay={500}
          arrow
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<PublishIcon />}
            disabled={profilesSettings.selectedProfiles.length !== 1}
            onClick={async () => {
              await profilesSettings.loadProfile();
            }}
          >
            Load Profile
          </Button>
        </Tooltip>

        <Tooltip title="Saves the current app state to the selected profile above." enterDelay={500} arrow>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={profilesSettings.selectedProfiles.length !== 1}
            onClick={() => {
              profilesSettings.saveCurrentAppStateToProfile();
            }}
          >
            Save App State To Profile
          </Button>
        </Tooltip>

        {/* =============================================================================== */}
        {/* PROFILE NAME */}
        {/* =============================================================================== */}
        <Tooltip title="Use this to rename the selected profile's name." enterDelay={500} arrow>
          <TextField
            label="Profile name"
            variant="outlined"
            size="small"
            value={profilesSettings.profileNameText}
            error={profilesSettings.profileNameErrorMsg !== ''}
            helperText={profilesSettings.profileNameErrorMsg}
            disabled={profilesSettings.selectedProfiles.length !== 1}
            onChange={(event) => {
              profilesSettings.setProfileName(event.target.value);
            }}
          ></TextField>
        </Tooltip>
      </div>

      <div style={{ height: 20 }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Tooltip title="Creates a new profile with the current app configuration saved to it." enterDelay={500} arrow>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              profileManager.newProfile();
            }}
          >
            New Profile
          </Button>
        </Tooltip>

        <Tooltip title="Deletes the selected profile above." enterDelay={500} arrow>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DeleteIcon />}
            disabled={profilesSettings.selectedProfiles.length !== 1}
            onClick={() => {
              profilesSettings.deleteProfile();
            }}
          >
            Delete Profile
          </Button>
        </Tooltip>
      </div>

      <div style={{ height: '30px' }} />
    </div>
  );
}

export default observer(ProfileSettingsView);
