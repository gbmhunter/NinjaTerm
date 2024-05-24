import { Checkbox, FormControlLabel, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import ProfilesSettings from "src/model/Settings/ProfilesSettings/ProfilesSettings";

import BorderedSection from "src/view/Components/BorderedSection";

interface Props {
  profilesSettings: ProfilesSettings;
}

function ProfileSettingsView(props: Props) {
  const { profilesSettings } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>

    </div>
  );
}

export default observer(ProfileSettingsView);
