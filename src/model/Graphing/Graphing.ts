import { makeAutoObservable } from "mobx";
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

  selDataSeparator = 'LF (\\n)';

  xVarSources = [
    'Received Time',
    'Counter',
    'In Data',
  ]

  selXVarSource = 'Received Time';

  /**
   * The string to search for in the RX data to find the Y value for the graph.
   */
  yVarPrefix = 'y=';

  /**
   * Holds data that has been received but no data separator has been found yet.
   */
  rxDataBuffer: string = '';

  timeAtReset: number = Date.now();

  constructor(snackbar: Snackbar) {
    this.snackbar = snackbar;

    this.graphData.push({ x: 0, y: 0 });
    this.graphData.push({ x: 10, y: 10 });
    makeAutoObservable(this);
  }

  setGraphingEnabled = (graphingEnabled: boolean) => {
    this.graphingEnabled = graphingEnabled;
  }

  setYVarPrefix = (ySearchString: string) => {
    this.yVarPrefix = ySearchString;
  }

  setSelDataSeparator = (selDataSeparator: string) => {
    this.selDataSeparator = selDataSeparator;
  }

  setSelXVarSource = (selXVarSource: string) => {
    this.selXVarSource = selXVarSource;
  }

  /**
   * Takes incoming data and extracts any data points out of it.
   *
   * Does nothing if graphing is not enabled.
   *
   * @param data
   * @returns
   */
  parseData = (data: Uint8Array) => {
    console.log('parseData() called.');
    if (!this.graphingEnabled) {
      return;
    }

    for (let i = 0; i < data.length; i++) {
      // Convert byte into a character and add to receive buffer
      let char = String.fromCharCode(data[i]);
      console.log('char: ' + char.charCodeAt(0));
      this.rxDataBuffer += char;
      console.log('rxDataBuffer: ' + this.rxDataBuffer);
      if (char === '\n') {
        console.log('Found data separator.')
        // Found a data separator, so parse the data
        const yVarPrefixIdx = this.rxDataBuffer.indexOf(this.yVarPrefix);
        if (yVarPrefixIdx === -1) {
          // This line does not contain the Y variable prefix, so skip it
          this.rxDataBuffer = '';
          continue;
        }

        // Get the Y value. Grab the entire line after the Y variable prefix,
        // and call parseFloat on it. This will stop at the first non-numeric
        // character (but will allow things like "."), which is what we want.
        let yValStr = '';
        for (let j = yVarPrefixIdx + this.yVarPrefix.length; j < this.rxDataBuffer.length; j++) {
          yValStr += this.rxDataBuffer[j];
        }
        const yVal = parseFloat(yValStr);
        console.log('yVal: ' + yVal);

        let xVal;
        if (this.selXVarSource === 'Received Time') {
          xVal = Date.now() - this.timeAtReset;
        } else {
          throw new Error('Unsupported X variable source: ' + this.selXVarSource);
        }
        console.log('xVal: ' + xVal);

        // Add data point to array of points
        this.graphData.push({ x: xVal, y: yVal });

        // Since data separator has been received and line has been parsed,
        // now clear the buffer
        this.rxDataBuffer = '';
      }

      if (this.rxDataBuffer.length > 100) {
        // Buffer is getting too big, so clear it
        this.rxDataBuffer = '';
        this.snackbar.sendToSnackbar(
          'Graphing receive buffer overflowed. Clearing buffer.',
          'warning');
      }

    }

    console.log('graphData: ' + JSON.stringify(this.graphData));

  }

}

export default Graphing;
