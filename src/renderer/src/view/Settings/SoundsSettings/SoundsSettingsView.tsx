import { Checkbox, FormControlLabel, Tooltip, Button } from "@mui/material";
import { observer } from "mobx-react-lite";

import { App } from "src/model/App";
import BorderedSection from "src/view/Components/BorderedSection";

interface Props {
  app: App;
}

function SoundsSettingsView(props: Props) {
  const { app } = props;
  const soundsSettings = app.settings.soundsSettings

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      {/* =============================================================================== */}
      {/* SOUND NOTIFICATIONS */}
      {/* =============================================================================== */}
      <BorderedSection title="Received Text Notifications">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "800px",
          }}
        >
          <Tooltip
            {...app.settings.displaySettings.getBasicTooltipConfig()}
            title='When enabled, NinjaTerm will play a pleasant "ding" sound when the text "pass" is received from the serial connection, and an incorrect buzzer sound when "fail" is received. This is useful for automated testing or monitoring scenarios where you want audio feedback. Both strings are case-insensitive (i.e. "PASS" and "pass" will both trigger the "pass" sound).'
            placement="top"
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
              label='Play ding sound on "pass" and incorrect buzzer sound on "fail" (case-insensitive)'
              sx={{ marginBottom: "10px" }}
            />
          </Tooltip>

          {/* Test Sound Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <Button
              variant="outlined"
              onClick={() => app.soundPlayer.playDing()}
              data-testid="test-pass-sound"
            >
              Test "Pass" Sound
            </Button>
            <Button
              variant="outlined"
              onClick={() => app.soundPlayer.playBuzzer()}
              data-testid="test-fail-sound"
            >
              Test "Fail" Sound
            </Button>
          </div>
        </div>
      </BorderedSection>
    </div>
  );
}

export default observer(SoundsSettingsView);
