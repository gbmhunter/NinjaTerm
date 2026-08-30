import { makeAutoObservable } from "mobx";

import { StoredPreset } from "./StoredPreset";
import { ProfileConfig } from "./ProfileConfig";

export const LATEST_VERSION = 23;

export class AppData {
  // Version of the AppData class.
  // Increment this whenever the AppData class structure changes.
  version = LATEST_VERSION;

  /**
   * The presets the user has saved. Built-in presets are defined in code, not
   * stored here. Profiles from before v23 became full-scope entries in this list.
   */
  presets: StoredPreset[] = [];

  /**
   * Represents the current application configuration. This is saved regularly so that when the app reloads,
   * it can restore the last known configuration.
   */
  currentAppConfig = new ProfileConfig();

  /**
   * Global app setting for enabling/disabling automatic updates.
   * This is stored at the app level rather than per-profile since it affects the entire application.
   */
  autoUpdatesEnabled = true;

  /**
   * Global setting for enabling the MCP (Model Context Protocol) server.
   * Stored at app level since it's a system-wide feature, not per-profile.
   */
  mcpEnabled = false;

  /**
   * Port number for the MCP server.
   */
  mcpPort = 3579;

  constructor() {
    this.presets = [];
    this.presets.push(new StoredPreset('Default profile'));
    makeAutoObservable(this);
  }
}
