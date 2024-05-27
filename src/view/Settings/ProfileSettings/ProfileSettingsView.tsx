import { Button, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import { DataGrid, GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";

import ProfilesSettings from "src/model/Settings/ProfilesSettings/ProfilesSettings";

import { DataType } from "src/model/Settings/RxSettings/RxSettings";
import { ProfileManager } from "src/model/ProfileManager/ProfileManager";
import ApplyableTextFieldView from "src/view/Components/ApplyableTextFieldView";
import PortConfigurationSettings from "src/model/Settings/PortConfigurationSettings/PortConfigurationSettings";
import RxSettings from "src/model/Settings/RxSettings/RxSettings";

interface Props {
  profileManager: ProfileManager;
  profilesSettings: ProfilesSettings;
}

function ProfileSettingsView(props: Props) {
  const { profileManager, profilesSettings } = props;

  const profiles = profileManager.profiles;


  // Define the columns of the profiles table
  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", width: 150 },
    { field: "corePortSettings", headerName: "Core port settings", width: 130 },
    { field: "flowControl", headerName: "Flow control", width: 80 },
    { field: "dataType", headerName: "RX data type", width: 100 },
    { field: "terminalWidth", headerName: "Terminal width", width: 100 },
  ];

  // Create rows in profiles table
  let rows: any = [];
  for (let idx = 0; idx < profiles.length; idx++) {
    const profile = profiles[idx];
    const portSettings = profile.rootConfig.settings.portSettings;
    const shorthandPortConfig = PortConfigurationSettings.computeShortSerialConfigName(portSettings.baudRate, portSettings.numDataBits, portSettings.parity, portSettings.stopBits);

    const rxSettings = profile.rootConfig.settings.rxSettings;
    const dataType = RxSettings.computeDataTypeNameForToolbarDisplay(rxSettings.dataType, rxSettings.numberType);
    rows.push({
      id: idx,
      name: profile.name,
      corePortSettings: shorthandPortConfig,
      flowControl: portSettings.flowControl,
      dataType: dataType,
      terminalWidth: `${profile.rootConfig.settings.displaySettings.terminalWidthChars}chars`,
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      <h2>Profiles</h2>
      <p>Profiles let you save and load settings and configuration to quickly switch between projects. Almost all settings are saved with each profile.</p>
      <div style={{ height: 400, width: 600 }}>
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
          // checkboxSelection
          // disableMultipleRowSelection={true}
          // Hide the "select all" checkbox in the header row
          sx={{
            "& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-columnHeaderTitleContainer": {
              display: "none",
            },
          }}
        />
      </div>

      <div style={{ height: 20 }} />

      <div style={{ display: "flex", gap: 10 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            profilesSettings.loadProfile();
          }}
        >
          Load Profile
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            profilesSettings.saveCurrentAppStateToProfile();
          }}
        >
          Save App State To Profile
        </Button>
      </div>

      <div style={{ height: 20 }} />

      <div style={{ display: "flex", gap: 10 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            profileManager.newProfile();
          }}
        >
          New Profile
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            profilesSettings.deleteProfile();
          }}
        >
          Delete Profile
        </Button>
      </div>

      <div style={{ height: 20 }} />

      {/* =============================================================================== */}
      {/* SCROLLBACK BUFFER SIZE */}
      {/* =============================================================================== */}
      <Tooltip
        title="The max. number of rows to store in any terminal scrollback buffer (TX, RX, TX/RX).
        Increasing this will give you more history but decrease performance and increase memory usage. Must be a positive non-zero integer."
        followCursor
        arrow
      >
        <ApplyableTextFieldView label="Profile name" variant="outlined" size="small" applyableTextField={profilesSettings.profileName} sx={{ marginBottom: "20px" }} />
      </Tooltip>
    </div>
  );
}

export default observer(ProfileSettingsView);
