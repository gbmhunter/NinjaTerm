import { App } from '../src/renderer/src/model/App';

declare global {
  interface Window {
    app: App;
  }

  var _testWrittenData: number[];
  /** One entry per serial:write-data call, holding that call's bytes. */
  var _testWriteChunks: number[][];
}