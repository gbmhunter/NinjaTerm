import { makeAutoObservable } from "mobx";

import { StoredPreset } from "./StoredPreset";
import { SessionData } from "./SessionData";

export const LATEST_VERSION = 25;

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
   * The open sessions, in tab order. Each carries its own connection settings,
   * terminal settings, macros and so on. There is always at least one.
   *
   * Replaced `currentAppConfig` in v25, which was a single session's config.
   */
  sessions: SessionData[] = [];

  /** The session whose tab is selected. Always the id of one of `sessions`. */
  activeSessionId: string = '';

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
    const firstSession = new SessionData();
    this.sessions = [firstSession];
    this.activeSessionId = firstSession.id;
    makeAutoObservable(this);
  }
}
