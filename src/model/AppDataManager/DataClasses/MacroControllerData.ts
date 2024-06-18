import { MacroDataType } from 'src/model/Terminals/RightDrawer/Macros/Macro';
import { NUM_MACROS } from 'src/model/Terminals/RightDrawer/Macros/MacroController';
import { MacroDataV1 } from './MacroData';

export class MacroControllerDataV1 {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 1;

  macroConfigs: MacroDataV1[] = [];

  constructor() {
    // Create 8 macros by default and put some example data in the first two. This will
    // only be applied the first time the user runs the app, after then it will load
    // saved config from local storage
    this.macroConfigs = [];
    for (let i = 0; i < NUM_MACROS; i++) {
      let macroConfig = new MacroDataV1();
      this.macroConfigs.push(macroConfig);
    }
    this.macroConfigs[0].data = 'Hello\\n';
    this.macroConfigs[1].data = 'deadbeef';
    this.macroConfigs[1].dataType = MacroDataType.HEX;
  }
}
