import { RightDrawerConfig } from 'src/model/Terminals/RightDrawer/RightDrawer';
import { LastUsedSerialPort } from '../AppDataManager';
import { MacroControllerData } from './MacroControllerData';
import { SettingsData } from './SettingsData';

/**
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class RootConfig {

  terminal = {
    macroController: new MacroControllerData(),
    rightDrawer: new RightDrawerConfig(),
  };

  lastUsedSerialPort = new LastUsedSerialPort();

  settings = new SettingsData();
}
