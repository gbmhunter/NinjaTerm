import { RightDrawerConfig } from 'src/model/Terminals/RightDrawer/RightDrawer';
import { LastUsedSerialPort } from '../AppDataManager';
import { PortSettingsDataV2, PortSettingsDataV3 } from './PortSettingsData';
import { DisplaySettingsDataV1, DisplaySettingsDataV2 } from './DisplaySettingsData';
import { RxSettingsDataV1 } from './RxSettingsData';
import { TxSettingsDataV1 } from './TxSettingsData';
import { GeneralSettingsConfig } from './GeneralSettingsData';
import { MacroControllerDataV1 } from './MacroControllerData';

/**
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class RootConfigV2 {

  terminal = {
    macroController: new MacroControllerDataV1(),
    rightDrawer: new RightDrawerConfig(),
  };

  lastUsedSerialPort: LastUsedSerialPort = new LastUsedSerialPort();

  settings = {
    portSettings: new PortSettingsDataV2(),
    txSettings: new TxSettingsDataV1(),
    rxSettings: new RxSettingsDataV1(),
    displaySettings: new DisplaySettingsDataV1(),
    generalSettings: new GeneralSettingsConfig(),
  };
}

/**
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class RootConfigV3 {

  terminal = {
    macroController: new MacroControllerDataV1(),
    rightDrawer: new RightDrawerConfig(),
  };

  lastUsedSerialPort: LastUsedSerialPort = new LastUsedSerialPort();

  settings = {
    portSettings: new PortSettingsDataV3(),
    txSettings: new TxSettingsDataV1(),
    rxSettings: new RxSettingsDataV1(),
    displaySettings: new DisplaySettingsDataV2(),
    generalSettings: new GeneralSettingsConfig(),
  };
}
