/* eslint-disable no-console */
// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable, reaction, runInAction } from 'mobx';
import { closeSnackbar } from 'notistack';
// import ReactGA from 'react-ga4';
import { Button } from '@mui/material';

// Import package.json to read out the version number
import { log, initLogging } from './Util/Log';
import packageDotJson from '../../../../package.json' with { type: 'json' };
import { Settings, SettingsCategories } from './Settings/Settings';
import { DataViewConfiguration } from './Settings/DisplaySettings/DisplaySettings';
import SnackbarController from './SnackbarController/SnackbarController';
import Graphing from './Graphing/Graphing';
import Logging from './Logging/Logging';
import FakePortsController from './FakePorts/FakePortsController';
import { ConnState } from './Settings/PortSettings/PortSettings';
import Terminals from './Terminals/Terminals';
import { SingleTerminal, DataDirection } from './Terminals/SingleTerminal/SingleTerminal';
import { BackspaceKeyPressBehavior, DeleteKeyPressBehavior, EnterKeyPressBehavior } from './Settings/TxSettings/TxSettings';
import { SelectionInfo } from './SelectionController/SelectionController';
import { isRunningOnWindows } from './Util/Util';
import { AppDataManager } from './AppDataManager/AppDataManager';
import PerformanceMonitor from './Performance/PerformanceMonitor';
import PerformanceTester, { PerformanceTestSuiteResult } from './Performance/PerformanceTester';
import { ConnController } from './ConnController/ConnController';
import { SoundPlayer } from './Util/SoundPlayer';

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
 * Enumerates the possible things to display as the "main pane".
 * This is the large pane that takes up most of the screen.
 */
export enum MainPanes {
  SETTINGS,
  TERMINAL,
  GRAPHING,
  LOGGING,
}

/**
 * Returns true if the keyboard event originated from an editable element (input, textarea,
 * select, or contenteditable). Used to suppress plain-letter app shortcuts while the user
 * is typing into a form field.
 */
function isTypingInField(event: React.KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export class App {
  settings: Settings;

  // If true, the settings dialog will be automatically closed on port open or close
  closeSettingsDialogOnPortOpenOrClose = true;

  rxData = '';

  numBytesReceived: number;

  numBytesTransmitted: number;

  // Rate tracking for TX/RX
  rxRateBps: number = 0;
  txRateBps: number = 0;

  // Time window for rate calculation (in milliseconds)
  private readonly RATE_CALCULATION_WINDOW_MS = 3000; // 3 seconds
  private readonly RATE_UPDATE_INTERVAL_MS = 500; // Update every 500ms

  // Hard cap so a burst of small chunks (e.g. one BLE notification per byte)
  // can't grow these arrays without bound between cleanup ticks. With a
  // 500ms cleanup interval, 2048 entries is well above the chunk count any
  // real transport would produce in that window.
  private readonly MAX_DATA_POINTS = 2048;

  // Arrays to track byte counts over time
  private rxDataPoints: Array<{ timestamp: number; bytes: number }> = [];
  private txDataPoints: Array<{ timestamp: number; bytes: number }> = [];

  // Timer for rate calculations
  private rateCalculationInterval: NodeJS.Timeout | null = null;

  // Disposer for the title-update reaction. Captured at register-time so
  // cleanup() can release it; without this, recreating App (e.g. on hot
  // reload during dev) leaves stale reactions firing forever.
  private titleReactionDispose: (() => void) | null = null;

  // Disposer for the connection-state reaction that drives auto-response
  // macros' on-connect / on-disconnect triggers (issue #364).
  private connStateReactionDispose: (() => void) | null = null;

  // CPU usage tracking
  cpuUsagePercent: number = 0;

  // CPU monitoring variables - measuring overall renderer process load
  private readonly CPU_MEASUREMENT_WINDOW_MS = 1000; // 1 second window

  // If true app is being tested by code.
  // Used for force terminal height to value when browser is not
  // available to determine height
  testing: boolean;

  // Version of the NinjaTerm app. Read from package.json
  version: string;

  snackbar: SnackbarController;

  shownMainPane: MainPanes;

  terminals: Terminals;

  graphing: Graphing;

  logging: Logging;

  fakePortController: FakePortsController = new FakePortsController(this);

  profileManager: AppDataManager;

  // selectionController: SelectionController = new SelectionController();

  // SelectionController = SelectionController;

  showCircularProgressModal = false;

  performanceMonitor: PerformanceMonitor;

  /**
   * Responsible for all connection related functionality. This supports different types of connections (serial port, socket, Bluetooth).
   */
  connController: ConnController;

  /**
   * Sound player for playing audio feedback based on received data.
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
    this.settings = new Settings(this);

    this.snackbar = new SnackbarController();

    this.performanceMonitor = new PerformanceMonitor();

    this.connController = new ConnController(this);

    this.soundPlayer = new SoundPlayer();

    this.terminals = new Terminals(this);

    this.numBytesReceived = 0;
    this.numBytesTransmitted = 0;

    // Show the terminal by default
    this.shownMainPane = MainPanes.TERMINAL;

    // Create graphing instance. Graphing is disabled by default.
    this.graphing = new Graphing(this.snackbar, this.profileManager);

    this.logging = new Logging(this);

    // Listen for changes to the last applied profile name, and update the app title
    this.titleReactionDispose = reaction(
      () => this.profileManager.lastAppliedProfileName,
      this.onLastAppliedProfileNameChanged,
    );
    this.onLastAppliedProfileNameChanged();

    // Drive auto-response macros: fire on-connect macros each time the port
    // transitions to OPENED, and reset the RX-line buffer on close so a
    // stale partial line can't bleed into the next session (issue #364).
    this.connStateReactionDispose = reaction(
      () => this.connController.connState,
      (state) => {
        const macroController = this.terminals.rightDrawer.macroController;
        if (state === ConnState.OPENED) {
          macroController.onConnect();
        } else if (state === ConnState.CLOSED) {
          macroController.onDisconnect();
        }
      },
    );

    // Close any existing ports which might be open in the main process, and remove
    // all IPC event listeners.
    window.electronAPI.serial.closeAllPortsAndRemoveListeners();

    // Close any existing socket connections which might be open in the main process, and remove
    // all IPC event listeners.
    window.electronAPI.socket.disconnectAllSocketsAndRemoveListeners();

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

    makeAutoObservable(this); // Make sure this near the end
  }

  onLastAppliedProfileNameChanged = () => {
    // Set the title of the app to the last applied profile name
    document.title = `NinjaTerm - ${this.profileManager.lastAppliedProfileName}`;
  };

  /**
   * Cleanup method called when the app is shutting down.
   * Stops any active polling and cleans up resources.
   */
  cleanup = () => {
    this.connController.cleanup();
    this.stopRateCalculation();
    this.stopCpuMonitoring();
    this.soundPlayer.cleanup();
    this.profileManager.cleanup();

    if (this.titleReactionDispose) {
      this.titleReactionDispose();
      this.titleReactionDispose = null;
    }

    if (this.connStateReactionDispose) {
      this.connStateReactionDispose();
      this.connStateReactionDispose = null;
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

  // Serial port connection and auto-reconnection is now handled through PortSettings

  setCloseSettingsDialogOnPortOpenOrClose(trueFalse: boolean) {
    this.closeSettingsDialogOnPortOpenOrClose = trueFalse;
  }

  /**
   * Starts the rate calculation timer.
   */
  private startRateCalculation() {
    if (this.rateCalculationInterval) {
      clearInterval(this.rateCalculationInterval);
    }

    this.rateCalculationInterval = setInterval(() => {
      this.updateTransmissionRates();
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
   * Updates the transmission rates by calculating averages over the time window.
   */
  private updateTransmissionRates() {
    const now = Date.now();
    const cutoffTime = now - this.RATE_CALCULATION_WINDOW_MS;

    // Remove old data points
    this.rxDataPoints = this.rxDataPoints.filter(point => point.timestamp > cutoffTime);
    this.txDataPoints = this.txDataPoints.filter(point => point.timestamp > cutoffTime);

    // Calculate rates (bytes per second)
    const rxTotalBytes = this.rxDataPoints.reduce((sum, point) => sum + point.bytes, 0);
    const txTotalBytes = this.txDataPoints.reduce((sum, point) => sum + point.bytes, 0);

    const timeWindowInSeconds = this.RATE_CALCULATION_WINDOW_MS / 1000;

    runInAction(() => {
      this.rxRateBps = rxTotalBytes / timeWindowInSeconds;
      this.txRateBps = txTotalBytes / timeWindowInSeconds;
    });
  }

  /**
   * Records a data point for RX rate calculation.
   */
  private recordRxDataPoint(bytes: number) {
    this.rxDataPoints.push({
      timestamp: Date.now(),
      bytes: bytes
    });
    if (this.rxDataPoints.length > this.MAX_DATA_POINTS) {
      // Drop the oldest entries. Splice from index 0 keeps the tail in place
      // and is fine at this small scale (cap is 2048).
      this.rxDataPoints.splice(0, this.rxDataPoints.length - this.MAX_DATA_POINTS);
    }
  }

  /**
   * Records a data point for TX rate calculation.
   */
  private recordTxDataPoint(bytes: number) {
    this.txDataPoints.push({
      timestamp: Date.now(),
      bytes: bytes
    });
    if (this.txDataPoints.length > this.MAX_DATA_POINTS) {
      this.txDataPoints.splice(0, this.txDataPoints.length - this.MAX_DATA_POINTS);
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
        requestIdleCallback((deadline) => {
          // If we have very little idle time, we're CPU bound
          const availableTime = deadline.timeRemaining();
          if (availableTime < 1) { // Less than 1ms idle time indicates high CPU usage
            busyTime += 5; // Add penalty for no idle time
          }
        });
      }

      // Continue monitoring
      requestAnimationFrame(measureCpuUsage);
    };

    measureCpuUsage();
  }

  /**
   * Stops CPU monitoring.
   */
  private stopCpuMonitoring() {
    // CPU monitoring is handled by requestAnimationFrame and requestIdleCallback
    // These will stop when the window is unloaded
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

        if (method === 'get_terminal_output') {
          const lines = params.lines ?? 50;
          const terminal = this.terminals.txRxTerminal;
          const rows = terminal.terminalRows.slice(-lines);
          const text = rows.map((row: any) => row.terminalChars.map((c: any) => c.char).join('')).join('\n');
          data = { text };
        } else if (method === 'get_connection_status') {
          data = {
            state: this.connController.connState,
            portPath: this.settings.portConfiguration.selectedSerialPort?.path ?? null,
            baudRate: this.settings.portConfiguration.baudRate,
          };
        } else {
          throw new Error(`Unknown MCP method: ${method}`);
        }

        await electronAPI.mcp.respond(id, data);
      } catch (err) {
        await electronAPI.mcp.respond(id, null, (err as Error).message);
      }
    });

    // Auto-start the MCP server if enabled in settings
    if (this.settings.generalSettings.mcpEnabled) {
      electronAPI.mcp.start(this.settings.generalSettings.mcpPort);
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
   * This is called from whatever connection type is currently being used. All data should be funnelled through this function no matter what the connection type is.
   *
   * @param rxData The received data.
   */
  parseRxData(rxData: Uint8Array) {
    // Start performance monitoring for data processing
    this.performanceMonitor.startTiming('dataProcessing');

    // Process data immediately
    this.performanceMonitor.startTiming('terminalRender');
    this.terminals.txRxTerminal.parseData(rxData, DataDirection.RX);
    this.terminals.rxTerminal.parseData(rxData, DataDirection.RX);
    this.performanceMonitor.endTiming('terminalRender');

    this.performanceMonitor.startTiming('graphingProcessing');
    this.graphing.parseData(rxData);
    this.performanceMonitor.endTiming('graphingProcessing');

    this.logging.handleRxData(rxData);

    // Auto-response macros: feed raw RX bytes into the macro controller's
    // line matcher. TX (including local echo) never enters parseRxData, so
    // a macro can't accidentally trigger itself via its own response.
    this.terminals.rightDrawer.macroController.onRxBytes(rxData);

    // Sound playback for matching regex rules is driven by per-row reactions
    // in `SingleTerminal` (see the `_setupRuleSoundReaction` setup there),
    // not from this raw-byte path. That gives line-level granularity and
    // avoids re-firing as bytes trickle in.

    // End performance monitoring and record metrics
    const totalProcessingTime = this.performanceMonitor.endTiming('dataProcessing');
    this.performanceMonitor.recordDataProcessing(rxData.length, totalProcessingTime);

    // Update stats
    this.numBytesReceived += rxData.length;
    this.recordRxDataPoint(rxData.length);

    // Push raw text to MCP service for streaming resource subscribers
    if (this.settings.generalSettings.mcpEnabled) {
      const text = new TextDecoder('utf-8', { fatal: false }).decode(rxData);
      window.electronAPI.mcp.pushRxData(text);
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
   */
  async handleKeyDown(event: React.KeyboardEvent) {
    // console.log('handleKeyDown() called. event.key=', event.key);
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
    // FIND-IN-SCROLLBACK SHORTCUT (Ctrl+F)
    //============================================
    // When `useCtrlFForFind` is disabled, this branch is skipped and the
    // event falls through to `handleTerminalKeyDown` so Ctrl+F sends the
    // ACK control byte (0x06) like a historic terminal would.
    else if (event.ctrlKey && !event.shiftKey && (event.key === 'f' || event.key === 'F') && this.shownMainPane === MainPanes.TERMINAL && this.settings.txSettings.useCtrlFForFind) {
      event.preventDefault(); // suppress the browser's built-in find dialog
      this.openFindOnPreferredTerminal();
    }
    //============================================
    // COPY KEYBOARD SHORTCUT
    //============================================
    else if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      // Ctrl-Shift-C is pressed
      this.handleCopyToClipboard(event);
    }
    //============================================
    // SMART CTRL-C: copy if text selected, else send 0x03
    //============================================
    else if (event.ctrlKey && !event.shiftKey && event.key === 'c' && this.settings.txSettings.useCtrlCVForCopyPaste) {
      const terminalsToCheck = [this.terminals.txRxTerminal, this.terminals.txTerminal, this.terminals.rxTerminal];
      const hasSelection = terminalsToCheck.some(t => t.getSelectionInfoIfWithinTerminal() !== null);
      if (hasSelection) {
        this.handleCopyToClipboard(event);
        // Clear cached selection so a second Ctrl-C sends 0x03
        for (const t of terminalsToCheck) {
          t.lastKnownSelectionInfo = null;
        }
        window.getSelection()?.removeAllRanges();
      } else if (this.shownMainPane === MainPanes.TERMINAL && !isTypingInField(event)) {
        // No selection — pass through as terminal control code (0x03)
        this.handleTerminalKeyDown(event);
      }
    }
    //============================================
    // PASTE KEYBOARD SHORTCUT
    //============================================
    else if (event.ctrlKey && event.shiftKey && event.key === 'V') {
      // Ctrl-Shift-V is pressed, handle paste
      await this.handlePasteFromClipboard(event);
    }
    //============================================
    // SMART CTRL-V: paste from clipboard
    //============================================
    else if (event.ctrlKey && !event.shiftKey && event.key === 'v' && this.settings.txSettings.useCtrlCVForCopyPaste) {
      await this.handlePasteFromClipboard(event);
    }
    //=============================================
    // TERMINAL DATA
    //=============================================
    else if (this.shownMainPane === MainPanes.TERMINAL && !isTypingInField(event)) {
      // Terminal pane is shown and the user isn't typing into a settings
      // field / find bar / other input — route the keystroke to the active
      // terminal. There is no notion of click-focus; the active terminal is
      // determined entirely by single-vs-split pane mode.
      this.handleTerminalKeyDown(event);
    }
  }

  /**
   * Pastes text from the clipboard to the serial port.
   * Called by both Ctrl-Shift-V and smart Ctrl-V.
   */
  private async handlePasteFromClipboard(event: React.KeyboardEvent) {
    event.preventDefault();
    // Get clipboard text and send it out the serial port. Paste is allowed
    // whenever the terminal pane is shown and the user isn't typing into a
    // form field — the active terminal is the implicit target.
    let text = await navigator.clipboard.readText();

    // Convert CRLF to LF if setting is enabled
    if (this.settings.generalSettings.whenPastingOnWindowsReplaceCRLFWithLF && isRunningOnWindows()) {
      text = text.replace(/\r\n/g, '\n');
    }

    // Make sure serial port is open
    if (this.connController.connState !== ConnState.OPENED) {
      return;
    }

    // Only paste if the terminal pane is the active view and no input field
    // is currently absorbing keys.
    if (this.shownMainPane !== MainPanes.TERMINAL || isTypingInField(event)) {
      return;
    }

    // Convert string to Uint8Array
    const dataAsUint8Array = new TextEncoder().encode(text);
    await this.writeBytesToSerialPort(dataAsUint8Array);
  }

  /**
   * This is called when the user presses Ctrl-Shift-C. It copies the selected text
   * to the clipboard.
   * @param event The keyboard event.
   * @returns
   */
  /**
   * Opens the Find bar on the terminal that contains the most searchable
   * data: the combined pane in single mode, the RX pane in separate-TX/RX
   * mode. With click-focus removed there's no per-user-action variation to
   * consider — the target is purely a function of pane mode.
   *
   * Public so the toolbar Find button in `TerminalsView` can share the same
   * targeting logic as the Ctrl+F keyboard shortcut.
   */
  openFindOnPreferredTerminal() {
    const isSeparate = this.settings.displaySettings.dataViewConfiguration === DataViewConfiguration.SEPARATE_TX_RX_TERMINALS;
    const target = isSeparate ? this.terminals.rxTerminal : this.terminals.txRxTerminal;
    target.openFind();
  }

  private handleCopyToClipboard(event: React.KeyboardEvent) {
    // Prevents Ctrl-Shift-C from opening the browser's dev tools
    event.preventDefault();
    event.stopPropagation();

    // console.log('handleCopyToClipboard() called.');
    const selection = window.getSelection();
    if (selection === null) {
      return;
    }

    // Work out if the selection is contained within a single terminal pane, and if so,
    // handle the copy in a special manner (no just a basic toString())
    const terminalsToCheck = [this.terminals.txRxTerminal, this.terminals.txTerminal, this.terminals.rxTerminal];
    let terminalSelectionWasIn: SingleTerminal | null = null;
    let selectionInfo: SelectionInfo | null = null;
    for (let i = 0; i < terminalsToCheck.length; i += 1) {
      const terminal = terminalsToCheck[i];
      selectionInfo = terminal.getSelectionInfoIfWithinTerminal();
      if (selectionInfo !== null) {
        // Found a terminal that the selection is contained within, break out of loop
        terminalSelectionWasIn = terminal;
        break;
      }
    }

    // Selection lives in one terminal pane = walk it ourselves; otherwise
    // fall back to a plain `toString()` of the live DOM selection.
    // WARNING: As per spec at https://w3c.github.io/clipboard-apis/#dom-clipboard-writetext,
    //   on Windows we should replace `\n` with `\r\n` before creating a textBlob.
    const clipboardText = selectionInfo !== null
      ? this.extractClipboardTextFromTerminal(selectionInfo, terminalSelectionWasIn!)
      : selection.toString();

    navigator.clipboard.writeText(clipboardText);
    // Create toast telling user that text was copied to clipboard
    this.snackbar.sendToSnackbar(`${clipboardText.length} chars copied to clipboard.`, 'success');
  }

  /**
   * Given selection info and the terminal the selection was in, this function walks through the rows
   * contained in the selection and extracts the text suitable for copying to the clipboard.
   *
   * @param selectionInfo Information about the selection, generated by the SelectionController.
   * @param terminalSelectionWasIn The terminal that the selection was wholly contained within.
   * @returns Text extracted from the terminal rows, suitable for copying to the clipboard.
   */
  private extractClipboardTextFromTerminal(selectionInfo: SelectionInfo, terminalSelectionWasIn: SingleTerminal): string {
    // Extract number from end of the row ID
    // row ID is in form <terminal id>-row-<number>
    const firstRowIdNumOnly = parseInt(selectionInfo.firstRowId.split('-').slice(-1)[0]);
    const lastRowIdNumOnly = parseInt(selectionInfo.lastRowId.split('-').slice(-1)[0]);

    // Get the index of these row numbers in the terminal
    const firstRowIndex = terminalSelectionWasIn!.terminalRows.findIndex((row) => row.uniqueRowId === firstRowIdNumOnly);
    const lastRowIndex = terminalSelectionWasIn!.terminalRows.findIndex((row) => row.uniqueRowId === lastRowIdNumOnly);

    // Iterate from the first to the last row, and extract the text from each row
    let textToCopy = '';
    for (let i = firstRowIndex; i <= lastRowIndex; i += 1) {
      const terminalRow = terminalSelectionWasIn.terminalRows[i];

      // Add a newline character between each successive row, except if:
      //    - The terminal row was created due to wrapping AND setting is enabled.
      //    This means the user can paste the text into
      //    a text editor and it won't have additional new lines added just because the text wrapped in
      //    the terminal. New lines will only be added if the terminal row was created because of
      //    a new line character or an ANSI escape sequence (e.g. cursor down).
      if (i !== firstRowIndex && (terminalRow.wasCreatedDueToWrapping === false || !this.settings.generalSettings.whenCopyingToClipboardDoNotAddLFIfRowWasCreatedDueToWrapping)) {
        textToCopy += '\n';
      }

      if (i === firstRowIndex && i === lastRowIndex) {
        // If this is the first and last row, only copy from the start to the end of the selection
        textToCopy += terminalRow.getText().slice(selectionInfo.firstColIdx, selectionInfo.lastColIdx);
      } else if (i === firstRowIndex) {
        // If this is the first row, only copy from the start of the selection
        textToCopy += terminalRow.getText().slice(selectionInfo.firstColIdx);
      } else if (i === lastRowIndex) {
        // If this is the last row, only copy to the end of the selection
        textToCopy += terminalRow.getText().slice(0, selectionInfo.lastColIdx);
      } else {
        // If this is neither the first nor the last row, copy the entire row
        textToCopy += terminalRow.getText();
      }
    }

    return textToCopy;
  }

  /**
   * This is called from either the TX/RX terminal or TX terminal
   * (i.e. any terminal pane that is allowed to send data). This function
   * determines what the user has pressed and what data to send out the
   * serial port because of it.
   *
   * This needs to use an arrow function because it's being passed around
   * as a callback. Tried to bind to this in constructor, didn't work.
   *
   * @param event The React keydown event.
   */
  handleTerminalKeyDown = async (event: React.KeyboardEvent) => {
    // console.log('handleTerminalKeyDown() called. event=', event);

    // Capture all key presses and prevent default actions or bubbling.
    // preventDefault() prevents a Tab press from moving focus to another element on screen
    event.preventDefault();
    event.stopPropagation();

    if (this.connController.connState !== ConnState.OPENED) {
      // Serial port is not open, so don't send anything
      return;
    }

    // Serial port is open, let's send it to the serial
    // port

    // Convert event.key to required ASCII number. This would be easier if we could
    // use keyCode, but this method is deprecated!
    const bytesToWrite: number[] = [];
    // List of allowed symbols, includes space char also
    const symbols = '`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/? ';

    // List of all alphanumeric chars
    const alphabeticChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqurstuvwxyz';
    const alphaNumericChars = alphabeticChars + '0123456789';
    let sendBreakSignal = false;
    if (event.key === 'Control' || event.key === 'Shift' || event.key === 'Alt') {
      // Don't send anything if a control/shift/alt key was pressed by itself
      return;
    }
    //===========================================================
    // Ctrl-Shift-B: Send break signal
    //===========================================================
    else if (event.ctrlKey && event.shiftKey && event.key === 'B') {
      // Set flag to true, this is handled at the bottom of the function
      // and determines whether we send the break signal or data.
      sendBreakSignal = true;
    } else if (event.ctrlKey) {
      // Most presses with the Ctrl key held down should do nothing. One exception is
      // if sending 0x01-0x1A when Ctrl-A through Ctrl-Z is pressed is enabled
      if (this.settings.txSettings.send0x01Thru0x1AWhenCtrlAThruZPressed && event.key.length === 1 && alphabeticChars.includes(event.key)) {
        // Ctrl-A through Ctrl-Z is has been pressed
        // Send 0x01 through 0x1A, which is easily done by getting the char, converting to
        // uppercase if lowercase and then subtracting 64
        bytesToWrite.push(event.key.toUpperCase().charCodeAt(0) - 64);
      } else {
        // Ctrl key was pressed, but we don't want to send anything
        return;
      }
    } else if (event.altKey) {
      if (this.settings.txSettings.sendEscCharWhenAltKeyPressed && event.key.length === 1 && alphabeticChars.includes(event.key)) {
        // Alt-A through Alt-Z is has been pressed
        // Send ESC char (0x1B) followed by the char
        bytesToWrite.push(0x1b);
        bytesToWrite.push(event.key.charCodeAt(0));
      } else {
        // Alt key was pressed with another key, but we don't want to do anything with it
        return;
      }
    } else if (event.key === 'Enter') {
      if (this.settings.txSettings.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_LF) {
        bytesToWrite.push(0x0a);
      } else if (this.settings.txSettings.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_CR) {
        bytesToWrite.push(0x0d);
      } else if (this.settings.txSettings.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_CRLF) {
        bytesToWrite.push(0x0d);
        bytesToWrite.push(0x0a);
      } else if (this.settings.txSettings.enterKeyPressBehavior === EnterKeyPressBehavior.SEND_BREAK) {
        await this.sendBreakSignal();
      } else {
        throw Error('Unsupported enter key press behavior!');
      }
    } else if (event.key.length === 1 && alphaNumericChars.includes(event.key)) {
      // Pressed key is alphanumeric
      bytesToWrite.push(event.key.charCodeAt(0));
    } else if (event.key.length === 1 && symbols.includes(event.key)) {
      // Pressed key is a symbol (e.g. ';?.,<>)
      // Do same thing as with alphanumeric cars
      bytesToWrite.push(event.key.charCodeAt(0));
    }
    //===========================================================
    // HANDLE BACKSPACE AND DELETE KEY PRESSES
    //===========================================================
    else if (event.key === 'Backspace') {
      // Work out whether to send BS (0x08) or DEL (0x7F) based on settings
      if (this.settings.txSettings.backspaceKeyPressBehavior === BackspaceKeyPressBehavior.SEND_BACKSPACE) {
        bytesToWrite.push(0x08);
      } else if (this.settings.txSettings.backspaceKeyPressBehavior === BackspaceKeyPressBehavior.SEND_DELETE) {
        bytesToWrite.push(0x7f);
      } else {
        throw Error('Unsupported backspace key press behavior!');
      }
    } else if (event.key === 'Delete') {
      // Delete also has the option of sending [ESC][3~
      if (this.settings.txSettings.deleteKeyPressBehavior === DeleteKeyPressBehavior.SEND_BACKSPACE) {
        bytesToWrite.push(0x08);
      } else if (this.settings.txSettings.deleteKeyPressBehavior === DeleteKeyPressBehavior.SEND_DELETE) {
        bytesToWrite.push(0x7f);
      } else if (this.settings.txSettings.deleteKeyPressBehavior === DeleteKeyPressBehavior.SEND_VT_SEQUENCE) {
        bytesToWrite.push(0x1b, '['.charCodeAt(0), '3'.charCodeAt(0), '~'.charCodeAt(0));
      } else {
        throw Error('Unsupported delete key press behavior!');
      }
    }
    //===========================================================
    // HANDLE ARROW KEY PRESSES
    //===========================================================
    else if (event.key === 'ArrowLeft') {
      // Send 'ESC[D' (go back 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'D'.charCodeAt(0));
    } else if (event.key === 'ArrowRight') {
      // Send 'ESC[C' (go forward 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'C'.charCodeAt(0));
    } else if (event.key === 'ArrowUp') {
      // Send 'ESC[A' (go up 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'A'.charCodeAt(0));
    } else if (event.key === 'ArrowDown') {
      // Send 'ESC[B' (go down 1)
      bytesToWrite.push(0x1b, '['.charCodeAt(0), 'B'.charCodeAt(0));
    } else if (event.key === 'Tab') {
      // Send horizontal tab, HT, 0x09
      bytesToWrite.push(0x09);
    } else {
      // If we get here, we don't know what to do with the key press
      console.log('Unsupported char! event=', event);
      return;
    }

    // If we get here, we are either:
    // 1. Sending a break signal
    // 2. Sending data
    // In all other cases, we would have returned by now.
    // It is now safe to enable autoscroll to the bottom
    // if the setting is enabled. If we had done it above it would be buggy,
    // for example the user could be pressing Ctrl-Shift-C to copy text to the clipboard
    // and the autoscroll would suddenly be enabled.
    if (this.settings.displaySettings.autoScrollLockOnTx) {
      // Only the active terminal can produce typed-TX traffic now (no
      // click-focus), so lock its scroll directly.
      this.terminals.activeTerminal.setScrollLock(true);
    }

    if (sendBreakSignal) {
      await this.sendBreakSignal();
    } else {
      await this.writeBytesToSerialPort(Uint8Array.from(bytesToWrite));
    }
  };

  /**
   * Sends a break signal to the serial port for 200ms. Port must be open otherwise an error will be shown.
   */
  async sendBreakSignal() {
    // TODO: Implement break signal support in the main process IPC handlers
    this.snackbar.sendToSnackbar('Break signal not yet implemented in Electron version.', 'warning');
  }

  /**
   * Writes bytes to the serial port. Also:
   * - Sends the data to the TX terminal view
   * - Sends the data to the TX/RX terminal view, if local TX echo is enabled.
   * - Sends the data to the logger.
   *
   * @param bytesToWrite
   */
  async writeBytesToSerialPort(bytesToWrite: Uint8Array) {
    try {
      await this.connController.writeData(bytesToWrite);
    } catch (error) {
      this.snackbar.sendToSnackbar(`Error writing data: ${error}`, 'error');
      return;
    }

    this.terminals.txTerminal.parseData(bytesToWrite, DataDirection.TX);
    // Check if local TX echo is enabled, and if so, send the data to
    // the combined single terminal.
    if (this.settings.rxSettings.localTxEcho) {
      this.terminals.txRxTerminal.parseData(bytesToWrite, DataDirection.TX);
    }

    // Also send this data to the logger, it may need it
    this.logging.handleTxData(bytesToWrite);

    runInAction(() => {
      this.numBytesTransmitted += bytesToWrite.length;
    });

    // Record data point for rate calculation
    this.recordTxDataPoint(bytesToWrite.length);
  }

  clearAllData() {
    this.terminals.txRxTerminal.clear();
    this.terminals.txTerminal.clear();
    this.terminals.rxTerminal.clear();
  }

  /**
   * Sets the main pane to be shown.
   */
  setShownMainPane(newPane: MainPanes) {
    this.shownMainPane = newPane;
  }

  // PWA methods removed - not needed in Electron app

  setShowCircularProgressModal(show: boolean) {
    this.showCircularProgressModal = show;
  }
}
