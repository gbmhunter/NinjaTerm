import { RightDrawerConfig } from 'src/model/Terminals/RightDrawer/RightDrawer';
import { MacroControllerData } from './MacroControllerData';
import { SettingsData } from './SettingsData';
import { TerminalFilterData } from './TerminalFilterData';

/**
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class ProfileConfig {

  terminal = {
    macroController: new MacroControllerData(),
    rightDrawer: new RightDrawerConfig(),
    // Ordered list of view filters (match-any). Empty = no filtering.
    filters: [] as TerminalFilterData[],
  };

  settings = new SettingsData();
}
