import { Button, Checkbox, FormControl, FormControlLabel, InputLabel, Select, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import ProfilesSettings from "src/model/Settings/ProfilesSettings/ProfilesSettings";
import AppStorage from "src/model/Storage/AppStorage";

import BorderedSection from "src/view/Components/BorderedSection";

interface Props {
  appStorage: AppStorage;
  profilesSettings: ProfilesSettings;
}

function ProfileSettingsView(props: Props) {
  const { appStorage, profilesSettings } = props;

  const profiles = appStorage.getProfiles();

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
            id: 'select-multiple-native',
          }}
        >
          {profiles.map((profile) => (
            <option key={profile.name} value={profile.name}>
              {profile.name}
            </option>
          ))}
        </Select>
      </FormControl>

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
