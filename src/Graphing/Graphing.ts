import { makeAutoObservable } from 'mobx';
import Validator from 'validatorjs';
import { z } from 'zod';

import Snackbar from 'src/Snackbar';
import { ApplyableTextField, ApplyableNumberField } from 'src/Components/ApplyableTextField';

class Point {
  x: number = 0;
  y: number = 0;
}

class Graphing {

  snackbar: Snackbar;

  /**
   * Whether or not graphing is enabled. If true, RX data will be parsed for
   * graphing data.
   */
  graphingEnabled = false;

  graphData: Point[] = [];

  dataSeparators = [
    'LF (\\n)',
    'CR (\\r)',
    'Custom',
  ]

  dataSeparator = this.dataSeparators[0];

  /**
     * The maximum size of the receive buffer before it is cleared.
     */
  maxBufferSize = new ApplyableNumberField('100', z.coerce.number().int().min(1).max(1000));

  maxNumDataPoints = new ApplyableNumberField('500', z.coerce.number().int().min(1).max(2000));

  xVarSources = [
    'Received Time', // Received time since last reset
    'Counter', // Monotonically increasing counter
    'In Data', // X values extracted from data, just like y values
  ]

  xVarSource = this.xVarSources[0]

  xVarPrefix = new ApplyableTextField('x=', z.string());

  yVarPrefix = new ApplyableTextField('y=', z.string());

  axisRangeModes = [
    'Auto',
    'Fixed',
  ]

  xAxisRangeMode = this.axisRangeModes[0];

  xAxisRangeMin = new ApplyableNumberField('0', z.coerce.number().int().min(0));

  xAxisRangeMax = new ApplyableNumberField('100', z.coerce.number().int().min(0));

  yAxisRangeMode = this.axisRangeModes[0];

  yAxisRangeMin = new ApplyableNumberField('0', z.coerce.number().int().min(0));

  yAxisRangeMax = new ApplyableNumberField('100', z.coerce.number().int().min(0));

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

  constructor(snackbar: Snackbar) {
    this.snackbar = snackbar;

    // this.graphData.push({ x: 0, y: 0 });
    // this.graphData.push({ x: 10, y: 10 });
    makeAutoObservable(this);
  }

  setGraphingEnabled = (graphingEnabled: boolean) => {
    this.graphingEnabled = graphingEnabled;
  }

  setDataSeparator = (value: string) => {
    this.dataSeparator = value;
  }

  setXVarSource = (value: string) => {
    this.xVarSource = value;
  }

  setXAxisRangeMode = (value: string) => {
    this.xAxisRangeMode = value;
  }

  setYAxisRangeMode = (value: string) => {
    this.yAxisRangeMode = value;
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
      if (char === '\n') {
        // console.log('Found data separator.')
        // Found a data separator, so parse the data
        const yVarPrefixIdx = this.rxDataBuffer.indexOf(this.yVarPrefix.appliedValue);
        if (yVarPrefixIdx === -1) {
          // This line does not contain the Y variable prefix, so skip it
          this.rxDataBuffer = '';
          continue;
        }

        // Get the Y value. Grab the entire line after the Y variable prefix,
        // and call parseFloat on it. This will stop at the first non-numeric
        // character (but will allow things like "."), which is what we want.
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
          this.rxDataBuffer = '';
          continue;
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
            this.rxDataBuffer = '';
            continue;
          }
          // Get the X value. Grab the entire line after the X variable prefix,
          // and call parseFloat on it. This will stop at the first non-numeric
          // character (but will allow things like "."), which is what we want.
          let xValStr = '';
          for (let j = xVarPrefixIdx + this.xVarPrefix.appliedValue.length; j < this.rxDataBuffer.length; j++) {
            xValStr += this.rxDataBuffer[j];
          }
          xVal = parseFloat(xValStr);
          // Bail if y value is NaN
          if (isNaN(xVal)) {
            this.snackbar.sendToSnackbar(
              'Graphing received NaN value for x-axis. Skipping data point. rxDataBuffer: ' + this.rxDataBuffer,
              'warning');
            this.rxDataBuffer = '';
            continue;
          }

        } else {
          throw new Error('Unsupported X variable source: ' + this.xVarSource);
        }

        // If we get here both x and y values should be valid
        this.addDataPoint(xVal, yVal);

        // Since data separator has been received and line has been parsed,
        // now clear the buffer
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
    this.timeAtReset_ms = Date.now();
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
}

export default Graphing;
