import {
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
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";

import { App } from "model/App";

interface Props {
  app: App;
}

export default observer((props: Props) => {
  const { app } = props;

  return (
    <div
      style={{
        flexGrow: 1,
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
            value={app.graphing.selDataSeparator}
            label="Data Separator"
            onChange={(e) => {
              app.graphing.setSelDataSeparator(e.target.value);
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
            value={app.graphing.selXVarSource}
            onChange={(e) => {
              app.graphing.setSelXVarSource(e.target.value);
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
          size="small"
          variant="outlined"
          value={app.graphing.yVarPrefix}
          onChange={(e) => {
            app.graphing.setYVarPrefix(e.target.value);
          }}
          sx={{ width: "200px" }}
        />
      </Tooltip>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          {/* <Line type="monotone" dataKey="uv" stroke="#8884d8" /> */}
          <Scatter
            name="A school"
            data={app.graphing.graphData.slice()}
            fill="#8884d8"
            line
            shape="cross"
          />
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
          <XAxis type="number" dataKey="x" name="stature" unit="cm" />
          <YAxis type="number" dataKey="y" name="weight" unit="kg" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
});
