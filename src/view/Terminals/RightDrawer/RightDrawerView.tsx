import { observer } from "mobx-react-lite";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

import { App } from "src/model/App";
import MacroView from "./MacroRowView";
import MacroSettingsModalView from "./MacroSettingsModalView";
import { FormControl, FormControlLabel, InputAdornment, InputLabel, MenuItem, Select, Switch, Tooltip } from "@mui/material";
import ApplyableTextFieldView from "src/view/Components/ApplyableTextFieldView";
import { DataViewConfiguration, dataViewConfigEnumToDisplayName } from "src/model/Settings/DisplaySettings/DisplaySettings";

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;

  // Create macro rows
  const macroRows = app.terminals.rightDrawer.macroController.macrosArray.map((macro, index) => {
    return <MacroView key={index} app={app} macroController={app.terminals.rightDrawer.macroController} macro={macro} />;
  });

  return (
    <ResizableBox
      className="box"
      width={400} // Default width, this can be changed by the user resizing
      resizeHandles={["w"]}
      axis="x"
      style={{ padding: "0px 0px 0px 10px", margin: "0px 0px 10px 0px", fontSize: "12px" }}
      handle={
        <div
          style={{
            height: "100%",
            width: "10px", // This determines how easy it is to click on the resizable element
            // backgroundColor: "#DC3545",
            position: "absolute",
            left: 0,
            top: 0,
            cursor: "ew-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderLeft: "1px solid #505050", // Same border color as used on the left-hand nav menu
          }}
        ></div>
      }
    >
      {/* ResizableBox requires a single child component */}
      <div className="resizable-child-container" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* ======================================================= */}
        {/* DATA VIEW CONFIGURATION */}
        {/* ======================================================= */}
        <Tooltip
          title={
            <div>
              Controls how to display the TX and RX data. Different use cases require different view configurations.
              <ul>
                <li>Single terminal: TX and RX data is combined in the same pane. Useful for terminal style applications when escape codes are used.</li>
                <li>
                  Separate TX/RX terminals: TX and RX data are kept in separate panes. Useful for when you have a lot of incoming basic RX data and what to still see the data you
                  are sending.
                </li>
              </ul>
            </div>
          }
          placement="left"
        >
          <FormControl size="small" sx={{ minWidth: "210px", marginBottom: '10px' }}>
            <InputLabel>Data View Configuration</InputLabel>
            <Select
              name="dataViewConfiguration"
              value={app.settings.displaySettings.dataViewConfiguration}
              onChange={(e) => {
                app.settings.displaySettings.setDataViewConfiguration(Number(e.target.value));
              }}
              sx={{ fontSize: "0.8rem" }}
            >
              {Object.keys(DataViewConfiguration)
                .filter((key) => !Number.isNaN(Number(key)))
                .map((key) => {
                  return (
                    <MenuItem key={key} value={key}>
                      {dataViewConfigEnumToDisplayName[key]}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Tooltip>
        {/* =============================================================================== */}
        {/* CHAR SIZE */}
        {/* =============================================================================== */}
        <Tooltip title="The font size (in pixels) of characters displayed in the terminal." followCursor arrow>
          <ApplyableTextFieldView
            id="outlined-basic"
            name="charSizePx"
            label="Char Size"
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: <InputAdornment position="start">px</InputAdornment>,
            }}
            applyableTextField={app.settings.displaySettings.charSizePx}
            sx={{ width: "80px" }}
          />
        </Tooltip>
        {/* ============================ LOCAL TX ECHO SWITCH =========================== */}
        <FormControlLabel
          control={
            <Switch
              name="localTxEcho"
              checked={app.settings.rxSettings.config.localTxEcho}
              onChange={(e) => {
                app.settings.rxSettings.setLocalTxEcho(e.target.checked);
              }}
            />
          }
          label="Local TX Echo"
        />
        <div>Macros</div>
        <div className="macro-rows-container" style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {macroRows}
        </div>
        <MacroSettingsModalView app={app} macroController={app.terminals.rightDrawer.macroController} />
      </div>
    </ResizableBox>
  );
});
