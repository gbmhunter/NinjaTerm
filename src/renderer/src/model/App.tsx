/* eslint-disable no-console */
// eslint-disable-next-line max-classes-per-file
import { makeAutoObservable, reaction, runInAction } from 'mobx';
import { closeSnackbar } from 'notistack';
// import ReactGA from 'react-ga4';
import { Button } from '@mui/material';

// Import package.json to read out the version number
declare const __PACKAGE_JSON__: { version: string };
const packageDotJson = __PACKAGE_JSON__;
// eslint-disable-next-line import/no-cycle
import { Settings, SettingsCategories } from './Settings/Settings';
import SnackbarController from './SnackbarController/SnackbarController';
import Graphing from './Graphing/Graphing';
import Logging from './Logging/Logging';
import FakePortsController from './FakePorts/FakePortsController';
import { PortState } from './Settings/PortSettings/PortSettings';
import Terminals from './Terminals/Terminals';
import { SingleTerminal, DataDirection } from './Terminals/SingleTerminal/SingleTerminal';
import { BackspaceKeyPressBehavior, DeleteKeyPressBehavior, EnterKeyPressBehavior } from './Settings/TxSettings/TxSettings';
import { SelectionController, SelectionInfo } from './SelectionController/SelectionController';
import { isRunningOnWindows } from './Util/Util';
import { LastUsedSerialPort, AppDataManager } from './AppDataManager/AppDataManager';
import { PortInfo } from '@serialport/bindings-interface';
import PerformanceMonitor from './Performance/PerformanceMonitor';
import PerformanceTester, { PerformanceTestSuiteResult } from './Performance/PerformanceTester';

declare global {
  interface String {
    insert(index: number, string: string): string;
  }

  // We save the created app instance to window.app (done in index.tsx) so that
  // the test framework Playwright can access it. One use case
  // is to insert data, as it's hard to mock the async serial
  // read bytes function
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

export enum PortType {
  REAL,
  FAKE,
}

const tipsToDisplayOnStartup = [
  'TIP: Use Ctrl-Shift-C to copy text \nfrom the terminal, and Ctrl-Shift-V to paste.',
  'TIP: Change the type of data displayed between ASCII, HEX and other number types in Settings → RX Settings.',
  'TIP: Press Ctrl-Shift-B to send the "break" signal.',
];

export class App {
  settings: Settings;

  // If true, the settings dialog will be automatically closed on port open or close
  closeSettingsDialogOnPortOpenOrClose = true;

  portState = PortState.CLOSED;

  rxData = '';

  numBytesReceived: number;

  numBytesTransmitted: number;

  // Rate tracking for TX/RX
  rxRateBps: number = 0;
  txRateBps: number = 0;

  // Time window for rate calculation (in milliseconds)
  private readonly RATE_CALCULATION_WINDOW_MS = 3000; // 3 seconds
  private readonly RATE_UPDATE_INTERVAL_MS = 500; // Update every 500ms

  // Arrays to track byte counts over time
  private rxDataPoints: Array<{ timestamp: number; bytes: number }> = [];
  private txDataPoints: Array<{ timestamp: number; bytes: number }> = [];

  // Timer for rate calculations
  private rateCalculationInterval: NodeJS.Timeout | null = null;

  // CPU usage tracking
  cpuUsagePercent: number = 0;

  // CPU monitoring variables - measuring overall renderer process load
  private readonly CPU_MEASUREMENT_WINDOW_MS = 1000; // 1 second window

  // If true app is being tested by code.
  // Used for force terminal height to value when browser is not
  // available to determine height
  testing: boolean;

  // Port information for reconnection purposes
  serialPortInfo: Partial<PortInfo> | null;

  // Version of the NinjaTerm app. Read from package.json
  version: string;

  snackbar: SnackbarController;

  shownMainPane: MainPanes;

  terminals: Terminals;

  graphing: Graphing;

  logging: Logging;

  // Remembers the last selected port type, so open() and close()
  // know what type of port to operate on
  lastSelectedPortType = PortType.REAL;

  fakePortController: FakePortsController = new FakePortsController(this);

  profileManager: AppDataManager;

  selectionController: SelectionController = new SelectionController();

  SelectionController = SelectionController;

  showCircularProgressModal = false;

  performanceMonitor: PerformanceMonitor;


  constructor(testing = false) {
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


    this.terminals = new Terminals(this);

    this.numBytesReceived = 0;
    this.numBytesTransmitted = 0;

    this.serialPortInfo = null;

    // Show the terminal by default
    this.shownMainPane = MainPanes.TERMINAL;

    // Create graphing instance. Graphing is disabled by default.
    this.graphing = new Graphing(this.snackbar, this.profileManager);

    this.logging = new Logging(this);

    // Serial port connection handling is now managed through the ElectronSerialAdapter

    // Listen for changes to the last applied profile name, and update the app title
    reaction(() => this.profileManager.lastAppliedProfileName, this.onLastAppliedProfileNameChanged);
    this.onLastAppliedProfileNameChanged();

    // Close any existing ports which might be open in the main process, and remove
    // all IPC event listeners.
    (window as any).electronAPI.serial.closeAllPortsAndRemoveListeners();

    // Set up auto-updater event listeners
    this.setupAutoUpdater();

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
    this.stopPollingForReconnection();
    this.stopRateCalculation();
    this.stopCpuMonitoring();

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

    // Send 1 random tip to snackbar on app load
    // Choose random tip from array
    // const randomIndex = Math.floor(Math.random() * tipsToDisplayOnStartup.length);
    // this.snackbar.sendToSnackbar(tipsToDisplayOnStartup[randomIndex], 'info');
  }

  /**
   * Set the port which will be used if open() is called.
   *
   * @param port The serial port info to set as the selected port.
   */
  setSelectedPort = (port: PortInfo) => {
    this.serialPortInfo = port;
  };

  // Serial port connection and auto-reconnection is now handled through PortSettings

  setCloseSettingsDialogOnPortOpenOrClose(trueFalse: boolean) {
    this.closeSettingsDialogOnPortOpenOrClose = trueFalse;
  }

  // Current port path for IPC communication
  private currentPortPath: string | null = null;

  // Auto-reconnection polling
  private reconnectionPollingInterval: NodeJS.Timeout | null = null;
  private readonly RECONNECTION_POLLING_INTERVAL_MS = 500; // Poll every 2 seconds

  /**
   * Opens the selected serial port using settings from the Port Configuration view.
   *
   * @param obj Optional object with the following properties:
   * @param obj.silenceSnackbar If true, the snackbar will not be shown when the port is opened successfully.
   * @returns {Promise<bool>} A promise that contains true if the port was opened successfully, false otherwise.
   */
  async openPort({ silenceSnackbar = false } = {}) {
    if (this.lastSelectedPortType === PortType.REAL) {
      // Get the selected port from PortSettings
      const selectedPort = this.settings.portConfiguration.selectedSerialPort;
      if (!selectedPort) {
        this.snackbar.sendToSnackbar('No serial port selected. Please select a port from the Port Settings.', 'error');
        return false;
      }

      // Show the circular progress modal when trying to open the port
      this.setShowCircularProgressModal(true);

      try {
        // Make direct IPC call to open the port
        const result = await window.electronAPI.serial.openPort(selectedPort.path, {
          baudRate: this.settings.portConfiguration.baudRate,
          dataBits: this.settings.portConfiguration.numDataBits,
          parity: this.settings.portConfiguration.parity,
          stopBits: this.settings.portConfiguration.stopBits,
          flowControl: this.settings.portConfiguration.flowControl,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        // Store the current port path for IPC communication
        this.currentPortPath = selectedPort.path;

        // Set up IPC event listeners for data reception
        // The listeners are cleared in the app constructor. This is useful during development with hot reloading, if we
        // didn't do this, the listeners would be added multiple times.
        window.electronAPI.serial.onDataReceived((portPath: string, data: Buffer) => {
          if (portPath === this.currentPortPath) {
            // console.log('onDataReceived() called. data.length=', data.length);
            // Buffer can be used directly as Uint8Array - much faster than conversion
            const uint8Array = new Uint8Array(data);
            this.parseRxData(uint8Array);
          }
        });

        // Listen for errors
        window.electronAPI.serial.onError((portPath: string, error: string) => {
          if (portPath === this.currentPortPath) {
            this.snackbar.sendToSnackbar(`Serial port error: ${error}`, 'error');
            this.handlePortError();
          }
        });

        // Listen for port close events
        // This is called even if we trigger the close with the closePort() function
        window.electronAPI.serial.onPortClosed((portPath: string) => {
          console.log('onPortClosed() called. portPath=', portPath);
          if (portPath === this.currentPortPath) {
            this.handlePortClosed();
          }
        });

        runInAction(() => {
          // Stop any existing polling since we're now connected
          this.stopPollingForReconnection();
          // Save port info for reconnection - selectedPort is already a PortInfo object
          this.serialPortInfo = selectedPort;
          this.portState = PortState.OPENED;
        });

        // Remember this port so it can be reopened if the app is restarted
        const lastUsedSerialPort = this.profileManager.appData.currentAppConfig.lastUsedSerialPort;
        lastUsedSerialPort.path = selectedPort.path;
        lastUsedSerialPort.portState = PortState.OPENED;
        this.profileManager.saveAppData();

      } catch (error) {
        const msg = `Error opening serial port: ${error}`;
        this.snackbar.sendToSnackbar(msg, 'error');
        console.error(msg);
        this.setShowCircularProgressModal(false);
        return false;
      }

      if (!silenceSnackbar) {
        this.snackbar.sendToSnackbar('Serial port opened.', 'success');
      }

      this.setShowCircularProgressModal(false);

      // Create custom GA4 event to see how many ports have been opened in NinjaTerm
      await window.electronAPI.analytics.event('port_open');
    } else if (this.lastSelectedPortType === PortType.FAKE) {
      this.fakePortController.openPort();
    } else {
      throw Error('Unsupported port type!');
    }

    // Clear the partial number buffers in all terminals
    this.terminals.txTerminal.clearPartialNumberBuffer();
    this.terminals.rxTerminal.clearPartialNumberBuffer();
    this.terminals.txRxTerminal.clearPartialNumberBuffer();

    // Navigate to the terminal pane if option is selected in Port Configuration settings
    if (this.settings.portConfiguration.connectToSerialPortAsSoonAsItIsSelected) {
      this.setShownMainPane(MainPanes.TERMINAL);
    }

    return true;
  }

  /**
   * Handles serial port errors
   */
  private handlePortError() {
    // Handle various error types here if needed
    console.log('Serial port error occurred');
  }

  /**
   * Handles unexpected port close events
   */
  private handlePortClosed() {
    console.log('handleUnexpectedPortClose() called');
    // We might have already closed the port, so don't do anything if it's already closed
    if (this.portState === PortState.CLOSED || this.portState === PortState.CLOSED_BUT_WILL_REOPEN) {
      return;
    }

    // If the port was closed unexpectedly, we might want to reopen it
    if (this.settings.portConfiguration.reopenSerialPortIfUnexpectedlyClosed) {
      this.setPortState(PortState.CLOSED_BUT_WILL_REOPEN);
      // Start polling for the port to become available again
      this.startPollingForReconnection();
    } else {
      this.setPortState(PortState.CLOSED);
    }
    this.currentPortPath = null;
    // Remove all event listeners
    window.electronAPI.serial.removeAllListeners('serial:data-received');
    window.electronAPI.serial.removeAllListeners('serial:error');
    window.electronAPI.serial.removeAllListeners('serial:port-closed');
  }

  setPortState(newPortState: PortState) {
    this.portState = newPortState;
  }

  /**
   * Starts polling for the previously used port to become available again.
   * This is called when the port state is set to CLOSED_BUT_WILL_REOPEN.
   */
  private startPollingForReconnection() {
    if (this.reconnectionPollingInterval) {
      clearInterval(this.reconnectionPollingInterval);
    }

    console.log('Starting polling for port reconnection...');

    this.reconnectionPollingInterval = setInterval(async () => {
      try {
        // Only poll if we're still in the CLOSED_BUT_WILL_REOPEN state
        if (this.portState !== PortState.CLOSED_BUT_WILL_REOPEN) {
          this.stopPollingForReconnection();
          return;
        }

        // Get the last used port path
        const lastUsedPortPath = this.profileManager.appData.currentAppConfig.lastUsedSerialPort.path;
        if (!lastUsedPortPath) {
          console.log('No last used port path found, stopping polling');
          this.stopPollingForReconnection();
          return;
        }

        // Check if the port is available
        const result = await window.electronAPI.serial.listPorts();
        if (!result.success) {
          console.error('Failed to list ports during reconnection polling:', result.error);
          return;
        }

        const availablePorts = result.ports || [];
        const matchingPort = availablePorts.find(port => port.path === lastUsedPortPath);

        if (matchingPort) {
          console.log('Found matching port for reconnection:', matchingPort.path);
          this.stopPollingForReconnection();

          // Set the selected port and attempt to reconnect
          this.setSelectedPort(matchingPort);
          await this.openPort({ silenceSnackbar: true });

          this.snackbar.sendToSnackbar(`Automatically reconnected to port: ${matchingPort.path}`, 'success');
        }
      } catch (error) {
        console.error('Error during reconnection polling:', error);
      }
    }, this.RECONNECTION_POLLING_INTERVAL_MS);
  }

  /**
   * Stops polling for port reconnection and clears the polling interval.
   */
  private stopPollingForReconnection() {
    if (this.reconnectionPollingInterval) {
      console.log('Stopping polling for port reconnection');
      clearInterval(this.reconnectionPollingInterval);
      this.reconnectionPollingInterval = null;
    }
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
  }

  /**
   * Records a data point for TX rate calculation.
   */
  private recordTxDataPoint(bytes: number) {
    this.txDataPoints.push({
      timestamp: Date.now(),
      bytes: bytes
    });
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
    let lastFrameTime = performance.now();
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
    electronAPI.updater.onUpdateNotAvailable((updateInfo: any) => {
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
   * In normal operation this is called from the readUntilClose() function above.
   *
   * Unit tests call this instead of mocking out the serial port read() function
   * as setting up the deferred promise was too tricky.
   *
   * @param rxData
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

    // End performance monitoring and record metrics
    const totalProcessingTime = this.performanceMonitor.endTiming('dataProcessing');
    this.performanceMonitor.recordDataProcessing(rxData.length, totalProcessingTime);

    // Update stats
    this.numBytesReceived += rxData.length;
    this.recordRxDataPoint(rxData.length);
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

  /**
   * Closes the open serial port.
   *
   * @param goToReopenState If true, the port will be set to the CLOSED_BUT_WILL_REOPEN state.
   * @param silenceSnackbar If true, the snackbar will not be shown when the port is closed successfully.
   */
  async closePort({ goToReopenState = false, silenceSnackbar = false } = {}) {
    if (this.lastSelectedPortType === PortType.REAL) {
      if (this.currentPortPath) {
        // Make direct IPC call to close the port
        const result = await window.electronAPI.serial.closePort(this.currentPortPath);
        if (!result.success) {
          console.error('Error closing port:', result.error);
        }
      }

      // Wrap in action
      runInAction(() => {
        if (goToReopenState) {
          this.portState = PortState.CLOSED_BUT_WILL_REOPEN;
          // Start polling for the port to become available again
          this.startPollingForReconnection();
        } else {
          // Stop polling if we're explicitly closing the port
          this.stopPollingForReconnection();
          this.portState = PortState.CLOSED;
        }
      });

      if (!silenceSnackbar) {
        this.snackbar.sendToSnackbar('Serial port closed.', 'success');
      }

      this.currentPortPath = null;
      const lastUsedSerialPort = this.profileManager.appData.currentAppConfig.lastUsedSerialPort;
      lastUsedSerialPort.portState = PortState.CLOSED;

      // Disconnect all listeners
      window.electronAPI.serial.removeAllListeners('serial:data-received');
      window.electronAPI.serial.removeAllListeners('serial:error');
      window.electronAPI.serial.removeAllListeners('serial:port-closed');

      this.profileManager.saveAppData();
    } else if (this.lastSelectedPortType === PortType.FAKE) {
      this.fakePortController.closePort();
    } else {
      throw Error('Unsupported port type!');
    }
  }

  stopWaitingToReopenPort() {
    this.stopPollingForReconnection();
    this.portState = PortState.CLOSED;
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
    if (this.shownMainPane === MainPanes.SETTINGS && this.settings.activeSettingsCategory === SettingsCategories.PORT_CONFIGURATION && event.key === 'f') {
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
    // COPY KEYBOARD SHORTCUT
    //============================================
    else if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      // Ctrl-Shift-C is pressed
      this.handleCopyToClipboard(event);
    }
    //============================================
    // PASTE KEYBOARD SHORTCUT
    //============================================
    else if (event.ctrlKey && event.shiftKey && event.key === 'V') {
      // Ctrl-Shift-V is pressed, handle paste
      // Get clipboard text and send it out the serial port if either the TXRX or TX terminal is in focus
      // Calling readText() will ask the user for permission to access the clipboard on the first time
      let text = await navigator.clipboard.readText();

      // Convert CRLF to LF if setting is enabled
      if (this.settings.generalSettings.whenPastingOnWindowsReplaceCRLFWithLF && isRunningOnWindows()) {
        text = text.replace(/\r\n/g, '\n');
      }

      // Make sure serial port is open
      if (this.portState !== PortState.OPENED) {
        return;
      }

      // Make sure either the TXRX or TX terminal is in focus
      if (!this.terminals.txRxTerminal.isFocused && !this.terminals.txTerminal.isFocused) {
        return;
      }

      // Convert string to Uint8Array
      const dataAsUint8Array = new TextEncoder().encode(text);
      await this.writeBytesToSerialPort(dataAsUint8Array);
    }
    //=============================================
    // TERMINAL DATA
    //=============================================
    else if (this.terminals.txRxTerminal.isFocused || this.terminals.txTerminal.isFocused) {
      // If we get here and the terminals are in focus, assume it's terminal data
      this.handleTerminalKeyDown(event);
    }
  }

  /**
   * This is called when the user presses Ctrl-Shift-C. It copies the selected text
   * to the clipboard.
   * @param event The keyboard event.
   * @returns
   */
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

    let clipboardText = '';
    if (selectionInfo !== null) {
      // Copy the text from the start node to the end node (NOTE: not the same as
      // the anchor and focus node if the user clicked at the end and released at the start)
      clipboardText = this.extractClipboardTextFromTerminal(selectionInfo, terminalSelectionWasIn!);
    } else {
      // Since selection is not fully contained within a single terminal pane,
      // do a basic toString() copy of the text to the clipboard
      // Do we need to await the promise?
      // WARNING: As per spec at: https://w3c.github.io/clipboard-apis/#dom-clipboard-writetext
      //   On Windows replace `\n` characters with `\r\n` in data before creating textBlob
      clipboardText = selection.toString();
    }

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

    if (this.portState !== PortState.OPENED) {
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
      if (this.terminals.txTerminal.isFocused) {
        this.terminals.txTerminal.setScrollLock(true);
      }
      if (this.terminals.txRxTerminal.isFocused) {
        this.terminals.txRxTerminal.setScrollLock(true);
      }
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
    if (this.currentPortPath && (window as any).electronAPI) {
      try {
        // Make direct IPC call to write data
        const result = await (window as any).electronAPI.serial.writeData(this.currentPortPath, Array.from(bytesToWrite));
        if (!result.success) {
          throw new Error(result.error || 'Failed to write data');
        }
      } catch (error) {
        this.snackbar.sendToSnackbar(`Error writing to serial port: ${error}`, 'error');
        return;
      }
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
