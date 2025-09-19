import { ipcMain } from 'electron';

// Use noble from @abandonware/noble. The @noble/noble package is not maintained.
// Only import noble if not in CI environment to avoid build failures
// Even just importing noble causes build failures in the CI environment (even without using the import)
let noble: typeof import('@abandonware/noble') | null = null;
const isCI = process.env.CI || process.env.NODE_ENV === 'test';
if (!isCI) {
  noble = require('@abandonware/noble');
}

const SCAN_DURATION_MS = 2000;

export class BluetoothService {

  discoveredPeripherals: import('@abandonware/noble').Peripheral[] = [];

  isScanningForPeripherals: boolean = false;

  scanningTimer: NodeJS.Timeout | null = null;

  nobleState: string | null = null;

  constructor() {
    if (isCI || !noble) {
      console.log('Detected CI environment. Bluetooth functionality disabled.');
      return;
    }

    // Only initialize noble if not in CI and noble is available
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

  onDiscover = (peripheral: import('@abandonware/noble').Peripheral) => {
    if (isCI || !noble) return;

    console.log('onDiscover called. peripheral.id=', peripheral.id);
    this.discoveredPeripherals.push(peripheral);
  }

  onScanningError = (error?: Error) => {
    if (isCI || !noble) return;

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
    if (isCI || !noble) return;

    console.log('onScanStop called.');
    this.isScanningForPeripherals = false;
  }

  /**
   * Start scanning for peripherals. noble must be in the poweredOn state to do this.
   */
  startPeripheralScan = () => {
    if (isCI || !noble) {
      console.log('Bluetooth scanning skipped (CI environment or noble not available).');
      return;
    }

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
