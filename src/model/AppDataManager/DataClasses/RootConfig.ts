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

  terminal: {
    macroController: MacroControllerData;
    rightDrawer: RightDrawerConfig;
  };

  lastUsedSerialPort: LastUsedSerialPort;

  settings: {
    portSettings: PortSettingsData;
    txSettings: TxSettingsData;
    rxSettings: RxSettingsData;
    displaySettings: DisplaySettingsData;
    generalSettings: GeneralSettingsConfig;
  };

  constructor() {
    this.terminal = {
      macroController: new MacroControllerData(),
      rightDrawer: new RightDrawerConfig(),
    };
    this.lastUsedSerialPort = new LastUsedSerialPort();
    this.settings = {
      portSettings: new PortSettingsData(),
      txSettings: new TxSettingsData(),
      rxSettings: new RxSettingsData(),
      displaySettings: new DisplaySettingsData(),
      generalSettings: new GeneralSettingsConfig(),
    };
    console.log('RootConfig check. Settings.displaySettings.defaultTxTextColor: ', this.settings.displaySettings.defaultTxTextColor);
  }
}
