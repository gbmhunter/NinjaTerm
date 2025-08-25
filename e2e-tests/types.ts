import { App } from '../src/renderer/src/model/App';

declare global {
  interface Window {
    app: App;
  }
}