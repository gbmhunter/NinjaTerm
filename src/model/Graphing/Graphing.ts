import { makeAutoObservable } from "mobx";
import Validator from 'validatorjs';
import { AxisDomain } from "recharts/types/util/types";

import Snackbar from "model/Snackbar";

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

  xVarSources = [
    'Received Time',
    'Counter',
    'In Data',
  ]

  xVarUnit = 's';

  xDomain: AxisDomain = [0, 10];
  yDomain: AxisDomain = [0, 10];

  /**
   * Holds data that has been received but no data separator has been found yet.
   */
  rxDataBuffer: string = '';

  settings = {
    /**
     * The maximum size of the receive buffer before it is cleared.
     */
    maxBufferSize: {
      dispValue: '100',
      appliedValue: '100',
      rule: 'required|integer|min:1|max:1000',
      hasError: false,
      errorMsg: '',
    },

    dataSeparator: {
      dispValue: 'LF (\\n)',
      appliedValue: 'LF (\\n)',
      rule: 'required|string',
      hasError: false,
      errorMsg: '',
    },

    maxNumDataPoints: {
      dispValue: '100',
      appliedValue: '100',
      rule: 'required|integer|min:1|max:1000',
      hasError: false,
      errorMsg: '',
    },

    xVarSource: {
      dispValue: 'Received Time',
      appliedValue: 'Received Time',
      rule: 'required|string',
      hasError: false,
      errorMsg: '',
    },

    /**
     * The string to search for in the RX data to find the Y value for the graph.
     */
    yVarPrefix: {
      dispValue: 'y=',
      appliedValue: 'y=',
      rule: 'required|string',
      hasError: false,
      errorMsg: '',
    },


  }

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

  /**
   * General purpose function that can set any parameter in the settings object.
   *
   * Always runs validation.
   *
   * @param settingName
   * @param settingValue
   */
  setSetting = (settingName: string, settingValue: string) => {
    // console.log('setSetting() called. settingName: ' + settingName + ', settingValue: ' + settingValue);
    if (this.settings.hasOwnProperty(settingName) === false) {
      throw new Error('Unsupported setting name: ' + settingName);
    }
    (this.settings as any)[settingName].dispValue = settingValue;
    this.onSettingsChange();
  }

  onSettingsChange = () => {
    // Iterate over every key-value pair in settings
    const validatorValues: { [key: string]: any } = {};
    const validatorRules: { [key: string]: string } = {};
    Object.entries(this.settings).forEach(([paramName, paramData]) => {
      // console.log('key: ' + paramName, 'value: ' + paramData);
      validatorValues[paramName] = paramData.dispValue;
      validatorRules[paramName] = paramData.rule;
    })
    // Check if settings are valid
    const validation = new Validator(validatorValues, validatorRules);

    // Calling passes() is needed to run the validation logic. This also assigns the result
    // to enable/disable the apply button
    this.isApplyable = validation.passes();

    // console.log('isApplyable: ' + this.isApplyable);

    // Now set individual error states and error messages (to display
    // to the user)
    Object.entries(this.settings).forEach(
      ([paramName, paramData]) => {
        const hasError = validation.errors.has(paramName);
        // Convert to any type so we can assign to it
        // const paramDataAny = paramData as any;
        paramData.hasError = hasError;
        if (hasError) {
          paramData.errorMsg = validation.errors.first(paramName);
        } else {
          paramData.errorMsg = '';
        }
      }
    );
  }

  applyChanges = () => {
    // console.log('applyChanges() called.');
    Object.entries(this.settings).forEach(([key, value]) => {
      // console.log('key: ' + key, 'value: ' + value);
      value.appliedValue = value.dispValue;
    })

    // User could have reduced number of data points,
    // so limit if needed
    this.limitNumDataPoints();

    this.isApplyable = false;
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
        const yVarPrefixIdx = this.rxDataBuffer.indexOf(this.settings.yVarPrefix.appliedValue);
        if (yVarPrefixIdx === -1) {
          // This line does not contain the Y variable prefix, so skip it
          this.rxDataBuffer = '';
          continue;
        }

        // Get the Y value. Grab the entire line after the Y variable prefix,
        // and call parseFloat on it. This will stop at the first non-numeric
        // character (but will allow things like "."), which is what we want.
        let yValStr = '';
        for (let j = yVarPrefixIdx + this.settings.yVarPrefix.appliedValue.length; j < this.rxDataBuffer.length; j++) {
          yValStr += this.rxDataBuffer[j];
        }
        const yVal = parseFloat(yValStr);
        // console.log('yVal: ' + yVal);

        let xVal;
        if (this.settings.xVarSource.appliedValue === 'Received Time') {
          // Get the time since the last reset in ms, then convert to s
          xVal = (Date.now() - this.timeAtReset_ms)/1000.0;
        } else {
          throw new Error('Unsupported X variable source: ' + this.settings.xVarSource.appliedValue);
        }
        // console.log('xVal: ' + xVal);

        this.addDataPoint(xVal, yVal);

        // Since data separator has been received and line has been parsed,
        // now clear the buffer
        this.rxDataBuffer = '';
      }

      if (this.rxDataBuffer.length > parseInt(this.settings.maxBufferSize.appliedValue)) {
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
      this.xDomain = ['auto', 'auto'];
      this.yDomain = ['auto', 'auto'];
    }
    this.graphData.push({ x: x, y: y });
    this.limitNumDataPoints();
  }

  limitNumDataPoints = () => {
    // Check if we have exceeded the max number of data points,
    // and if so, remove the oldest point
    while (this.graphData.length > parseInt(this.settings.maxNumDataPoints.appliedValue)) {
      this.graphData.shift();
    }
  }

  /**
   * Clears all existing data points and sets the start time back to 0.
   */
  resetData = () => {
    this.xDomain = [0, 10];
    this.yDomain = [0, 10];
    this.graphData = [];
    this.timeAtReset_ms = Date.now();
  }
}

export default Graphing;
