import { makeAutoObservable } from "mobx";
import { AppDataManager } from "src/model/AppDataManager/AppDataManager";

export default class GeneralSettings {
  profileManager: AppDataManager;

  whenPastingOnWindowsReplaceCRLFWithLF = true;
  whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = true;
  
  // Performance test results (not persisted, session-only)
  performanceTestResults: string | null = null;
  isRunningPerformanceTest = false;

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
    this._loadConfig();
    this.profileManager.registerOnProfileLoad(() => {
      this._loadConfig();
    });
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  setWhenPastingOnWindowsReplaceCRLFWithLF = (value: boolean) => {
    this.whenPastingOnWindowsReplaceCRLFWithLF = value;
    this._saveConfig();
  };

  setWhenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = (value: boolean) => {
    this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = value;
    this._saveConfig();
  };

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

  _saveConfig = () => {
    let config = this.profileManager.appData.currentAppConfig.settings.generalSettings;

    config.whenPastingOnWindowsReplaceCRLFWithLF = this.whenPastingOnWindowsReplaceCRLFWithLF;
    config.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping;

    this.profileManager.saveAppData();
  };

  _loadConfig = () => {
    let configToLoad = this.profileManager.appData.currentAppConfig.settings.generalSettings;

    this.whenPastingOnWindowsReplaceCRLFWithLF = configToLoad.whenPastingOnWindowsReplaceCRLFWithLF;
    this.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping = configToLoad.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping;
  };

  clearAppDataAndRefresh = () => {
    localStorage.clear();
    window.location.reload();
  };
}
