import { Button, Checkbox, FormControl, FormControlLabel, InputLabel, Select, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import ProfilesSettings from "src/model/Settings/ProfilesSettings/ProfilesSettings";
import AppStorage from "src/model/Storage/AppStorage";

import BorderedSection from "src/view/Components/BorderedSection";
import { DataType } from "src/model/Settings/RxSettings/RxSettings";

interface Props {
  appStorage: AppStorage;
  profilesSettings: ProfilesSettings;
}

function ProfileSettingsView(props: Props) {
  const { appStorage, profilesSettings } = props;

  const profiles = appStorage.getProfiles();

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", width: 200 },
    { field: "portSettings", headerName: "Port settings", width: 130 },
    { field: "dataType", headerName: "RX data type", width: 130 },
  ];

  let rows = [];
  for (let profile of profiles) {
    rows.push({
      id: profile.name,
      name: profile.name,
      portSettings: profile.configData["settings"]["port-configuration-settings"]["baudRate"],
      dataType: DataType[profile.configData["settings"]["rx-settings"]["dataType"]],
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      <FormControl sx={{ m: 1, minWidth: 300, maxWidth: 300 }}>
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
      </FormControl>

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

      <Button variant="contained" color="primary">
        New Profile
      </Button>
    </div>
  );
}

export default observer(ProfileSettingsView);
