import {
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";

import { App } from "model/App";
import styles from "./GraphingView.module.css";

interface Props {
  app: App;
}

/**
 * The view for the graphing pane.
 */
export default observer((props: Props) => {
  const { app } = props;

  // Calculate x-axis label based on x variable source
  const xVarSource = app.graphing.settings.xVarSource.appliedValue;
  let xVarLabel = "";
  if (xVarSource === "Received Time") {
    xVarLabel = "Time [s]";
  } else if (xVarSource === "Counter") {
    xVarLabel = "Counts";
  } else if (xVarSource === "In Data") {
    xVarLabel = "Custom";
  } else {
    throw new Error("Unsupported X variable source: " + xVarSource);
  }
  const yVarLabel = "Custom";

  // Wrap the graph in a

  return (
    <div
      style={{
        flexGrow: 1, // Make sure it fills the available space, to keep the app header and footer at the top and bottom of the window
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* ENABLE GRAPHING */}
      {/* ============================================================== */}
      <FormControlLabel
        control={
          <Switch
            name="enableGraphing"
            checked={app.graphing.graphingEnabled}
            onChange={(e) => {
              app.graphing.setGraphingEnabled(e.target.checked);
            }}
          />
        }
        label="Enable Graphing"
      />

      <div
        id="row-of-controls"
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "20px",
        }}
      >
        <div id="group-1" className={styles.controlPanel}>
          {/* DATA SEPARATOR */}
          {/* ============================================================== */}
          <Tooltip
            title="The character that separates data points in the input data stream."
            followCursor
            arrow
          >
            <FormControl sx={{ width: 160 }} size="small">
              <InputLabel>Data Separator</InputLabel>
              <Select
                value={app.graphing.settings.dataSeparator.dispValue}
                label="Data Separator"
                name="dataSeparator" // Must match the name of the field in the graphing settings
                onChange={(e) => {
                  app.graphing.setSetting(e.target.name, e.target.value);
                }}
              >
                {app.graphing.dataSeparators.map((dataSeparator) => {
                  return (
                    <MenuItem key={dataSeparator} value={dataSeparator}>
                      {dataSeparator}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Tooltip>

          {/* MAX BUFFER SIZE */}
          {/* ============================================================== */}
          <Tooltip
            title="The max. size the graphing receiving buffer can grow to waiting for a data separator. The receive buffer is cleared if this size is exceeded. Must be an integer in the range [1-1000]."
            followCursor
            arrow
          >
            <TextField
              label="Max. Buffer Size"
              name="maxBufferSize" // Must match the name of the field in the graphing settings
              size="small"
              variant="outlined"
              value={app.graphing.settings.maxBufferSize.dispValue}
              onChange={(e) => {
                app.graphing.setSetting(e.target.name, e.target.value);
              }}
              error={app.graphing.settings.maxBufferSize.hasError}
              helperText={app.graphing.settings.maxBufferSize.errorMsg}
              sx={{ width: "200px" }}
            />
          </Tooltip>

          {/* MAX NUM. DATA POINTS */}
          {/* ============================================================== */}
          <Tooltip
            title="The max. number of previous data points to display. Must be an integer in the range [1-1000]."
            followCursor
            arrow
          >
            <TextField
              label="Max. Num. Data Points"
              name="maxNumDataPoints" // Must match the name of the field in the graphing settings
              size="small"
              variant="outlined"
              value={app.graphing.settings.maxNumDataPoints.dispValue}
              onChange={(e) => {
                app.graphing.setSetting(e.target.name, e.target.value);
              }}
              error={app.graphing.settings.maxNumDataPoints.hasError}
              helperText={app.graphing.settings.maxNumDataPoints.errorMsg}
              sx={{ width: "200px" }}
            />
          </Tooltip>
        </div>

        <div id="group-2" className={styles.controlPanel}>
          {/* X VAR SOURCE */}
          {/* ============================================================== */}
          <Tooltip
            title="The source of data for the X-axis variable."
            followCursor
            arrow
          >
            <FormControl sx={{ width: 160 }} size="small">
              <InputLabel>X Variable Source</InputLabel>
              <Select
                name="xVarSource"
                value={app.graphing.settings.xVarSource.dispValue}
                onChange={(e) => {
                  app.graphing.setSetting(e.target.name, e.target.value);
                }}
              >
                {app.graphing.xVarSources.map((xVarSource) => {
                  return (
                    <MenuItem key={xVarSource} value={xVarSource}>
                      {xVarSource}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Tooltip>

          {/* Y VAR PREFIX */}
          {/* ============================================================== */}
          <Tooltip
            title="The string that precedes each y value in the input data stream."
            followCursor
            arrow
          >
            <TextField
              label="Y Variable Prefix"
              name="yVarPrefix" // Must match the name of the field in the graphing settings
              size="small"
              variant="outlined"
              value={app.graphing.settings.yVarPrefix.dispValue}
              onChange={(e) => {
                app.graphing.setSetting(e.target.name, e.target.value);
              }}
              error={app.graphing.settings.yVarPrefix.hasError}
              helperText={app.graphing.settings.yVarPrefix.errorMsg}
              sx={{ width: "200px" }}
            />
          </Tooltip>
        </div>
      </div>

      {/* APPLY BUTTON */}
      {/* ============================================================== */}
      <Button
        variant="contained"
        color="success"
        disabled={!app.graphing.isApplyable}
        onClick={() => {
          app.graphing.applyChanges();
        }}
        sx={{ width: "150px" }}
      >
        Apply
      </Button>

      {/* GRAPH (uses recharts) */}
      {/* ============================================================== */}
      {/* ResponsiveContainer was causing problems with tests, but
      fixed with ResizeObserver mocked */}
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <Scatter
            name="A school"
            data={app.graphing.graphData.slice()}
            fill="#00fc08" // Bright green
            line
            // shape="cross"
          />
          <CartesianGrid stroke="#555" strokeDasharray="5 5" />
          <XAxis
            type="number"
            dataKey="x"
            name="stature"
            stroke="#ccc"
            label={{ value: xVarLabel, position: "insideBottom", dy: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="weight"
            stroke="#ccc"
            label={{
              value: yVarLabel,
              position: "insideLeft",
              angle: -90,
              dx: 20,
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
});
