import { RightDrawerConfig } from 'src/model/Terminals/RightDrawer/RightDrawer';
import { LastUsedSerialPort } from '../AppDataManager';
import { PortSettingsData } from './PortSettingsData';
import { DisplaySettingsData } from './DisplaySettingsData';
import { RxSettingsData } from './RxSettingsData';
import { TxSettingsData } from './TxSettingsData';
import { GeneralSettingsConfig } from './GeneralSettingsData';
import { MacroControllerData } from './MacroControllerData';

/**
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class RootConfig {

  terminal = {
    macroController: new MacroControllerData(),
    rightDrawer: new RightDrawerConfig(),
  };

  lastUsedSerialPort: LastUsedSerialPort = new LastUsedSerialPort();

  settings = {
    portSettings: new PortSettingsData(),
    txSettings: new TxSettingsData(),
    rxSettings: new RxSettingsData(),
    displaySettings: new DisplaySettingsData(),
    generalSettings: new GeneralSettingsConfig(),
  };
}
