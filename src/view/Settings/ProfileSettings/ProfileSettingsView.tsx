import { Button, Checkbox, FormControl, FormControlLabel, InputLabel, Select, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import ProfilesSettings from "src/model/Settings/ProfilesSettings/ProfilesSettings";
import AppStorage from "src/model/Storage/AppStorage";

import BorderedSection from "src/view/Components/BorderedSection";
import { DataType } from "src/model/Settings/RxSettings/RxSettings";
import PortConfiguration, { PortConfigurationConfig } from "src/model/Settings/PortConfigurationSettings/PortConfigurationSettings";
import { ProfileManager } from "src/model/ProfileManager/ProfileManager";

interface Props {
  profileManager: ProfileManager;
  profilesSettings: ProfilesSettings;
}

function ProfileSettingsView(props: Props) {
  const { profileManager, profilesSettings } = props;

  const profiles = profileManager.profiles;

  // Define the columns of the profiles table
  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", width: 200 },
    { field: "portSettings", headerName: "Port settings", width: 130 },
    { field: "dataType", headerName: "RX data type", width: 130 },
  ];

  // Create rows in profiles table
  let rows: any = [];
  for (let idx = 0; idx < profiles.length; idx++) {
    const profile = profiles[idx];
    rows.push({
      id: idx,
      name: profile.name,
      portSettings: profile.rootConfig.settings.portSettings.baudRate,
      dataType: DataType[profile.rootConfig.settings.rxSettings.dataType],
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      {/* <FormControl sx={{ m: 1, minWidth: 300, maxWidth: 300 }}>
        <InputLabel shrink htmlFor="select-multiple-native">
          Profiles
        </InputLabel>
        <Select<string[]>
          native
          multiple
          // value={personName}
          // @ts-ignore Typings are not considering `native`
          // onChange={handleChangeMultiple}
          label="Native"
          inputProps={{
            id: "select-multiple-native",
          }}
        >
          {profiles.map((profile) => (
            <option key={profile.name} value={profile.name}>
              {profile.name}
            </option>
          ))}
        </Select>
      </FormControl> */}

      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
          }}
          pageSizeOptions={[5, 10]}
          checkboxSelection
          // Hide the "select all" checkbox in the header row
          sx={{
            "& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-columnHeaderTitleContainer": {
              display: "none",
            },
          }}
        />
      </div>

      <Button variant="contained" color="primary">
        Load Profile
      </Button>

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
          // profileManager.newProfile();
        }}
      >
        Delete Profile
      </Button>
    </div>
  );
}

export default observer(ProfileSettingsView);
