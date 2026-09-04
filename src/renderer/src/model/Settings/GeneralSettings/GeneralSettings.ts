import { makeAutoObservable } from "mobx";
import { AppDataManager } from "src/model/AppDataManager/AppDataManager";
import { GeneralSettingsConfig } from "src/model/AppDataManager/DataClasses/GeneralSettingsData";
import { SettingsBranch } from "../SettingsBranch";

export default class GeneralSettings {
  profileManager: AppDataManager;

  /** See `SettingsBranch` for how this class relates to `GeneralSettingsConfig`. */
  private readonly branch = new SettingsBranch<GeneralSettingsConfig>(
    'settings.generalSettings',
    (config) => config.settings.generalSettings,
  );

  get whenPastingOnWindowsReplaceCRLFWithLF() { return this.branch.data.whenPastingOnWindowsReplaceCRLFWithLF; }
  setWhenPastingOnWindowsReplaceCRLFWithLF = this.branch.setter('whenPastingOnWindowsReplaceCRLFWithLF');

  get whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping() { return this.branch.data.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping; }
  setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = this.branch.setter('whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping');

  // Performance test results (not persisted, session-only)
  performanceTestResults: string | null = null;
  isRunningPerformanceTest = false;

  //================================================================================
  // App-level settings. These live on the root of `appData`, not in the per-profile
  // config, because they affect the whole application rather than one setup.
  //================================================================================

  get autoUpdatesEnabled() {
    return this.profileManager.appData.autoUpdatesEnabled;
  }

  get mcpEnabled() {
    return this.profileManager.appData.mcpEnabled;
  }

  get mcpPort() {
    return this.profileManager.appData.mcpPort;
  }

  constructor(profileManager: AppDataManager) {
    this.profileManager = profileManager;
    this.branch.attach(profileManager);
    makeAutoObservable<GeneralSettings, 'branch'>(this, { branch: false }); // Make sure this is at the end of the constructor
  }

  setAutoUpdatesEnabled = (value: boolean) => {
    this.profileManager.appData.autoUpdatesEnabled = value;
    this.profileManager.saveAppData();
  };

  setMcpEnabled = (value: boolean) => {
    this.profileManager.appData.mcpEnabled = value;
    this.profileManager.saveAppData();
    if (value) {
      window.electronAPI.mcp.start(this.profileManager.appData.mcpPort);
    } else {
      window.electronAPI.mcp.stop();
    }
  };

  setMcpPort = (value: number) => {
    this.profileManager.appData.mcpPort = value;
    this.profileManager.saveAppData();
    // Restart server on port change if currently enabled
    if (this.profileManager.appData.mcpEnabled) {
      window.electronAPI.mcp.stop().then(() => {
        window.electronAPI.mcp.start(value);
      });
    }
  };

  setPerformanceTestResults = (results: string | null) => {
    this.performanceTestResults = results;
  };

  setIsRunningPerformanceTest = (isRunning: boolean) => {
    this.isRunningPerformanceTest = isRunning;
  };

  clearAppDataAndRefresh = () => {
    localStorage.clear();
    window.location.reload();
  };
}
