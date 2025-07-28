
export {}

import { App } from 'src/model/App';
import { SelectionController } from 'src/model/SelectionController/SelectionController';

// Expose a few parts of the application on the window object.
// This is so that the integration tests can access them.
declare global {
  interface Window {
    app: App;

    // Selection controller is used by the selecting text tests
    SelectionController: typeof SelectionController;
  }
}
