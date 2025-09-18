import { ipcMain } from 'electron';

// Use noble from @abandonware/noble. The @noble/noble package is not maintained.
import noble from '@abandonware/noble';

const SCAN_DURATION_MS = 2000;

export class BluetoothService {

  discoveredPeripherals: noble.Peripheral[] = [];

  isScanningForPeripherals: boolean = false;

  scanningTimer: NodeJS.Timeout | null = null;

  nobleState: string | null = null;

  constructor() {
    // Detect if running in CI environment
    const isCI = !!process.env.CI || process.env.NODE_ENV === 'test';

    // Only initialize noble if not in CI. Initializing noble in CI environment causes
    // Playwright e2e tests to fail.
    if (isCI) {
      console.log('Detected CI environment. Bluetooth operations skipped.');
      return;
    }

    noble.on('discover', this.onDiscover);
    // noble automatically fires a poweredOn state change event on startup (it seems)
    noble.on('stateChange', this.onStateChange);
    noble.on('scanStop', this.onScanStop);

    ipcMain.handle('bluetooth:start-peripheral-scan', () => {
      console.log('bluetooth:start-peripheral-scan called.');
      try {
        this.startPeripheralScan();
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
      return { success: true };
    });
  }

  onStateChange = (state: string) => {
    console.log('stateChange called. state=', state);
    this.nobleState = state;
  }

  onDiscover = (peripheral: noble.Peripheral) => {
    console.log('onDiscover called. peripheral.id=', peripheral.id);
    this.discoveredPeripherals.push(peripheral);
  }

  onScanningError = (error?: Error) => {
    console.error('onScanningError called. error=', error);
    // For some reason, I saw noble fire this event as scanning was started, and error was undefined, and
    // devices were still being discovered. So I'm assuming it's not an error in this case and we can just ignore it.
    if (!error) {
      return;
    }
    this.isScanningForPeripherals = false;
    // Clear timer
    if (this.scanningTimer) {
      clearTimeout(this.scanningTimer);
    }
  }

  onScanStop = () => {
    console.log('onScanStop called.');
    this.isScanningForPeripherals = false;
  }

  /**
   * Start scanning for peripherals. noble must be in the poweredOn state to do this.
   */
  startPeripheralScan = () => {
    console.log('startPeripheralScan called.');
    if (this.nobleState !== 'poweredOn') {
      throw new Error('noble must be in the poweredOn state to start scanning for peripherals.');
    }
    this.isScanningForPeripherals = true;
    noble.startScanning([], false, this.onScanningError);

    // Setup timer to stop scanning after 5 seconds
    console.log('Setting up scanning timer...');
    this.scanningTimer = setTimeout(() => {
      console.log('Stopping scan after 5 seconds.');
      noble.stopScanning();
    }, SCAN_DURATION_MS);
  }

}
