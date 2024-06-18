import { MacroControllerConfig } from "src/model/Terminals/RightDrawer/Macros/MacroController";
import { RightDrawerConfig } from "src/model/Terminals/RightDrawer/RightDrawer";
import { LastUsedSerialPort } from "../AppDataManager";
import { TxSettingsConfig } from "src/model/Settings/TxSettings/TxSettings";
import { RxSettingsConfig } from "src/model/Settings/RxSettings/RxSettings";
import { DisplaySettingsConfig } from "src/model/Settings/DisplaySettings/DisplaySettings";
import { GeneralSettingsConfig } from "src/model/Settings/GeneralSettings/GeneralSettings";
import { PortConfigurationConfigV2, PortConfigurationConfigV3 } from "src/model/Settings/PortConfigurationSettings/PortConfigurationSettings";

/**
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class RootConfigV2 {
  version = 2;

  terminal = {
    macroController: new MacroControllerConfig(),
    rightDrawer: new RightDrawerConfig(),
  };

  lastUsedSerialPort: LastUsedSerialPort = new LastUsedSerialPort();

  settings = {
    portSettings: new PortConfigurationConfigV2(),
    txSettings: new TxSettingsConfig(),
    rxSettings: new RxSettingsConfig(),
    displaySettings: new DisplaySettingsConfig(),
    generalSettings: new GeneralSettingsConfig(),
  };
}

/**
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class RootConfigV3 {
  version = 3;

  terminal = {
    macroController: new MacroControllerConfig(),
    rightDrawer: new RightDrawerConfig(),
  };

  lastUsedSerialPort: LastUsedSerialPort = new LastUsedSerialPort();

  settings = {
    portSettings: new PortConfigurationConfigV3(),
    txSettings: new TxSettingsConfig(),
    rxSettings: new RxSettingsConfig(),
    displaySettings: new DisplaySettingsConfig(),
    generalSettings: new GeneralSettingsConfig(),
  };
}
