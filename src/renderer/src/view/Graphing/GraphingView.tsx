import { Button, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Switch, Tooltip, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { observer } from "mobx-react-lite";
import { useState } from "react";

import { App } from "src/model/App";
import { DetectionMode } from "src/model/Graphing/Graphing";
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
import ApplyableTextFieldView from "src/view/Components/ApplyableTextFieldView";

ChartJS.register(LinearScale, PointElement, LineElement, ChartJsTooltip, Legend);

interface Props {
  app: App;
}

/**
 * Separate component for this indicator for performance reasons. It re-renders a lot, and we don't want to re-render the entire graphing view when it does.
 */
const NumBytesInBufferIndicator = observer(({ app }: { app: App }) => (
  <Tooltip
    title="The number of bytes currently in the graphing buffer. This is the number of bytes that have been received but not yet processed. They will be processed (graph information extracted) when the processing trigger is received."
    followCursor
    placement="right"
    {...app.settings.displaySettings.getBasicTooltipConfig()}
  >
    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
      Num. bytes in buffer: {app.graphing.rxDataBuffer.length}
    </div>
  </Tooltip>
));

/**
 * The view for the graphing pane.
 */
export default observer((props: Props) => {
  const { app } = props;
  const [isControlsExpanded, setIsControlsExpanded] = useState(true);

  // Calculate x-axis label based on x variable source
  const xVarSource = app.graphing.xVarSource;
  let xVarLabel: string;
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
        overflow: "hidden", // Prevent outer container from scrolling
      }}
    >
      {/* COLLAPSIBLE CONTROLS SECTION */}
      <div
        style={{
          flexShrink: 0, // Don't shrink the controls
          padding: "10px 20px",
          borderBottom: "1px solid #444",
        }}
      >
        {/* ALWAYS VISIBLE ROW */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "20px",
            minHeight: "48px",
          }}
        >
          {/* ENABLE GRAPHING */}
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

          {/* RESET BUTTON */}
          <Button
            variant="outlined"
            color="warning"
            onClick={() => {
              app.graphing.resetData();
            }}
            sx={{ width: "120px" }}
          >
            Reset
          </Button>

          {/* STATS */}
          <span style={{ color: '#fff', fontSize: '14px' }}>
            Data: {app.graphing.graphData.length} | Plots: {app.graphing.plots.size}
          </span>

          {/* SPACER */}
          <div style={{ flexGrow: 1 }} />

          {/* EXPAND/COLLAPSE BUTTON */}
          <IconButton
            onClick={() => setIsControlsExpanded(!isControlsExpanded)}
            sx={{ color: '#fff' }}
          >
            {isControlsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </div>

        {/* EXPANDED CONTROLS */}
        {isControlsExpanded && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div
              id="row-of-controls"
              style={{
          display: "flex",
          flexDirection: "row",
          gap: "20px",
        }}
      >
        <div id="group-1" className={styles.controlPanel}>
          {/* ============================================================== */}
          {/* DETECTION MODE */}
          {/* ============================================================== */}
          <Tooltip
            title="Choose how graphing data is detected and parsed. Basic Prefix Mode uses processing triggers and y= prefix (legacy). Advanced Cmd Mode uses #PLOT: commands. See the online NinjaTerm manual for more details."
            followCursor
            placement="right"
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <FormControl sx={{ width: 200 }} size="small">
              <InputLabel>Detection Mode</InputLabel>
              <Select
                value={app.graphing.detectionMode}
                label="Detection Mode"
                onChange={(e) => {
                  app.graphing.setDetectionMode(e.target.value as DetectionMode);
                }}
              >
                <MenuItem value={DetectionMode.BASIC_PREFIX}>{DetectionMode.BASIC_PREFIX}</MenuItem>
                <MenuItem value={DetectionMode.ADVANCED_CMD}>{DetectionMode.ADVANCED_CMD}</MenuItem>
              </Select>
            </FormControl>
          </Tooltip>
          {/* ============================================================== */}
          {/* OPEN MANUAL */}
          {/* ============================================================== */}
          <Tooltip
            title="Open the NinjaTerm manual in your browser. This contains information on the graphing system and how to use it."
            followCursor
            placement="right"
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <Button
              variant="outlined"
              color="primary"
              size="small"
              sx={{ width: 200, textTransform: "none" }}
              onClick={async () => {
                try {
                  await window.electronAPI.shell.openExternal("https://ninjaterm.mbedded.ninja/manual");
                } catch (error) {
                  console.error("Failed to open manual:", error);
                }
              }}
            >
              Open Manual
            </Button>
          </Tooltip>
          {/* ============================================================== */}
          {/* PROCESSING TRIGGER */}
          {/* ============================================================== */}
          <Tooltip
            title={
              app.graphing.detectionMode === DetectionMode.ADVANCED_CMD
                ? "The character sequence that triggers processing of accumulated command data. Commands are parsed when this trigger is received."
                : "The character sequence which triggers processing for data points from data that has accumulated in the buffer since the last sequence."
            }
            followCursor
            placement="right"
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <FormControl sx={{ width: 200 }} size="small">
              <InputLabel>Processing Trigger</InputLabel>
              <Select
                value={app.graphing.processingTrigger || 'LF (\\n)'}
                label="Processing Trigger"
                onChange={(e) => {
                  app.graphing.setProcessingTrigger(e.target.value);
                }}
              >
                {app.graphing.processingTriggers.map((processingTrigger: string) => {
                  return (
                    <MenuItem key={processingTrigger} value={processingTrigger}>
                      {processingTrigger}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Tooltip>
          {/* ============================================================== */}
          {/* MAX BUFFER SIZE */}
          {/* ============================================================== */}
          <div>
            <Tooltip
              title={
                app.graphing.detectionMode === DetectionMode.ADVANCED_CMD
                  ? "The max. size the graphing receiving buffer can grow to waiting for command termination (;). The receive buffer is cleared if this size is exceeded. Must be an integer in the range [1-10000]."
                  : "The max. size the graphing receiving buffer can grow to waiting for a processing trigger. The receive buffer is cleared if this size is exceeded. Must be an integer in the range [1-10000]."
              }
              followCursor
              placement="right"
              {...app.settings.displaySettings.getBasicTooltipConfig()}
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
            <NumBytesInBufferIndicator app={app} />
          </div>
          {/* ============================================================== */}
          {/* MAX NUM. DATA POINTS */}
          {/* ============================================================== */}
          <Tooltip
            title="The max. number of previous data points to display per trace. Must be an integer in the range [1-2000]. Increasing this will increase the CPU usage."
            followCursor
            placement="right"
            {...app.settings.displaySettings.getBasicTooltipConfig()}
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
          {/* ============================================================== */}
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
            placement="right"
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <FormControl sx={{ width: 160 }} size="small" disabled={app.graphing.detectionMode === DetectionMode.ADVANCED_CMD}>
              <InputLabel>X Variable Source</InputLabel>
              <Select
                data-testid="x-var-source"
                label="X Variable Source"
                labelId="label-id"
                value={app.graphing.xVarSource || 'Received Time'}
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

          {/* ============================================================== */}
          {/* X VAR PREFIX */}
          {/* ============================================================== */}
          <Tooltip
            title="The string that precedes each x value in the input data stream."
            followCursor
            placement="right"
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <ApplyableTextFieldView
              label="X Variable Prefix"
              name="xVarPrefix" // Must match the name of the field in the graphing settings
              size="small"
              variant="outlined"
              applyableTextField={app.graphing.xVarPrefix}
              sx={{ width: "200px" }}
              disabled={app.graphing.detectionMode === DetectionMode.ADVANCED_CMD || app.graphing.xVarSource !== "In Data"}
            />
          </Tooltip>

          {/* ============================================================== */}
          {/* Y VAR PREFIX */}
          {/* ============================================================== */}
          <Tooltip
            title="The string that precedes each y value in the input data stream."
            followCursor
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <ApplyableTextFieldView
              label="Y Variable Prefix"
              name="yVarPrefix" // Must match the name of the field in the graphing settings
              size="small"
              variant="outlined"
              applyableTextField={app.graphing.yVarPrefix}
              sx={{ width: "200px" }}
              disabled={app.graphing.detectionMode === DetectionMode.ADVANCED_CMD}
            />
          </Tooltip>

          {/* ============================================================== */}
          {/* MULTIPLE VALUES PER BUFFER */}
          {/* ============================================================== */}
          <Tooltip
            title="Enable parsing multiple comma/space-separated values from each buffer instead of just one value per buffer."
            followCursor
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <FormControlLabel
              control={
                <Switch
                  name="multipleValuesPerBuffer"
                  checked={app.graphing.multipleValuesPerBuffer}
                  onChange={(e) => {
                    app.graphing.setMultipleValuesPerBuffer(e.target.checked);
                  }}
                  disabled={app.graphing.detectionMode === DetectionMode.ADVANCED_CMD}
                />
              }
              label="Multiple Values Per Buffer"
            />
          </Tooltip>

          {/* VALUE SEPARATOR */}
          {/* ============================================================== */}
          {app.graphing.multipleValuesPerBuffer && (
            <Tooltip
              title="The character that separates multiple values within a single line."
              followCursor
              {...app.settings.displaySettings.getBasicTooltipConfig()}
            >
              <FormControl sx={{ width: 160 }} size="small" disabled={app.graphing.detectionMode === DetectionMode.ADVANCED_CMD}>
                <InputLabel>Value Separator</InputLabel>
                <Select
                  value={app.graphing.valueSeparator || 'Comma (,)'}
                  label="Value Separator"
                  onChange={(e) => {
                    app.graphing.setValueSeparator(e.target.value);
                  }}
                >
                  {app.graphing.valueSeparators.map((separator: string) => {
                    return (
                      <MenuItem key={separator} value={separator}>
                        {separator}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Tooltip>
          )}

          {/* CUSTOM VALUE SEPARATOR */}
          {/* ============================================================== */}
          {app.graphing.multipleValuesPerBuffer && app.graphing.valueSeparator === 'Custom' && (
            <Tooltip
              title="Custom character(s) to use as value separator."
              followCursor
              {...app.settings.displaySettings.getBasicTooltipConfig()}
            >
              <ApplyableTextFieldView
                label="Custom Separator"
                name="customValueSeparator"
                size="small"
                variant="outlined"
                applyableTextField={app.graphing.customValueSeparator}
                sx={{ width: "150px" }}
                disabled={app.graphing.detectionMode === DetectionMode.ADVANCED_CMD}
              />
            </Tooltip>
          )}

          {/* CLEAR PLOT ON NEW VALUES */}
          {/* ============================================================== */}
          {app.graphing.multipleValuesPerBuffer && (
            <Tooltip
              title="When enabled, the plot is cleared each time new data arrives in a buffer. Useful for displaying snapshots of data rather than accumulating over time."
              followCursor
              {...app.settings.displaySettings.getBasicTooltipConfig()}
            >
              <FormControlLabel
                control={
                  <Switch
                    name="clearPlotOnNewValues"
                    checked={app.graphing.clearPlotOnNewValues}
                    onChange={(e) => {
                      app.graphing.setClearPlotOnNewValues(e.target.checked);
                    }}
                    disabled={app.graphing.detectionMode === DetectionMode.ADVANCED_CMD}
                  />
                }
                label="Clear Plot On New Values"
              />
            </Tooltip>
          )}
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
            placement="right"
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <FormControl sx={{ width: 160 }} size="small">
              <InputLabel>X Axis Range Mode</InputLabel>
              <Select
                data-testid="x-axis-range-mode"
                label="X Axis Range Mode"
                name="xAxisRangeMode"
                value={app.graphing.xAxisRangeMode || 'Auto'}
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
            {...app.settings.displaySettings.getBasicTooltipConfig()}
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
            {...app.settings.displaySettings.getBasicTooltipConfig()}
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
            placement="right"
            {...app.settings.displaySettings.getBasicTooltipConfig()}
          >
            <FormControl sx={{ width: 160 }} size="small">
              <InputLabel>Y Axis Range Mode</InputLabel>
              <Select
                data-testid="y-axis-range-mode"
                label="Y Axis Range Mode"
                value={app.graphing.yAxisRangeMode || 'Auto'}
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
            {...app.settings.displaySettings.getBasicTooltipConfig()}
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
            {...app.settings.displaySettings.getBasicTooltipConfig()}
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

            </div> {/* END CONTROL PANELS ROW */}
          </div>
        )} {/* END EXPANDED CONTROLS */}
      </div> {/* END COLLAPSIBLE CONTROLS SECTION */}

      {/* SCROLLABLE PLOTS SECTION */}
      <div
        style={{
          flexGrow: 1, // Take remaining space
          overflow: "auto", // Allow scrolling
          padding: "0 20px 20px 20px", // Padding for plots
        }}
      >

      {/* LEGACY GRAPH (uses chart.js) - shown when no plots exist */}
      {/* ============================================================== */}
      {app.graphing.plots.size === 0 && (
        <div style={{
          width: "100%",
          height: "500px",
        }}>
          <Scatter
            data={{
              datasets: [
                {
                  label: "Legacy Dataset",
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
      )}

      {/* NEW MULTI-PLOT GRAPHS */}
      {/* ============================================================== */}
      {Array.from(app.graphing.plots.values()).map((plot) => (
        <div key={plot.id} style={{ marginTop: "20px" }}>
          <h3 style={{ color: '#fff', marginBottom: '10px' }}>{plot.title}</h3>
          <div style={{
            width: "100%",
            height: "400px",
          }}>
            <Scatter
              data={{
                datasets: Array.from(plot.traces.values()).map((trace) => ({
                  label: trace.name,
                  data: trace.data.slice(), // Convert MobX observable to JS object
                  animation: false,
                  showLine: true,
                  borderColor: trace.color,
                  borderWidth: 2,
                  pointBackgroundColor: trace.color,
                  pointRadius: 2,
                })),
              }}
              options={{
                maintainAspectRatio: false,
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: plot.xlabel,
                      color: '#fff',
                    },
                    ticks: {
                      color: '#fff',
                    },
                    grid: {
                      color: '#ffffff44',
                    },
                    border: {
                      width: 2,
                      color: '#fff',
                    },
                    min: app.graphing.xAxisRangeMode === "Fixed" ? app.graphing.xAxisRangeMin.appliedValue : undefined,
                    max: app.graphing.xAxisRangeMode === "Fixed" ? app.graphing.xAxisRangeMax.appliedValue : undefined,
                  },
                  y: {
                    title: {
                      display: true,
                      text: plot.ylabel,
                      color: '#fff',
                    },
                    ticks: {
                      color: '#fff',
                    },
                    grid: {
                      color: '#ffffff44',
                    },
                    border: {
                      width: 2,
                      color: '#fff',
                    },
                    min: app.graphing.yAxisRangeMode === "Fixed" ? app.graphing.yAxisRangeMin.appliedValue : undefined,
                    max: app.graphing.yAxisRangeMode === "Fixed" ? app.graphing.yAxisRangeMax.appliedValue : undefined,
                  },
                },
                plugins: {
                  legend: {
                    // display: plot.traces.size > 1, // Show legend when multiple traces
                    display: true, // Always show the legend
                    labels: {
                      color: '#fff'
                    }
                  },
                }
              }}
            />
          </div>
        </div>
      ))}

      </div> {/* END SCROLLABLE PLOTS SECTION */}
    </div>
  );
});
