/* eslint-disable no-console */
import { makeAutoObservable, observable, reaction, runInAction } from 'mobx';
import { closeSnackbar } from 'notistack';
import { Button } from '@mui/material';

// Import package.json to read out the version number
import { log, initLogging } from './Util/Log';
import packageDotJson from '../../../../package.json' with { type: 'json' };
import { SettingsCategories } from './Settings/Settings';
import SnackbarController from './SnackbarController/SnackbarController';
import { ConnState } from './Settings/PortSettings/PortSettings';
import { AppDataManager } from './AppDataManager/AppDataManager';
import { makeSessionData } from './AppDataManager/DataClasses/SessionData';
import PerformanceMonitor from './Performance/PerformanceMonitor';
import PerformanceTester, { PerformanceTestSuiteResult } from './Performance/PerformanceTester';
import { SoundPlayer } from './Util/SoundPlayer';
import { isTypingInField } from './Util/KeyboardUtil';
import { MainPanes } from './MainPanes';
import { Session } from './Session/Session';

export { MainPanes };

declare global {
  interface String {
    insert(index: number, string: string): string;
  }

  // We save the created app instance to window.app (done in index.tsx) so that the Playwright e2e tests can access it. Sometimes it's just easier to verify things using the code rather than interacting with the UI.
  interface Window {
    app: App;
  }
}

// eslint-disable-next-line no-extend-native, func-names
String.prototype.insert = function (index, string) {
  if (index > 0) {
    return this.substring(0, index) + string + this.substr(index);
  }

  return string + this;
};

/**
 * The application: the things that exist once per window, plus the list of
 * open sessions and which one is active.
 *
 * Everything to do with one connection -- its settings, terminals, macros,
 * logging, graphing -- lives on a `Session`. `App` keeps the app-wide services
 * (app data and presets, the snackbar, the updater, the MCP server, the main
 * pane selection, CPU monitoring) and exposes the *active* session's members
 * through delegating getters (`app.settings`, `app.connController`, ...), so
 * the views, which show one session at a time, read them exactly as they did
 * when there was only one.
 */
export class App {
  // If true, the settings dialog will be automatically closed on port open or close
  closeSettingsDialogOnPortOpenOrClose = true;

  /** Open sessions, in tab order. Mirrors `appData.sessions`. Never empty. */
  sessions: Session[] = [];

  /** Id of the session whose tab is selected. Mirrors `appData.activeSessionId`. */
  activeSessionId: string = '';

  private readonly RATE_UPDATE_INTERVAL_MS = 500; // Update every 500ms

  // Timer for rate calculations
  private rateCalculationInterval: NodeJS.Timeout | null = null;

  // Disposer for the title-update reaction. Captured at register-time so
  // cleanup() can release it; without this, recreating App (e.g. on hot
  // reload during dev) leaves stale reactions firing forever.
  private titleReactionDispose: (() => void) | null = null;

  // CPU usage tracking
  cpuUsagePercent: number = 0;

  // CPU monitoring variables - measuring overall renderer process load
  private readonly CPU_MEASUREMENT_WINDOW_MS = 1000; // 1 second window

  /**
   * The CPU monitor's pending animation frame, so `stopCpuMonitoring` can
   * cancel it. Null when the monitor is not running.
   */
  private cpuMonitorRafHandle: number | null = null;

  /** The CPU monitor's pending idle callback, if one is outstanding. */
  private cpuMonitorIdleHandle: number | null = null;

  // If true app is being tested by code.
  // Used for force terminal height to value when browser is not
  // available to determine height
  testing: boolean;

  // Version of the NinjaTerm app. Read from package.json
  version: string;

  snackbar: SnackbarController;

  shownMainPane: MainPanes;

  profileManager: AppDataManager;

  showCircularProgressModal = false;

  performanceMonitor: PerformanceMonitor;

  /**
   * Sound player for playing audio feedback based on received data. Shared by
   * every session's terminals.
   */
  soundPlayer: SoundPlayer;

  constructor(testing = false) {
    initLogging();
    log.info('App constructor called.');

    // Clear any existing IPC listeners, to all channels. This needs to be done if the app refreshes (e.g. hot reloads during development) when the main process continues running.
    window.electronAPI.general.removeAllListeners();

    this.testing = testing;
    if (this.testing) {
      console.log('Warning, testing mode is enabled!');
    }

    // Read out the version number from package.json
    this.version = packageDotJson['version'];

    this.profileManager = new AppDataManager(this);

    this.snackbar = new SnackbarController();

    this.performanceMonitor = new PerformanceMonitor();

    this.soundPlayer = new SoundPlayer();

    // Show the terminal by default
    this.shownMainPane = MainPanes.TERMINAL;

    // Close any existing ports which might be open in the main process, and remove
    // all IPC event listeners. Before the sessions exist, so nothing they set up
    // is swept away.
    window.electronAPI.serial.closeAllPortsAndRemoveListeners();

    // Close any existing socket connections which might be open in the main process, and remove
    // all IPC event listeners.
    window.electronAPI.socket.disconnectAllSocketsAndRemoveListeners();

    // One runtime session per persisted one. There is always at least one; a
    // blob that somehow has none gets a fresh default.
    const appData = this.profileManager.appData;
    if (appData.sessions.length === 0) {
      appData.sessions.push(makeSessionData('Session 1'));
      appData.activeSessionId = appData.sessions[0].id;
      this.profileManager.saveAppData();
    }
    for (const data of appData.sessions) {
      this.sessions.push(new Session(this, data.id));
    }
    const activeIsValid = appData.sessions.some((data) => data.id === appData.activeSessionId);
    this.activeSessionId = activeIsValid ? appData.activeSessionId : appData.sessions[0].id;
    if (!activeIsValid) {
      appData.activeSessionId = this.activeSessionId;
      this.profileManager.saveAppData();
    }

    // Keep the window title following the active session and the preset last
    // applied to it.
    this.titleReactionDispose = reaction(
      () => `${this.activeSession.name}|${this.activeSession.lastAppliedPresetName}`,
      () => this.updateTitle(),
    );
    this.updateTitle();

    // Set up auto-updater event listeners
    this.setupAutoUpdater();

    // Set up MCP server request handlers and auto-start if enabled
    this.setupMcp();

    // Set up cleanup on window unload
    window.addEventListener('beforeunload', this.cleanup);

    // Start rate calculation timer
    this.startRateCalculation();

    // Initialize CPU monitoring
    this.startCpuMonitoring();

    makeAutoObservable(this, {
      // The sessions are observable objects in their own right; only the list
      // membership needs tracking here.
      sessions: observable.shallow,
      // Written once per animation frame; nothing observes them.
      cpuMonitorRafHandle: false,
      cpuMonitorIdleHandle: false,
    } as any); // Make sure this near the end
  }

  //================================================================================
  // Sessions
  //================================================================================

  get activeSession(): Session {
    const session = this.sessions.find((s) => s.id === this.activeSessionId);
    if (session === undefined) {
      throw new Error(`Active session "${this.activeSessionId}" is not an open session.`);
    }
    return session;
  }

  /**
   * Opens a new session and makes it active.
   *
   * @param name Tab name. Defaults to the first unused "Session N".
   * @param cloneFrom Copy this session's whole configuration rather than
   *    starting from the defaults. Its connection is not opened.
   */
  newSession = ({ name, cloneFrom }: { name?: string; cloneFrom?: Session } = {}): Session => {
    const appData = this.profileManager.appData;
    const config = cloneFrom === undefined ? undefined : JSON.parse(JSON.stringify(cloneFrom.config));
    const data = makeSessionData(name ?? this.nextUnusedSessionName(), config);
    appData.sessions.push(data);
    const session = new Session(this, data.id);
    this.sessions.push(session);
    this.setActiveSession(session.id);
    return session;
  };

  /** The first "Session N" not already in use as a name. */
  nextUnusedSessionName = (): string => {
    const taken = new Set(this.sessions.map((s) => s.name));
    let n = this.sessions.length + 1;
    while (taken.has(`Session ${n}`)) {
      n += 1;
    }
    return `Session ${n}`;
  };

  /**
   * Closes a session: disconnects it, flushes any active log, releases its
   * resources and removes it from app data. The last session cannot be closed.
   */
  closeSession = async (id: string) => {
    const session = this.sessions.find((s) => s.id === id);
    if (session === undefined) {
      return;
    }
    if (this.sessions.length <= 1) {
      this.snackbar.sendToSnackbar('The last session cannot be closed.', 'warning');
      return;
    }

    if (session.connController.connState === ConnState.OPENED) {
      await session.connController.closeConnection({ silenceSnackbar: true });
    } else if (session.connController.connState === ConnState.CLOSED_BUT_WILL_REOPEN) {
      session.connController.stopWaitingToReopenPort();
    }
    if (session.logging.isLogging) {
      await session.logging.stopLogging();
    }
    session.cleanup();

    runInAction(() => {
      const appData = this.profileManager.appData;
      const index = this.sessions.indexOf(session);
      if (this.activeSessionId === id) {
        const neighbour = this.sessions[index + 1] ?? this.sessions[index - 1];
        this.activeSessionId = neighbour.id;
        appData.activeSessionId = neighbour.id;
      }
      this.sessions.splice(index, 1);
      const dataIndex = appData.sessions.findIndex((s) => s.id === id);
      if (dataIndex !== -1) {
        appData.sessions.splice(dataIndex, 1);
      }
    });
    this.profileManager.saveAppData();
  };

  setActiveSession = (id: string) => {
    if (!this.sessions.some((s) => s.id === id)) {
      return;
    }
    this.activeSessionId = id;
    this.profileManager.appData.activeSessionId = id;
    this.profileManager.saveAppData();
  };

  /** Activates the session `delta` tabs along, wrapping at either end. */
  activateAdjacentSession = (delta: 1 | -1) => {
    const index = this.sessions.indexOf(this.activeSession);
    const next = (index + delta + this.sessions.length) % this.sessions.length;
    this.setActiveSession(this.sessions[next].id);
  };

  renameSession = (id: string, name: string) => {
    this.sessions.find((s) => s.id === id)?.setName(name);
  };

  /**
   * Moves a session's tab so it sits at `targetIndex` in the strip. The target
   * is clamped to the strip; moving a tab onto its own position is a no-op.
   * Used by drag-and-drop, where "drop on a tab" means "take that tab's slot".
   */
  moveSessionTo = (id: string, targetIndex: number) => {
    const index = this.sessions.findIndex((s) => s.id === id);
    if (index === -1) {
      return;
    }
    const target = Math.max(0, Math.min(this.sessions.length - 1, targetIndex));
    if (target === index) {
      return;
    }
    const appData = this.profileManager.appData;
    const [session] = this.sessions.splice(index, 1);
    this.sessions.splice(target, 0, session);
    const dataIndex = appData.sessions.findIndex((s) => s.id === id);
    const [data] = appData.sessions.splice(dataIndex, 1);
    appData.sessions.splice(target, 0, data);
    this.profileManager.saveAppData();
  };

  /** Moves a session's tab one place left (-1) or right (+1). */
  moveSession = (id: string, delta: 1 | -1) => {
    const index = this.sessions.findIndex((s) => s.id === id);
    const target = index + delta;
    if (index === -1 || target < 0 || target >= this.sessions.length) {
      return;
    }
    this.moveSessionTo(id, target);
  };

  //================================================================================
  // The active session, as the views see it
  //================================================================================

  get settings() {
    return this.activeSession.settings;
  }

  get connController() {
    return this.activeSession.connController;
  }

  get terminals() {
    return this.activeSession.terminals;
  }

  get graphing() {
    return this.activeSession.graphing;
  }

  get logging() {
    return this.activeSession.logging;
  }

  get txLineController() {
    return this.activeSession.txLineController;
  }

  get presetController() {
    return this.activeSession.presetController;
  }

  get fakePortController() {
    return this.activeSession.fakePortController;
  }

  get numBytesReceived() {
    return this.activeSession.numBytesReceived;
  }

  get numBytesTransmitted() {
    return this.activeSession.numBytesTransmitted;
  }

  get rxRateBps() {
    return this.activeSession.rxRateBps;
  }

  get txRateBps() {
    return this.activeSession.txRateBps;
  }

  parseRxData(rxData: Uint8Array) {
    this.activeSession.parseRxData(rxData);
  }

  writeBytesToSerialPort(bytesToWrite: Uint8Array) {
    return this.activeSession.writeBytesToSerialPort(bytesToWrite);
  }

  sendBreakSignal() {
    return this.activeSession.sendBreakSignal();
  }

  sendPendingLine() {
    return this.activeSession.sendPendingLine();
  }

  handleTerminalKeyDown = (event: React.KeyboardEvent) => this.activeSession.handleTerminalKeyDown(event);

  openFindOnPreferredTerminal = () => {
    this.activeSession.openFindOnPreferredTerminal();
  };

  clearAllData = () => {
    this.activeSession.clearAllData();
  };

  //================================================================================
  // App-wide behaviour
  //================================================================================

  private updateTitle() {
    const session = this.activeSession;
    const preset = session.lastAppliedPresetName === 'No preset' ? '' : ` (${session.lastAppliedPresetName})`;
    document.title = `NinjaTerm - ${session.name}${preset}`;
  }

  /**
   * Cleanup method called when the app is shutting down.
   * Stops any active polling and cleans up resources.
   */
  cleanup = () => {
    for (const session of this.sessions) {
      session.cleanup();
    }
    this.stopRateCalculation();
    this.stopCpuMonitoring();
    this.soundPlayer.cleanup();
    this.profileManager.cleanup();

    if (this.titleReactionDispose) {
      this.titleReactionDispose();
      this.titleReactionDispose = null;
    }

    // Clean up auto-updater listeners
    if ((window as any).electronAPI?.updater) {
      (window as any).electronAPI.updater.removeAllUpdateListeners();
    }

    window.removeEventListener('beforeunload', this.cleanup);
  };

  /**
   * Called once when the React UI is loaded (specifically, when the App is rendered, by using a useEffect()).
   *
   * This is used to do things that can only be done once the UI is ready, e.g. enqueueSnackbar items.
   */
  async onAppUiLoaded() {
    // Auto-reconnection on startup is now handled through the PortSettings selectedSerialPort
  }

  setCloseSettingsDialogOnPortOpenOrClose(trueFalse: boolean) {
    this.closeSettingsDialogOnPortOpenOrClose = trueFalse;
  }

  /**
   * Starts the rate calculation timer. One timer updates every session.
   */
  private startRateCalculation() {
    if (this.rateCalculationInterval) {
      clearInterval(this.rateCalculationInterval);
    }

    this.rateCalculationInterval = setInterval(() => {
      for (const session of this.sessions) {
        session.updateTransmissionRates();
      }
    }, this.RATE_UPDATE_INTERVAL_MS);
  }

  /**
   * Stops the rate calculation timer.
   */
  private stopRateCalculation() {
    if (this.rateCalculationInterval) {
      clearInterval(this.rateCalculationInterval);
      this.rateCalculationInterval = null;
    }
  }

  /**
   * Formats a rate in bytes per second to a human-readable string.
   */
  formatRate(rateBps: number): string {
    if (rateBps === 0) {
      return '0 B/s';
    } else if (rateBps < 1000) {
      return `${Math.round(rateBps)} B/s`;
    } else if (rateBps < 1000000) {
      return `${(rateBps / 1000).toFixed(1)} kB/s`;
    } else {
      return `${(rateBps / 1000000).toFixed(1)} MB/s`;
    }
  }

  /**
   * Starts CPU monitoring by using a more comprehensive approach that measures
   * the main thread's busy vs idle time including React rendering.
   */
  private startCpuMonitoring() {
    let frameStartTime = performance.now();
    let busyTime = 0;
    let measurementStartTime = performance.now();

    const measureCpuUsage = () => {
      const now = performance.now();

      // Track the time spent in each frame
      const frameDuration = now - frameStartTime;
      frameStartTime = now;

      // If this frame took longer than 16.67ms (60fps), count the extra time as "busy"
      const targetFrameTime = 1000 / 60; // 16.67ms for 60fps
      if (frameDuration > targetFrameTime) {
        busyTime += (frameDuration - targetFrameTime);
      }

      const totalElapsed = now - measurementStartTime;

      // Calculate CPU usage every second
      if (totalElapsed >= this.CPU_MEASUREMENT_WINDOW_MS) {
        // Simple approach: measure how much time we're taking longer than ideal frame times
        // This captures both data processing and rendering overhead
        const cpuUsage = Math.min(100, (busyTime / totalElapsed) * 100);

        runInAction(() => {
          this.cpuUsagePercent = cpuUsage;
        });

        // Reset counters
        busyTime = 0;
        measurementStartTime = now;
      }

      // Use requestIdleCallback to get more accurate idle time measurements
      if (typeof requestIdleCallback !== 'undefined') {
        this.cpuMonitorIdleHandle = requestIdleCallback((deadline) => {
          this.cpuMonitorIdleHandle = null;
          // If we have very little idle time, we're CPU bound
          const availableTime = deadline.timeRemaining();
          if (availableTime < 1) { // Less than 1ms idle time indicates high CPU usage
            busyTime += 5; // Add penalty for no idle time
          }
        });
      }

      // Continue monitoring. Keep the handle so `stopCpuMonitoring` can end
      // the loop; before this it ran until the window unloaded.
      this.cpuMonitorRafHandle = requestAnimationFrame(measureCpuUsage);
    };

    measureCpuUsage();
  }

  /**
   * Stops CPU monitoring.
   */
  private stopCpuMonitoring() {
    if (this.cpuMonitorRafHandle !== null) {
      cancelAnimationFrame(this.cpuMonitorRafHandle);
      this.cpuMonitorRafHandle = null;
    }
    if (this.cpuMonitorIdleHandle !== null && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(this.cpuMonitorIdleHandle);
      this.cpuMonitorIdleHandle = null;
    }
  }

  /**
   * Sets up auto-updater event listeners for handling update notifications.
   */
  private setupAutoUpdater() {
    if (!(window as any).electronAPI?.updater) {
      return; // Auto-updater not available (e.g., in web version)
    }

    const electronAPI = (window as any).electronAPI;

    // Remove any existing listeners first to prevent memory leaks during hot reloads. If this is not done,
    // you eventually get warnings like this in the console:
    // VM4 sandbox_bundle:2 MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 update-not-available listeners added. Use emitter.setMaxListeners() to increase limit
    // at _addListener (node:electron/js2c/sandbox_bundle:2:43268)
    // at IpcRenderer.addListener (node:electron/js2c/sandbox_bundle:2:46156)
    // at Object.onUpdateNotAvailable (<anonymous>:49:28)
    electronAPI.updater.removeAllUpdateListeners();

    // Update available - show notification
    electronAPI.updater.onUpdateAvailable((updateInfo: any) => {
      this.snackbar.sendToSnackbar(
        `Update v${updateInfo.version} is available and will be downloaded in the background.`,
        'info'
      );
    });

    // Update not available
    electronAPI.updater.onUpdateNotAvailable((_updateInfo: any) => {
      console.log('No updates available');
      this.snackbar.sendToSnackbar('No updates available. You are running the latest version.', 'info');
    });

    // Update error
    electronAPI.updater.onUpdateError((error: any) => {
      this.snackbar.sendToSnackbar(
        `Update error: ${error.message || error}`,
        'error'
      );
    });

    // Download progress
    electronAPI.updater.onDownloadProgress((progressObj: any) => {
      const percent = Math.round(progressObj.percent);
      console.log(`Update download progress: ${percent}%`);
      // Could add a progress indicator to the UI here if desired
    });

    // Update downloaded - show install notification
    electronAPI.updater.onUpdateDownloaded((updateInfo: any) => {
      const actionButton = (key: any) => (
        <Button
          onClick={() => {
            closeSnackbar(key);
            this.installUpdate();
          }}
          style={{ color: 'white' }}
        >
          Restart & Install
        </Button>
      );

      this.snackbar.sendToSnackbar(
        `Update v${updateInfo.version} has been downloaded. Restart NinjaTerm to install.`,
        'success',
        actionButton,
        true // persist
      );
    });
  }

  /**
   * Finds the session an MCP request names, by id or (case-insensitively) by
   * name. No name means the active session.
   */
  resolveSessionRef = (ref: unknown): Session => {
    if (ref === undefined || ref === null || ref === '') {
      return this.activeSession;
    }
    const key = String(ref).trim().toLowerCase();
    const session =
      this.sessions.find((s) => s.id.toLowerCase() === key) ??
      this.sessions.find((s) => s.name.toLowerCase() === key);
    if (session === undefined) {
      throw new Error(`Unknown session "${ref}". Use list_sessions to see the open sessions.`);
    }
    return session;
  };

  /** The session summary the MCP tools return. */
  describeSession = (session: Session) => ({
    id: session.id,
    name: session.name,
    active: session.isActive,
    connectionState: session.connController.connState,
    connectionType: session.settings.portConfiguration.connectionType,
    portPath: session.settings.portConfiguration.selectedSerialPort?.path ?? null,
    baudRate: session.settings.portConfiguration.baudRate.appliedValue,
  });

  private setupMcp() {
    if (!(window as any).electronAPI?.mcp) {
      return; // MCP not available (e.g., in web version)
    }

    const electronAPI = (window as any).electronAPI;

    // Remove any stale listeners from hot reloads
    electronAPI.mcp.removeAllListeners();

    // Handle data requests from the main process MCP server
    electronAPI.mcp.onRequest(async ({ id, method, params }: { id: string; method: string; params: any }) => {
      try {
        let data: any;

        if (method === 'list_sessions') {
          data = { sessions: this.sessions.map(this.describeSession) };
        } else if (method === 'get_active_session') {
          data = this.describeSession(this.activeSession);
        } else if (method === 'get_terminal_output') {
          const session = this.resolveSessionRef(params.session);
          const lines = params.lines ?? 50;
          const terminal = session.terminals.txRxTerminal;
          const rows = terminal.terminalRows.slice(-lines);
          const text = rows.map((row) => row.text).join('\n');
          data = { session: this.describeSession(session), text };
        } else if (method === 'get_connection_status') {
          const session = this.resolveSessionRef(params.session);
          data = {
            ...this.describeSession(session),
            // Kept for clients written against the single-session shape.
            state: session.connController.connState,
          };
        } else if (method === 'send_data') {
          // Written through the session so it is echoed to its TX terminal and
          // logged like any other transmitted data, whatever the connection type.
          const session = this.resolveSessionRef(params.session);
          if (session.connController.connState !== ConnState.OPENED) {
            throw new Error(`Session "${session.name}" has no open connection.`);
          }
          const text = params.append_newline === false ? String(params.data) : `${params.data}\n`;
          const bytes = new TextEncoder().encode(text);
          await session.writeBytesToSerialPort(bytes);
          data = { session: this.describeSession(session), bytesSent: bytes.length };
        } else {
          throw new Error(`Unknown MCP method: ${method}`);
        }

        await electronAPI.mcp.respond(id, data);
      } catch (err) {
        await electronAPI.mcp.respond(id, null, (err as Error).message);
      }
    });

    // Auto-start the MCP server if enabled in settings
    if (this.profileManager.appData.mcpEnabled) {
      electronAPI.mcp.start(this.profileManager.appData.mcpPort);
    }
  }

  /**
   * Manually check for updates.
   */
  async checkForUpdates() {
    if (!(window as any).electronAPI?.updater) {
      this.snackbar.sendToSnackbar('Auto-updater not available in this version.', 'warning');
      return;
    }

    try {
      const result = await (window as any).electronAPI.updater.checkForUpdates();
      if (result.success) {
        this.snackbar.sendToSnackbar('Checking for updates...', 'info');
      } else {
        this.snackbar.sendToSnackbar(`Update check failed: ${result.error}`, 'error');
      }
    } catch (error) {
      this.snackbar.sendToSnackbar(`Update check failed: ${error}`, 'error');
    }
  }

  /**
   * Open Chrome developer tools.
   */
  async openDevTools() {
    if (!(window as any).electronAPI?.devtools) {
      this.snackbar.sendToSnackbar('Developer tools not available in this version.', 'warning');
      return;
    }

    try {
      const result = await (window as any).electronAPI.devtools.open();
      if (result.success) {
        this.snackbar.sendToSnackbar('Developer tools opened', 'info');
      } else {
        this.snackbar.sendToSnackbar(`Failed to open developer tools: ${result.error}`, 'error');
      }
    } catch (error) {
      this.snackbar.sendToSnackbar(`Failed to open developer tools: ${error}`, 'error');
    }
  }

  /**
   * Close Chrome developer tools.
   */
  async closeDevTools() {
    if (!(window as any).electronAPI?.devtools) {
      return;
    }

    try {
      const result = await (window as any).electronAPI.devtools.close();
      if (result.success) {
        this.snackbar.sendToSnackbar('Developer tools closed', 'info');
      } else {
        this.snackbar.sendToSnackbar(`Failed to close developer tools: ${result.error}`, 'error');
      }
    } catch (error) {
      this.snackbar.sendToSnackbar(`Failed to close developer tools: ${error}`, 'error');
    }
  }

  /**
   * Toggle Chrome developer tools.
   */
  async toggleDevTools() {
    if (!(window as any).electronAPI?.devtools) {
      this.snackbar.sendToSnackbar('Developer tools not available in this version.', 'warning');
      return;
    }

    try {
      const result = await (window as any).electronAPI.devtools.toggle();
      if (result.success) {
        const action = result.action === 'opened' ? 'opened' : 'closed';
        this.snackbar.sendToSnackbar(`Developer tools ${action}`, 'info');
      } else {
        this.snackbar.sendToSnackbar(`Failed to toggle developer tools: ${result.error}`, 'error');
      }
    } catch (error) {
      this.snackbar.sendToSnackbar(`Failed to toggle developer tools: ${error}`, 'error');
    }
  }

  /**
   * Install downloaded update and restart the application.
   */
  async installUpdate() {
    if (!(window as any).electronAPI?.updater) {
      return;
    }

    try {
      await (window as any).electronAPI.updater.quitAndInstall();
    } catch (error) {
      this.snackbar.sendToSnackbar(`Failed to install update: ${error}`, 'error');
    }
  }

  /**
   * Run performance tests to measure baseline performance and identify bottlenecks
   */
  async runPerformanceTests(): Promise<PerformanceTestSuiteResult> {
    const tester = new PerformanceTester(this);
    return await tester.runFullTestSuite();
  }

  /**
   * Get current performance report
   */
  getPerformanceReport(): string {
    return this.performanceMonitor.getPerformanceReport();
  }

  /** Central place which handles all key pressed in the app.
   * This includes:
   * - Key presses when a terminal pane is active. Data will be set out the serial port
   *   if it's a TXRX or TX terminal, the port is open and the key press is relevant.
   * - Pressing Ctrl-Shift-C to copy selected text to clipboard.
   * - Pressing "f" while on the Port Configuration settings.
   * - Pressing F5 to reload the app.
   * - Pressing F12 to toggle Chrome Developer Tools.
   * - Ctrl+Tab / Ctrl+Shift+Tab to move between sessions.
   *
   * Everything terminal-related is routed to the active session.
   */
  async handleKeyDown(event: React.KeyboardEvent) {
    const session = this.activeSession;
    // SPECIAL TESTING "FAKE PORTS"
    // Guard against firing while the user is typing into an input/textarea/contenteditable
    // (e.g. the RTT target device field also lives on the Connection Configuration pane).
    if (this.shownMainPane === MainPanes.SETTINGS && this.settings.activeSettingsCategory === SettingsCategories.CONNECTION_CONFIGURATION && event.key === 'f' && !isTypingInField(event)) {
      this.fakePortController.setIsDialogOpen(true);
    }
    //============================================
    // F5 RELOAD SHORTCUT
    //============================================
    else if (event.key === 'F5') {
      // F5 is pressed, reload the app
      window.location.reload();
    }
    //============================================
    // F12 DEVELOPER TOOLS SHORTCUT
    //============================================
    else if (event.key === 'F12') {
      // F12 is pressed, toggle developer tools
      event.preventDefault(); // Prevent default browser behavior
      await this.toggleDevTools();
    }
    //============================================
    // SESSION SWITCHING (Ctrl+Tab / Ctrl+Shift+Tab)
    //============================================
    else if (event.ctrlKey && event.key === 'Tab') {
      event.preventDefault();
      this.activateAdjacentSession(event.shiftKey ? -1 : 1);
    }
    //============================================
    // FIND-IN-SCROLLBACK SHORTCUT (Ctrl+F)
    //============================================
    // When `useCtrlFForFind` is disabled, this branch is skipped and the
    // event falls through to `handleTerminalKeyDown` so Ctrl+F sends the
    // ACK control byte (0x06) like a historic terminal would.
    else if (event.ctrlKey && !event.shiftKey && (event.key === 'f' || event.key === 'F') && this.shownMainPane === MainPanes.TERMINAL && this.settings.txSettings.useCtrlFForFind) {
      event.preventDefault(); // suppress the browser's built-in find dialog
      session.openFindOnPreferredTerminal();
    }
    //============================================
    // COPY KEYBOARD SHORTCUT
    //============================================
    else if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      // Ctrl-Shift-C is pressed
      session.handleCopyToClipboard(event);
    }
    //============================================
    // SMART CTRL-C: copy if text selected, else send 0x03
    //============================================
    else if (event.ctrlKey && !event.shiftKey && event.key === 'c' && this.settings.txSettings.useCtrlCVForCopyPaste) {
      if (session.hasTerminalSelection()) {
        session.handleCopyToClipboard(event);
        // Clear cached selection so a second Ctrl-C sends 0x03
        session.clearTerminalSelectionCache();
        window.getSelection()?.removeAllRanges();
      } else if (this.shownMainPane === MainPanes.TERMINAL && !isTypingInField(event)) {
        // No selection — pass through as terminal control code (0x03)
        session.handleTerminalKeyDown(event);
      }
    }
    //============================================
    // PASTE KEYBOARD SHORTCUT
    //============================================
    else if (event.ctrlKey && event.shiftKey && event.key === 'V') {
      // Ctrl-Shift-V is pressed, handle paste
      await session.handlePasteFromClipboard(event);
    }
    //============================================
    // SMART CTRL-V: paste from clipboard
    //============================================
    else if (event.ctrlKey && !event.shiftKey && event.key === 'v' && this.settings.txSettings.useCtrlCVForCopyPaste) {
      await session.handlePasteFromClipboard(event);
    }
    //=============================================
    // TERMINAL DATA
    //=============================================
    else if (this.shownMainPane === MainPanes.TERMINAL && !isTypingInField(event)) {
      // Terminal pane is shown and the user isn't typing into a settings
      // field / find bar / other input — route the keystroke to the active
      // terminal. There is no notion of click-focus; the active terminal is
      // determined entirely by single-vs-split pane mode.
      session.handleTerminalKeyDown(event);
    }
  }

  /**
   * Sets the main pane to be shown.
   */
  setShownMainPane(newPane: MainPanes) {
    this.shownMainPane = newPane;
  }

  setShowCircularProgressModal(show: boolean) {
    this.showCircularProgressModal = show;
  }
}
