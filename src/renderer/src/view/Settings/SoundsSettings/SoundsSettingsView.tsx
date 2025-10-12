import { Checkbox, FormControlLabel, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import SoundsSettings from "src/model/Settings/SoundsSettings/SoundsSettings";
import { App } from "src/model/App";

import BorderedSection from "src/view/Components/BorderedSection";

interface Props {
  soundsSettings: SoundsSettings;
  app: App;
}

function SoundsSettingsView(props: Props) {
  const { soundsSettings, app } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      {/* =============================================================================== */}
      {/* SOUND NOTIFICATIONS */}
      {/* =============================================================================== */}
      <BorderedSection title="Sound Notifications">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "800px",
          }}
        >
          <Tooltip
            title='When enabled, NinjaTerm will play a pleasant "ding" sound when the text "pass" is received from the connection, and an incorrect buzzer sound when "fail" is received. This is useful for automated testing or monitoring scenarios where you want audio feedback.'
            placement="top"
            followCursor
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={soundsSettings.playSoundsOnPassFail}
                  onChange={(e) => {
                    soundsSettings.setPlaySoundsOnPassFail(e.target.checked);
                  }}
                  data-testid="play-sounds-on-pass-fail"
                />
              }
              label='Play ding sound on "pass" and incorrect buzzer sound on "fail"'
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>
        </div>
      </BorderedSection>
    </div>
  );
}

export default observer(SoundsSettingsView);
