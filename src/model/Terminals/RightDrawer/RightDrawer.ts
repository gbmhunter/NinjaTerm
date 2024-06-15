import { makeAutoObservable } from 'mobx';
import { MacroController } from './Macros/MacroController';
import { App } from 'src/model/App';
import { ProfileManager } from 'src/model/ProfileManager/ProfileManager';

export class RightDrawerConfig {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 1;

  showRightDrawer = true;

  rightDrawerWidth_px = 400;

  /**
   * Expand the quick port settings and macro accordions by default.
   */
  quickPortSettingsIsExpanded = true;
  otherQuickSettingsIsExpanded = false;
  macrosIsExpanded = true;
}

export default class RightDrawer {

  profileManager: ProfileManager;
  macroController: MacroController;

  drawerWidth_px = 400;

  quickPortSettingsIsExpanded = false;
  otherQuickSettingsIsExpanded = false;
  macrosIsExpanded = false;

  constructor(app: App) {

    this.profileManager = app.profileManager;
    this.macroController = new MacroController(app);
    this._loadConfig();
    this.profileManager.registerOnProfileLoad(() => {
      this._loadConfig();
    });

    makeAutoObservable(this); // Make sure this near the end
  }

  handleQuickPortSettingsAccordionChange =  (event: React.SyntheticEvent, isExpanded: boolean) => {
    this.quickPortSettingsIsExpanded = isExpanded;
    this._saveConfig();
  };

  handleOtherQuickSettingsAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    this.otherQuickSettingsIsExpanded = isExpanded;
    this._saveConfig();
  };

  handleMacrosAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    this.macrosIsExpanded = isExpanded;
    this._saveConfig();
  };

  _saveConfig = () => {
    let config = this.profileManager.appData.currentAppConfig.terminal.rightDrawer;

    config.rightDrawerWidth_px = this.drawerWidth_px;

    config.quickPortSettingsIsExpanded = this.quickPortSettingsIsExpanded;
    config.otherQuickSettingsIsExpanded = this.otherQuickSettingsIsExpanded;
    config.macrosIsExpanded = this.macrosIsExpanded;

    this.profileManager.saveAppData();
  };

  _loadConfig = () => {
    let configToLoad = this.profileManager.appData.currentAppConfig.terminal.rightDrawer;
    //===============================================
    // UPGRADE PATH
    //===============================================
    const latestVersion = new RightDrawerConfig().version;
    if (configToLoad.version === latestVersion) {
      // Do nothing
    } else {
      console.log(`Out-of-date config version ${configToLoad.version} found.` + ` Updating to version ${latestVersion}.`);
      this._saveConfig();
      configToLoad = this.profileManager.appData.currentAppConfig.terminal.rightDrawer;
    }

    this.drawerWidth_px = configToLoad.rightDrawerWidth_px;
    this.quickPortSettingsIsExpanded = configToLoad.quickPortSettingsIsExpanded;
    this.otherQuickSettingsIsExpanded = configToLoad.otherQuickSettingsIsExpanded;
    this.macrosIsExpanded = configToLoad.macrosIsExpanded
  };

  setDrawerWidth(width: number) {
    this.drawerWidth_px = width;
    this._saveConfig();
  }
}
