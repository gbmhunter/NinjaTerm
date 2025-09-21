import { SerializableBluetoothDevice } from '@shared/types/bluetooth';
import { App } from '@/model/App';
import { makeAutoObservable, runInAction } from 'mobx';

/**
 * Controller for Bluetooth LE (BLE) operations.
 *
 * If the Bluetooth API is not available via window.electronAPI (e.g. during unit tests), this class will still be created but
 * will emit snackbar errors in certain cases.
 */
export class BluetoothLEController {
  private app: App;

  discoveredBluetoothDevices: SerializableBluetoothDevice[] = [];

  selectedBluetoothDevice: SerializableBluetoothDevice | null = null;

  isBluetoothScanning = false;

  constructor(app: App) {
    this.app = app;
    // Register for Bluetooth device discovered events (only if electronAPI is available)
    if (typeof window !== 'undefined' && window.electronAPI?.bluetooth?.onDeviceDiscovered) {
      window.electronAPI.bluetooth.onDeviceDiscovered(this.onIpcBluetoothDeviceDiscovered);
    }

    // Make sure to do this at the end of the constructor
    makeAutoObservable(this);
  }

  /** Send a command to the main process to start scanning for Bluetooth devices. */
  scanForBluetoothDevices = async () => {
    if (!window.electronAPI?.bluetooth?.startPeripheralScan) {
      this.app.snackbar.sendToSnackbar('Bluetooth API not available.', 'error');
      return;
    }

    const result = await window.electronAPI.bluetooth.startPeripheralScan();
    if (result.success) {
      this.app.snackbar.sendToSnackbar('Bluetooth scan started...', 'info');
      runInAction(() => {
        this.isBluetoothScanning = true;
      });
    } else {
      this.app.snackbar.sendToSnackbar(`Failed to start Bluetooth scan. Error: ${result.error}.`, 'error');
    }
  }

  /** Callback that is called everytime the main process discovers a Bluetooth device. */
  private onIpcBluetoothDeviceDiscovered = (device: SerializableBluetoothDevice) => {
    console.log('onIpcBluetoothDeviceDiscovered called. device=', device);
    runInAction(() => {
      this.discoveredBluetoothDevices.push(device);
    });
  }

  setSelectedBluetoothDevice = (device: SerializableBluetoothDevice) => {
    this.selectedBluetoothDevice = device;
  }
}
