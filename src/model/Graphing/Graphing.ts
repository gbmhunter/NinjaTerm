import { makeAutoObservable } from "mobx";

class Graphing {

  /**
   * Whether or not graphing is enabled. If true, RX data will be parsed for
   * graphing data.
   */
  graphingEnabled = false;

  constructor() {
    makeAutoObservable(this);
  }

  setGraphingEnabled = (graphingEnabled: boolean) => {
    this.graphingEnabled = graphingEnabled;
  }

}

export default Graphing;
