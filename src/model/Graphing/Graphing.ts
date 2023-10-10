import { makeAutoObservable } from "mobx";

class Point {
  x: number = 0;
  y: number = 0;
}

class Graphing {

  /**
   * Whether or not graphing is enabled. If true, RX data will be parsed for
   * graphing data.
   */
  graphingEnabled = false;

  data: Point[] = [];

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

  constructor() {

    this.data.push({ x: 0, y: 0 });
    this.data.push({ x: 10, y: 10 });
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

}

export default Graphing;
