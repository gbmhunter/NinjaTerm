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

import { App } from "src/App";
import styles from "./GraphingView.module.css";

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartJsTooltip,
  Legend,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import ApplyableTextFieldView from "src/Components/ApplyableTextFieldView";

ChartJS.register(LinearScale, PointElement, LineElement, ChartJsTooltip, Legend);

interface Props {
  app: App;
}

/**
 * The view for the graphing pane.
 */
export default observer((props: Props) => {
  const { app } = props;

  // Calculate x-axis label based on x variable source
  const xVarSource = app.graphing.xVarSource;
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
        width: "100%",
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
        sx={{
          marginLeft: "20px",
        }}
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
                value={app.graphing.dataSeparator}
                label="Data Separator"
                onChange={(e) => {
                  app.graphing.setDataSeparator(e.target.value);
                }}
              >
                {app.graphing.dataSeparators.map((dataSeparator: string) => {
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
            <ApplyableTextFieldView
              label="Max. Buffer Size"
              name="maxBufferSize" // Must match the name of the field in the graphing settings
              size="small"
              variant="outlined"
              applyableTextField={app.graphing.maxBufferSize}
              sx={{ width: "200px" }}
            />
          </Tooltip>

          {/* MAX NUM. DATA POINTS */}
          {/* ============================================================== */}
          <Tooltip
            title="The max. number of previous data points to display. Must be an integer in the range [1-2000]. Increasing this will increase the CPU usage."
            followCursor
            arrow
          >
            <ApplyableTextFieldView
              label="Max. Num. Data Points"
              name="maxNumDataPoints" // Must match the name of the field in the graphing settings
              size="small"
              variant="outlined"
              applyableTextField={app.graphing.maxNumDataPoints}
              sx={{ width: "200px" }}
            />
          </Tooltip>
        </div>

        <div id="group-2" className={styles.controlPanel}>
          {/* X VAR SOURCE */}
          {/* ============================================================== */}
          <Tooltip
            title={
              <div>
                The source of data for the X-axis variable.
                <br />
                Changing this resets the graph.
                <ul>
                  <li>
                    Received Time: Time is seconds that the data points was
                    received at since the graph was last reset. NOTE: Don't rely
                    on this for accurate timing (millisecond or lower range), as
                    timing is dependent on OS buffering and CPU usage. Instead,
                    record the time on the microcontroller, send it along with
                    the y value and use "In Data".
                  </li>
                  <li>
                    Counter: X value is a 0-based counter that increments when a
                    new data point is received.
                  </li>
                  <li>
                    In Data: Extract the x value from the data, just like the
                    y-value.
                  </li>
                </ul>
              </div>
            }
            followCursor
            arrow
            placement="right"
          >
            <FormControl sx={{ width: 160 }} size="small">
              <InputLabel>X Variable Source</InputLabel>
              <Select
                data-testid="x-var-source"
                label="X Variable Source"
                labelId="label-id"
                value={app.graphing.xVarSource}
                onChange={(e) => {
                  app.graphing.setXVarSource(e.target.value);
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

          {/* X VAR PREFIX */}
          {/* ============================================================== */}
          <Tooltip
            title="The string that precedes each x value in the input data stream."
            followCursor
            arrow
            placement="right"
          >
            <ApplyableTextFieldView
              label="X Variable Prefix"
              name="xVarPrefix" // Must match the name of the field in the graphing settings
              size="small"
              variant="outlined"
              applyableTextField={app.graphing.xVarPrefix}
              sx={{ width: "200px" }}
            />
          </Tooltip>

          {/* Y VAR PREFIX */}
          {/* ============================================================== */}
          <Tooltip
            title="The string that precedes each y value in the input data stream."
            followCursor
            arrow
          >
            <ApplyableTextFieldView
              label="Y Variable Prefix"
              name="yVarPrefix" // Must match the name of the field in the graphing settings
              size="small"
              variant="outlined"
              applyableTextField={app.graphing.yVarPrefix}
              sx={{ width: "200px" }}
            />
          </Tooltip>
        </div>

        {/* CONTROL PANEL 3: X-AXIS RANGE */}
        {/* ======================================================================== */}
        <div id="group-3" className={styles.controlPanel}>
          {/* X-AXIS RANGE MODE */}
          {/* ============================================================== */}
          <Tooltip
            title={
              <div>

                <ul>
                  <li>
                    Auto: Limits change to accommodate all data.
                  </li>
                  <li>
                    Fixed: Specify the limits in the below inputs.
                  </li>
                </ul>
              </div>
            }
            followCursor
            arrow
            placement="right"
          >
            <FormControl sx={{ width: 160 }} size="small">
              <InputLabel>X Axis Range Mode</InputLabel>
              <Select
                data-testid="x-axis-range-mode"
                label="X Axis Range Mode"
                name="xAxisRangeMode"
                value={app.graphing.xAxisRangeMode}
                onChange={(e) => {
                  app.graphing.setXAxisRangeMode(e.target.value);
                }}
              >
                {app.graphing.axisRangeModes.map((axisRangeMode) => {
                  return (
                    <MenuItem key={axisRangeMode} value={axisRangeMode}>
                      {axisRangeMode}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Tooltip>

          {/* X-AXIS RANGE MIN */}
          {/* ============================================================== */}
          <Tooltip
            title="Minimum X axis value."
            followCursor
            arrow
          >
            <ApplyableTextFieldView
              label="X-Axis Range Min."
              name="xAxisRangeMin" // Must match the name of the field in the graphing settings
              size="small"
              variant="outlined"
              applyableTextField={app.graphing.xAxisRangeMin}
              sx={{ width: "200px" }}
            />
          </Tooltip>

          {/* X-AXIS RANGE MAX */}
          {/* ============================================================== */}
          <Tooltip
            title="Maximum X axis value."
            followCursor
            arrow
          >
            <ApplyableTextFieldView
              label="X-Axis Range Max."
              name="xAxisRangeMax" // Must match the name of the field in the graphing settings
              size="small"
              variant="outlined"
              applyableTextField={app.graphing.xAxisRangeMax}
              sx={{ width: "200px" }}
            />
          </Tooltip>

          {/* SET RANGE TO DATA BUTTON */}
          {/* ============================================================== */}
          <Button
            variant="outlined"
            color="success"
            onClick={() => {
              app.graphing.updateXRangeFromData();
            }}
          >
            Update X Range From Data
          </Button>

        </div> {/* CONTROL PANEL 3: X AXIS LIMITS */}

        {/* CONTROL PANEL 4: Y-AXIS RANGE */}
        {/* ======================================================================== */}
        <div id="group-4" className={styles.controlPanel}>
          {/* Y-AXIS RANGE MODE */}
          {/* ============================================================== */}
          <Tooltip
            title={
              <div>

                <ul>
                  <li>
                    Auto: Limits change to accommodate all data.
                  </li>
                  <li>
                    Fixed: Specify the limits in the below inputs.
                  </li>
                </ul>
              </div>
            }
            followCursor
            arrow
            placement="right"
          >
            <FormControl sx={{ width: 160 }} size="small">
              <InputLabel>Y Axis Range Mode</InputLabel>
              <Select
                data-testid="y-axis-range-mode"
                label="Y Axis Range Mode"
                value={app.graphing.yAxisRangeMode}
                onChange={(e) => {
                  app.graphing.setYAxisRangeMode(e.target.value);
                }}
              >
                {app.graphing.axisRangeModes.map((axisRangeMode) => {
                  return (
                    <MenuItem key={axisRangeMode} value={axisRangeMode}>
                      {axisRangeMode}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Tooltip>

          {/* Y-AXIS RANGE MIN */}
          {/* ============================================================== */}
          <Tooltip
            title="Minimum Y axis value."
            followCursor
            arrow
          >
            <ApplyableTextFieldView
              label="Y-Axis Range Min."
              size="small"
              variant="outlined"
              applyableTextField={app.graphing.yAxisRangeMin}
              sx={{ width: "200px" }}
            />
          </Tooltip>

          {/* Y-AXIS RANGE MAX */}
          {/* ============================================================== */}
          <Tooltip
            title="Maximum Y axis value."
            followCursor
            arrow
          >
            <ApplyableTextFieldView
              label="Y-Axis Range Max."
              size="small"
              variant="outlined"
              applyableTextField={app.graphing.yAxisRangeMax}
              sx={{ width: "200px" }}
            />
          </Tooltip>

          {/* SET RANGE TO DATA BUTTON */}
          {/* ============================================================== */}
          <Button
            variant="outlined"
            color="success"
            onClick={() => {
              app.graphing.updateYRangeFromData();
            }}
          >
            Update Y Range From Data
          </Button>

        </div> {/* CONTROL PANEL 4: Y AXIS LIMITS */}

      </div>

      {/* BUTTON ROW */}
      {/* ============================================================== */}
      <div
        aria-label="row-of-buttons"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {/* RESET BUTTON */}
        {/* ============================================================== */}
        <Button
          variant="outlined"
          color="warning"
          onClick={() => {
            app.graphing.resetData();
          }}
          sx={{ width: "150px" }}
        >
          Reset
        </Button>

        <span>Num. data points: {app.graphing.graphData.length}</span>
      </div> {/* BUTTON ROW */}

      {/* GRAPH (uses chart.js) */}
      {/* ============================================================== */}

      {/* This sets the height of the graph */}
      <div style={{
        width: "100%",
        height: "500px",
        // backgroundColor: '#111'
      }}>
        <Scatter
          data={{
            datasets: [
              {
                label: "A dataset",
                data: app.graphing.graphData.slice(), // Convert MobX observable to JS object
                animation: false,
                showLine: true, // Scatter plots by default don't show the line
                borderColor: "#0af20e", // Line colour
                borderWidth: 1, // Line width
                pointBackgroundColor: "#0af20e", // Point colour
              },
            ],
          }}
          options={{
            maintainAspectRatio: false, // This is needed to chart to assume size of parent div
            scales: {
              x: {
                title: {
                  display: true,
                  text: xVarLabel,
                },
                ticks: {
                  color: '#fff', // Color of the x-axis labels
                },
                grid: {
                  color: '#ffffff44', // Color of the x-axis grid lines
                },
                border: {
                  width: 2,
                  color: '#fff', // <-------------- Color of the x-axis
                },
                min: app.graphing.xAxisRangeMode === "Fixed" ? app.graphing.xAxisRangeMin.appliedValue : undefined,
                max: app.graphing.xAxisRangeMode === "Fixed" ? app.graphing.xAxisRangeMax.appliedValue : undefined,
              },
              y: {
                title: {
                  display: true,
                  text: yVarLabel,
                },
                ticks: {
                  color: '#fff', // Color of the x-axis labels
                },
                grid: {
                  color: '#ffffff44', // Color of the x-axis grid lines
                },
                border: {
                  width: 2,
                  color: '#fff', // <-------------- Color of the x-axis
                },
                min: app.graphing.yAxisRangeMode === "Fixed" ? app.graphing.yAxisRangeMin.appliedValue : undefined,
                max: app.graphing.yAxisRangeMode === "Fixed" ? app.graphing.yAxisRangeMax.appliedValue : undefined,
              },
            },
            plugins: {
              legend: {
                display: false, // Hide the legend
              },
            }
          }}
        />
      </div>
    </div>
  );
});
