// Use noble from @abandonware/noble. The @noble/noble package is not maintained.
import noble from '@abandonware/noble';

const SCAN_DURATION_MS = 2000;

export class BluetoothService {

  discoveredPeripherals: noble.Peripheral[] = [];

  isScanningForPeripherals: boolean = false;

  scanningTimer: NodeJS.Timeout | null = null;

  constructor() {

    noble.on('discover', this.onDiscover);
    // noble automatically fires a poweredOn state change event on startup (it seems)
    noble.on('stateChange', this.onStateChange);
    noble.on('scanStop', this.onScanStop);
  }

  onStateChange = (state: string) => {
    console.log('stateChange called. state=', state);
    if (state === 'poweredOn') {
      console.log('Scanning for devices...');

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
}
