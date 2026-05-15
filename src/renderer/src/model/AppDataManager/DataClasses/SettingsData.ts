import { PortSettingsData } from './PortSettingsData';
import { DisplaySettingsData } from './DisplaySettingsData';
import { RxSettingsData } from './RxSettingsData';
import { TxSettingsData } from './TxSettingsData';
import { GeneralSettingsConfig } from './GeneralSettingsData';
import { GraphingSettingsData } from './GraphingSettingsData';
import { LogSettingsData } from './LogSettingsData';
import { RulesSettingsData } from './RulesSettingsData';

/**
 * Encapsulates all application settings data.
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class SettingsData {
  portSettings = new PortSettingsData();
  txSettings = new TxSettingsData();
  rxSettings = new RxSettingsData();
  displaySettings = new DisplaySettingsData();
  generalSettings = new GeneralSettingsConfig();
  graphingSettings = new GraphingSettingsData();
  logSettings = new LogSettingsData();
  rulesSettings = new RulesSettingsData();
}
