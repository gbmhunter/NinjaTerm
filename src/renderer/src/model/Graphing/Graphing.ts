import { makeAutoObservable } from 'mobx';
import Validator from 'validatorjs';
import { z } from 'zod';

import SnackbarController from 'src/model/SnackbarController/SnackbarController';
import { ApplyableTextField, ApplyableNumberField } from 'src/view/Components/ApplyableTextField';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';

class Point {
  x: number = 0;
  y: number = 0;
}

type XAxisType = 'data' | 'counter' | 'timestamp';

export enum DetectionMode {
  BASIC_PREFIX = 'Basic Prefix Mode',
  ADVANCED_CMD = 'Advanced Cmd Mode'
}

/**
 * Represents a single trace (data series, e.g. x and y values) for a plot. One plot
 * can contain multiple traces.
 */
class PlotTrace {
  id: string;
  name: string;
  color: string;
  xType: XAxisType;
  data: Point[] = [];
  counter: number = 0;

  constructor(id: string, name: string, color: string, xType: XAxisType) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.xType = xType;
    makeAutoObservable(this);
  }
}

/**
 * Represents a single plot. A plot can contain multiple traces. Multiple plots can be
 * shown in the UI, they are stacked vertically.
 */
class Plot {
  id: string;
  title: string;

  /**
   * Contains all traces for this plot. The key is the trace ID. Javascript keeps entries
   * in insertion order, so the first trace added will be the first in the map.
   */
  traces: Map<string, PlotTrace> = new Map();

  constructor(id: string, title: string) {
    this.id = id;
    this.title = title;
    makeAutoObservable(this);
  }
}

class Graphing {

  snackbar: SnackbarController;
  appDataManager: AppDataManager;

  /**
   * Whether or not graphing is enabled. If true, RX data will be parsed for
   * graphing data.
   */
  graphingEnabled = false;

  graphData: Point[] = [];  // Legacy single plot data

  /**
   * Contains all the plots that are being displayed. The key is the plot ID. Javascript
   * keeps entries in insertion order, so they will be shown in order of creation.
   */
  plots: Map<string, Plot> = new Map();

  processingTriggers = [
    'LF (\\n)',
    'CR (\\r)',
    'Custom',
  ]

  processingTrigger = this.processingTriggers[0];

  /**
   * The detection mode determines how graphing data is parsed.
   * Basic Prefix Mode: Uses processing triggers and y= prefix (legacy)
   * Advanced Cmd Mode: Uses #PLOT: commands with ; termination
   */
  detectionMode = DetectionMode.BASIC_PREFIX;

  /**
     * The maximum size of the receive buffer before it is cleared.
     */
  maxBufferSize = new ApplyableNumberField('1000', z.coerce.number().int().min(1).max(10000));

  maxNumDataPoints = new ApplyableNumberField('500', z.coerce.number().int().min(1).max(2000));

  xVarSources = [
    'Received Time', // Received time since last reset
    'Counter', // Monotonically increasing counter
    'In Data', // X values extracted from data, just like y values
  ]

  xVarSource = this.xVarSources[0]

  xVarPrefix = new ApplyableTextField('x=', z.string());

  yVarPrefix = new ApplyableTextField('y=', z.string());

  /**
   * Whether multiple values per buffer are enabled
   */
  multipleValuesPerBuffer = false;

  valueSeparators = [
    'Comma (,)',
    'Space ( )',
    'Custom',
  ]

  valueSeparator = this.valueSeparators[0];

  customValueSeparator = new ApplyableTextField(',', z.string());


  /**
   * Whether to clear existing plot data when new values arrive.
   * Only applicable when multipleValuesPerBuffer is enabled.
   */
  clearPlotOnNewValues = true;

  axisRangeModes = [
    'Auto',
    'Fixed',
  ]

  xAxisRangeMode = this.axisRangeModes[0];

  xAxisRangeMin = new ApplyableNumberField('0', z.coerce.number());

  xAxisRangeMax = new ApplyableNumberField('100', z.coerce.number().refine(
    (val) => val > this.xAxisRangeMin.appliedValue,
    { message: "Maximum must be greater than minimum" }
  ));

  yAxisRangeMode = this.axisRangeModes[0];

  yAxisRangeMin = new ApplyableNumberField('0', z.coerce.number());

  yAxisRangeMax = new ApplyableNumberField('100', z.coerce.number().refine(
    (val) => val > this.yAxisRangeMin.appliedValue,
    { message: "Maximum must be greater than minimum" }
  ));

  xVarUnit = 's';

  /**
   * Holds data that has been received but no data separator has been found yet.
   */
  rxDataBuffer: string = '';

  /**
   * Tracks the time when the reset button was pressed. This is used to calculate
   * the X value for the graph when in "Received Time" mode.
   */
  timeAtReset_ms: number = Date.now();

  isApplyable = false;

  constructor(snackbar: SnackbarController, appDataManager: AppDataManager) {
    this.snackbar = snackbar;
    this.appDataManager = appDataManager;

    // Set up callbacks to save config when ApplyableTextField/ApplyableNumberField values change
    this.maxBufferSize.setOnApplyChanged(() => this._saveConfig());
    this.maxNumDataPoints.setOnApplyChanged(() => this._saveConfig());
    this.xVarPrefix.setOnApplyChanged(() => this._saveConfig());
    this.yVarPrefix.setOnApplyChanged(() => this._saveConfig());
    this.customValueSeparator.setOnApplyChanged(() => this._saveConfig());
    this.xAxisRangeMin.setOnApplyChanged(() => this._onMinRangeChanged());
    this.xAxisRangeMax.setOnApplyChanged(() => this._saveConfig());
    this.yAxisRangeMin.setOnApplyChanged(() => this._onMinRangeChanged());
    this.yAxisRangeMax.setOnApplyChanged(() => this._saveConfig());

    // Load initial settings
    this._loadConfig();

    // Register callback to load settings when profile changes
    this.appDataManager.registerOnProfileLoad(this._loadConfig);

    // this.graphData.push({ x: 0, y: 0 });
    // this.graphData.push({ x: 10, y: 10 });
    makeAutoObservable(this);
  }

  setGraphingEnabled = (graphingEnabled: boolean) => {
    this.graphingEnabled = graphingEnabled;
    this._saveConfig();
  }

  setProcessingTrigger = (value: string) => {
    this.processingTrigger = value;
    this._saveConfig();
  }

  setXVarSource = (value: string) => {
    this.xVarSource = value;
    this._saveConfig();
  }

  setXAxisRangeMode = (value: string) => {
    this.xAxisRangeMode = value;
    this._saveConfig();
  }

  setYAxisRangeMode = (value: string) => {
    this.yAxisRangeMode = value;
    this._saveConfig();
  }

  setMultipleValuesPerBuffer = (value: boolean) => {
    this.multipleValuesPerBuffer = value;
    this._saveConfig();
  }

  setValueSeparator = (value: string) => {
    this.valueSeparator = value;
    this._saveConfig();
  }


  setClearPlotOnNewValues = (value: boolean) => {
    this.clearPlotOnNewValues = value;
    this._saveConfig();
  }

  /**
   * Returns the character that should be used as the processing trigger
   * based on the current processingTrigger setting.
   */
  getTriggerChar = (): string => {
    switch (this.processingTrigger) {
      case 'LF (\\n)':
        return '\n';
      case 'CR (\\r)':
        return '\r';
      default:
        return '\n'; // Default to LF
    }
  }

  setDetectionMode = (mode: DetectionMode) => {
    this.detectionMode = mode;
    this._saveConfig();
  }

  /**
   * Takes incoming streamed data and extracts any data points out of it.
   *
   * Does nothing if graphing is not enabled.
   *
   * @param data
   * @returns
   */
  parseData = (data: Uint8Array) => {
    // console.log('parseData() called.');
    if (!this.graphingEnabled) {
      return;
    }

    for (let i = 0; i < data.length; i++) {
      // Convert byte into a character and add to receive buffer
      let char = String.fromCharCode(data[i]);
      // console.log('char: ' + char.charCodeAt(0));
      this.rxDataBuffer += char;
      // console.log('rxDataBuffer: ' + this.rxDataBuffer);

      // Both modes use processing trigger to trigger processing
      const triggerChar = this.getTriggerChar();
      if (char === triggerChar) {
        if (this.detectionMode === DetectionMode.ADVANCED_CMD) {
          // Advanced command mode: only process plot commands
          if (this.rxDataBuffer.includes('#PLOT:')) {
            this.parsePlotCommands(this.rxDataBuffer);
          }
        } else {
          // Basic prefix mode: support both plot commands and legacy parsing
          if (this.rxDataBuffer.includes('#PLOT:')) {
            this.parsePlotCommands(this.rxDataBuffer);
          } else {
            // Legacy parsing for backward compatibility
            const yVarPrefixIdx = this.rxDataBuffer.indexOf(this.yVarPrefix.appliedValue);
            if (yVarPrefixIdx !== -1) {
              if (this.multipleValuesPerBuffer) {
                // Extract multiple values per buffer
                this.parseMultipleValues();
              } else {
                // Single value per buffer (original behavior)
                this.parseSingleValue();
              }
            }
          }
        }
        // Clear the buffer after parsing
        this.rxDataBuffer = '';
      }

      if (this.rxDataBuffer.length > this.maxBufferSize.appliedValue) {
        // Buffer is getting too big, so clear it
        this.rxDataBuffer = '';
        this.snackbar.sendToSnackbar(
          'Graphing receive buffer overflowed. Clearing buffer.',
          'warning');
      }

    }

    // console.log('graphData: ' + JSON.stringify(this.graphData));
  }

  /**
   * Parse a single value from the buffer (original behavior)
   */
  parseSingleValue = () => {
    // Get the Y value. Grab the entire line after the Y variable prefix,
    // and call parseFloat on it. This will stop at the first non-numeric
    // character (but will allow things like "."), which is what we want.
    const yVarPrefixIdx = this.rxDataBuffer.indexOf(this.yVarPrefix.appliedValue);
    let yValStr = '';
    for (let j = yVarPrefixIdx + this.yVarPrefix.appliedValue.length; j < this.rxDataBuffer.length; j++) {
      yValStr += this.rxDataBuffer[j];
    }
    const yVal = parseFloat(yValStr);
    // Bail if y value is NaN
    if (isNaN(yVal)) {
      this.snackbar.sendToSnackbar(
        'Graphing received NaN value for y-axis. Skipping data point. rxDataBuffer: ' + this.rxDataBuffer,
        'warning');
      return;
    }

    // Get the X value
    let xVal;
    if (this.xVarSource === 'Received Time') {
      // Get the time since the last reset in ms, then convert to s
      xVal = (Date.now() - this.timeAtReset_ms)/1000.0;
    } else if (this.xVarSource === 'Counter') {
      // Use the number of data points as the X value
      xVal = this.graphData.length;
    } else if (this.xVarSource === 'In Data') {
      const xVarPrefixIdx = this.rxDataBuffer.indexOf(this.xVarPrefix.appliedValue);
      if (xVarPrefixIdx === -1) {
        // This line does not contain the X variable prefix, so skip it
        return;
      }
      // Get the X value. Grab the entire line after the X variable prefix,
      // and call parseFloat on it. This will stop at the first non-numeric
      // character (but will allow things like "."), which is what we want.
      let xValStr = '';
      for (let j = xVarPrefixIdx + this.xVarPrefix.appliedValue.length; j < this.rxDataBuffer.length; j++) {
        xValStr += this.rxDataBuffer[j];
      }
      xVal = parseFloat(xValStr);
      // Bail if x value is NaN
      if (isNaN(xVal)) {
        this.snackbar.sendToSnackbar(
          'Graphing received NaN value for x-axis. Skipping data point. rxDataBuffer: ' + this.rxDataBuffer,
          'warning');
        return;
      }
    } else {
      throw new Error('Unsupported X variable source: ' + this.xVarSource);
    }

    // If we get here both x and y values should be valid
    this.addDataPoint(xVal, yVal);
  }

  /**
   * Parse multiple values from the buffer
   */
  parseMultipleValues = () => {
    // Clear existing data if the toggle is enabled
    if (this.clearPlotOnNewValues) {
      this.graphData = [];
    }

    const yVarPrefixIdx = this.rxDataBuffer.indexOf(this.yVarPrefix.appliedValue);

    // Get the data string after the Y variable prefix
    let dataStr = '';
    for (let j = yVarPrefixIdx + this.yVarPrefix.appliedValue.length; j < this.rxDataBuffer.length; j++) {
      dataStr += this.rxDataBuffer[j];
    }

    // Determine the separator to use
    let separator = ',';
    if (this.valueSeparator === 'Comma (,)') {
      separator = ',';
    } else if (this.valueSeparator === 'Space ( )') {
      separator = ' ';
    } else if (this.valueSeparator === 'Custom') {
      separator = this.customValueSeparator.appliedValue;
    }

    // Split the data string and parse Y values
    const yValStrings = dataStr.split(separator).map(s => s.trim()).filter(s => s.length > 0);
    const yValues: number[] = [];

    for (const yValStr of yValStrings) {
      const yVal = parseFloat(yValStr);
      if (!isNaN(yVal)) {
        yValues.push(yVal);
      }
    }

    if (yValues.length === 0) {
      this.snackbar.sendToSnackbar(
        'Graphing: No valid Y values found in line. rxDataBuffer: ' + this.rxDataBuffer,
        'warning');
      return;
    }

    // Handle X values based on xVarSource
    const xValues: number[] = [];
    const currentTime = (Date.now() - this.timeAtReset_ms)/1000.0;

    if (this.xVarSource === 'Counter') {
      // Use incremental counter for each value
      for (let i = 0; i < yValues.length; i++) {
        xValues.push(this.graphData.length + i);
      }
    } else if (this.xVarSource === 'Received Time') {
      // Use same timestamp for all values in the line
      for (let i = 0; i < yValues.length; i++) {
        xValues.push(currentTime);
      }
    } else if (this.xVarSource === 'In Data') {
      // Parse X values from data similar to Y values
      const xVarPrefixIdx = this.rxDataBuffer.indexOf(this.xVarPrefix.appliedValue);
      if (xVarPrefixIdx === -1) {
        // No X data found, fall back to counter
        for (let i = 0; i < yValues.length; i++) {
          xValues.push(this.graphData.length + i);
        }
      } else {
        // Get X data string
        let xDataStr = '';
        for (let j = xVarPrefixIdx + this.xVarPrefix.appliedValue.length; j < this.rxDataBuffer.length; j++) {
          xDataStr += this.rxDataBuffer[j];
        }

        // Split X data
        const xValStrings = xDataStr.split(separator).map(s => s.trim()).filter(s => s.length > 0);

        for (let i = 0; i < yValues.length; i++) {
          if (i < xValStrings.length) {
            const xVal = parseFloat(xValStrings[i]);
            xValues.push(isNaN(xVal) ? this.graphData.length + i : xVal);
          } else {
            // If not enough X values, use counter
            xValues.push(this.graphData.length + i);
          }
        }
      }
    } else {
      throw new Error('Unsupported X variable source: ' + this.xVarSource);
    }

    // Add all data points
    for (let i = 0; i < yValues.length; i++) {
      this.addDataPoint(xValues[i], yValues[i]);
    }
  }

  addDataPoint = (x: number, y: number) => {
    // If this is the first point, switch from fixed domain (so
    // graph is shown when there is no data) to auto
    if (this.graphData.length === 0) {
      // this.xDomain = ['auto', 'auto'];
      // this.yDomain = ['auto', 'auto'];
    }
    this.graphData.push({ x: x, y: y });
    this.limitNumDataPoints();
  }

  limitNumDataPoints = () => {
    // Check if we have exceeded the max number of data points,
    // and if so, remove the oldest point
    while (this.graphData.length > this.maxNumDataPoints.appliedValue) {
      this.graphData.shift();
    }
  }

  /**
   * Clears all existing data points and sets the start time back to 0.
   */
  resetData = () => {
    this.graphData = [];
    this.resetAllPlots();
    this.timeAtReset_ms = Date.now();
  }

  resetAllPlots = () => {
    for (const plot of this.plots.values()) {
      for (const trace of plot.traces.values()) {
        trace.data = [];
        trace.counter = 0;
      }
    }
  }

  updateXRangeFromData = () => {
    if (this.graphData.length === 0) {
      return;
    }
    const xMin = Math.min(...this.graphData.map(point => point.x));
    const xMax = Math.max(...this.graphData.map(point => point.x));
    this.xAxisRangeMin.dispValue = xMin.toString();
    this.xAxisRangeMax.dispValue = xMax.toString();

    this.xAxisRangeMin.apply();
    this.xAxisRangeMax.apply();
  }

  updateYRangeFromData = () => {
    if (this.graphData.length === 0) {
      return;
    }
    const yMin = Math.min(...this.graphData.map(point => point.y));
    const yMax = Math.max(...this.graphData.map(point => point.y));
    this.yAxisRangeMin.dispValue = yMin.toString();
    this.yAxisRangeMax.dispValue = yMax.toString();

    this.yAxisRangeMin.apply();
    this.yAxisRangeMax.apply();
  }

  parsePlotCommands = (buffer: string) => {
    try {
      // Extract all #PLOT: commands from the buffer
      const commands = this.extractPlotCommands(buffer);

      // Process each command in order
      for (const command of commands) {
        this.parsePlotCommand(command);
      }
    } catch (error) {
      this.snackbar.sendToSnackbar(`Error parsing plot commands: ${error}`, 'error');
    }
  }

  extractPlotCommands = (buffer: string): string[] => {
    const commands: string[] = [];
    let startIndex = 0;

    while (true) {
      // Find the next #PLOT: command
      const plotIndex = buffer.indexOf('#PLOT:', startIndex);
      if (plotIndex === -1) {
        break; // No more commands
      }

      // Find the end of this command (must end with ;)
      const semicolonIndex = buffer.indexOf(';', plotIndex);

      if (semicolonIndex === -1) {
        // No ; found, skip this incomplete command
        break;
      }

      // ; found, command ends at ;
      const commandEnd = semicolonIndex;

      // Extract the command (including #PLOT: prefix)
      const command = buffer.substring(plotIndex, commandEnd).trim();
      if (command.length > 0) {
        commands.push(command);
      }

      // Continue searching after this command
      startIndex = commandEnd + 1;
    }

    return commands;
  }

  parsePlotCommand = (command: string) => {
    try {
      // Remove #PLOT: prefix
      const commandBody = command.substring(6);
      const [action, ...paramParts] = commandBody.split(',');
      const params = this.parseCommandParams(paramParts.join(','));

      switch (action) {
        case 'CREATE':
          this.handleCreatePlot(params);
          break;
        case 'DELETE':
          this.handleDeletePlot(params);
          break;
        case 'CLEAR':
          this.handleClearPlot(params);
          break;
        case 'TRACE':
          this.handleCreateTrace(params);
          break;
        case 'DATA':
          this.handleAddData(params);
          break;
        default:
          this.snackbar.sendToSnackbar(`Unknown plot command: ${action}`, 'warning');
      }
    } catch (error) {
      this.snackbar.sendToSnackbar(`Error parsing plot command: ${error}`, 'error');
    }
  }

  parseCommandParams = (paramString: string): Map<string, string> => {
    const params = new Map<string, string>();
    if (!paramString.trim()) return params;

    const parts = paramString.split(',');
    for (const part of parts) {
      const [key, ...valueParts] = part.split('=');
      if (key && valueParts.length > 0) {
        params.set(key.trim(), valueParts.join('=').trim());
      }
    }
    return params;
  }

  /**
   * Handles the PLOT:CREATE command.
   * @param params - The parameters of the command.
   */
  handleCreatePlot = (params: Map<string, string>) => {
    const id = params.get('id');
    if (!id) {
      this.snackbar.sendToSnackbar('PLOT:CREATE requires id parameter', 'warning');
      return;
    }
    let title = params.get('title') || id;
    // If title exists, strip quotes from start and end if they exist
    // (user might have provided the title in the form "title="My Data" or title=my_data)
    // If title doesn't exist, fallback to using the id
    if (title) {
      title = title.replace(/^"|"$/g, '');
    } else {
      title = id;
    }

    const plot = new Plot(id, title);
    this.plots.set(id, plot);
  }

  /**
   * Handles the PLOT:DELETE command.
   * @param params - The parameters of the command.
   */
  handleDeletePlot = (params: Map<string, string>) => {
    const plotId = params.get('plot');
    if (!plotId) {
      this.snackbar.sendToSnackbar('PLOT:DELETE requires plot parameter', 'warning');
      return;
    }

    this.plots.delete(plotId);
  }

  /**
   * Handles the PLOT:CLEAR command.
   * @param params - The parameters of the command.
   */
  handleClearPlot = (params: Map<string, string>) => {
    const plotId = params.get('plot');
    const traceId = params.get('trace');

    if (traceId && plotId) {
      // Clear specific trace in specific plot
      const plot = this.plots.get(plotId);
      if (plot) {
        const trace = plot.traces.get(traceId);
        if (trace) {
          trace.data = [];
          trace.counter = 0;
        }
      }
    } else if (traceId) {
      // Clear trace in all plots
      for (const plot of this.plots.values()) {
        const trace = plot.traces.get(traceId);
        if (trace) {
          trace.data = [];
          trace.counter = 0;
        }
      }
    } else if (plotId) {
      // Clear all traces in specific plot
      const plot = this.plots.get(plotId);
      if (plot) {
        for (const trace of plot.traces.values()) {
          trace.data = [];
          trace.counter = 0;
        }
      }
    }
  }

  /**
   * Handles the PLOT:TRACE command.
   * @param params - The parameters of the command.
   */
  handleCreateTrace = (params: Map<string, string>) => {
    const plotId = params.get('plot');
    const traceId = params.get('id');

    if (!plotId || !traceId) {
      this.snackbar.sendToSnackbar('PLOT:TRACE requires plot and id parameters', 'warning');
      return;
    }

    let name = params.get('name');
    // If name exists, strip quotes from start and end if they exist
    // (user might have provided the name in the form "name="My Data" or name=my_data)
    if (name) {
      name = name.replace(/^"|"$/g, '');
    } else {
      name = traceId;
    }

    const color = params.get('color') || '#0af20e';
    const xType = (params.get('xtype') as XAxisType) || 'timestamp';

    const plot = this.plots.get(plotId);
    if (!plot) {
      this.snackbar.sendToSnackbar(`Plot ${plotId} does not exist`, 'warning');
      return;
    }

    if (!['data', 'counter', 'timestamp'].includes(xType)) {
      this.snackbar.sendToSnackbar(`Invalid xtype: ${xType}. Must be data, counter, or timestamp`, 'warning');
      return;
    }

    const trace = new PlotTrace(traceId, name, color, xType);
    plot.traces.set(traceId, trace);
  }

  /**
   * Handles the PLOT:DATA command.
   * @param params - The parameters of the command.
   */
  handleAddData = (params: Map<string, string>) => {
    const traceId = params.get('trace');
    const dataStr = params.get('data');

    if (!traceId || !dataStr) {
      this.snackbar.sendToSnackbar('PLOT:DATA requires trace and data parameters', 'warning');
      return;
    }

    // Find the trace in any plot
    let targetTrace: PlotTrace | null = null;
    for (const plot of this.plots.values()) {
      const trace = plot.traces.get(traceId);
      if (trace) {
        targetTrace = trace;
        break;
      }
    }

    if (!targetTrace) {
      this.snackbar.sendToSnackbar(`Trace ${traceId} does not exist`, 'warning');
      return;
    }

    const currentTime = (Date.now() - this.timeAtReset_ms) / 1000.0;

    // Parse multiple data points separated by pipes
    const dataPoints = dataStr.split('|').map(s => s.trim()).filter(s => s.length > 0);

    for (const dataPoint of dataPoints) {
      const values = dataPoint.split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v));

      if (values.length === 0) continue;

      if (targetTrace.xType === 'data') {
        // Expect x,y pairs
        for (let i = 0; i < values.length; i += 2) {
          if (i + 1 < values.length) {
            targetTrace.data.push({ x: values[i], y: values[i + 1] });
          }
        }
      } else if (targetTrace.xType === 'counter') {
        // Use counter for x, values are y
        for (const yValue of values) {
          targetTrace.data.push({ x: targetTrace.counter++, y: yValue });
        }
      } else if (targetTrace.xType === 'timestamp') {
        // Use timestamp for x, values are y
        for (const yValue of values) {
          targetTrace.data.push({ x: currentTime, y: yValue });
        }
      }
    }

    // Apply max data points limit to trace
    while (targetTrace.data.length > this.maxNumDataPoints.appliedValue) {
      targetTrace.data.shift();
    }
  }

  _saveConfig = () => {
    let config = this.appDataManager.appData.currentAppConfig.settings.graphingSettings;

    config.graphingEnabled = this.graphingEnabled;
    config.processingTrigger = this.processingTrigger;
    config.maxBufferSize = this.maxBufferSize.appliedValue.toString();
    config.maxNumDataPoints = this.maxNumDataPoints.appliedValue.toString();
    config.xVarSource = this.xVarSource;
    config.xVarPrefix = this.xVarPrefix.appliedValue;
    config.yVarPrefix = this.yVarPrefix.appliedValue;
    config.multipleValuesPerBuffer = this.multipleValuesPerBuffer;
    config.valueSeparator = this.valueSeparator;
    config.customValueSeparator = this.customValueSeparator.appliedValue;
    config.clearPlotOnNewValues = this.clearPlotOnNewValues;
    config.xAxisRangeMode = this.xAxisRangeMode;
    config.xAxisRangeMin = this.xAxisRangeMin.appliedValue.toString();
    config.xAxisRangeMax = this.xAxisRangeMax.appliedValue.toString();
    config.yAxisRangeMode = this.yAxisRangeMode;
    config.yAxisRangeMin = this.yAxisRangeMin.appliedValue.toString();
    config.yAxisRangeMax = this.yAxisRangeMax.appliedValue.toString();
    config.xVarUnit = this.xVarUnit;
    config.detectionMode = this.detectionMode;

    this.appDataManager.saveAppData();
  };

  _loadConfig = () => {
    let configToLoad = this.appDataManager.appData.currentAppConfig.settings.graphingSettings;

    this.graphingEnabled = configToLoad.graphingEnabled;
    this.processingTrigger = configToLoad.processingTrigger;
    this.maxBufferSize.setDispValue(configToLoad.maxBufferSize);
    this.maxBufferSize.apply({notify: false});
    this.maxNumDataPoints.setDispValue(configToLoad.maxNumDataPoints);
    this.maxNumDataPoints.apply({notify: false});
    this.xVarSource = configToLoad.xVarSource;
    this.xVarPrefix.setDispValue(configToLoad.xVarPrefix);
    this.xVarPrefix.apply({notify: false});
    this.yVarPrefix.setDispValue(configToLoad.yVarPrefix);
    this.yVarPrefix.apply({notify: false});
    this.multipleValuesPerBuffer = configToLoad.multipleValuesPerBuffer;
    this.valueSeparator = configToLoad.valueSeparator;
    this.customValueSeparator.setDispValue(configToLoad.customValueSeparator);
    this.customValueSeparator.apply({notify: false});
    this.clearPlotOnNewValues = configToLoad.clearPlotOnNewValues;
    this.xAxisRangeMode = configToLoad.xAxisRangeMode;
    this.xAxisRangeMin.setDispValue(configToLoad.xAxisRangeMin);
    this.xAxisRangeMin.apply({notify: false});
    this.xAxisRangeMax.setDispValue(configToLoad.xAxisRangeMax);
    this.xAxisRangeMax.apply({notify: false});
    this.yAxisRangeMode = configToLoad.yAxisRangeMode;
    this.yAxisRangeMin.setDispValue(configToLoad.yAxisRangeMin);
    this.yAxisRangeMin.apply({notify: false});
    this.yAxisRangeMax.setDispValue(configToLoad.yAxisRangeMax);
    this.yAxisRangeMax.apply({notify: false});
    this.xVarUnit = configToLoad.xVarUnit;
    
    // Load detection mode with fallback to Basic Prefix Mode for backward compatibility
    this.detectionMode = (configToLoad.detectionMode as DetectionMode) || DetectionMode.BASIC_PREFIX;
  };

  _onMinRangeChanged = () => {
    // When min values change, re-validate the max fields by re-running their validation
    this.xAxisRangeMax.setDispValue(this.xAxisRangeMax.dispValue);
    this.yAxisRangeMax.setDispValue(this.yAxisRangeMax.dispValue);

    // Save config
    this._saveConfig();
  };
}

export default Graphing;
