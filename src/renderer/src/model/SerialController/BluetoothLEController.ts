import { SerializableBluetoothDevice } from '@shared/types/bluetooth';
import { App } from '@/model/App';
import { makeAutoObservable, runInAction } from 'mobx';

export class BluetoothLEController {
  private app: App;

  discoveredBluetoothDevices: SerializableBluetoothDevice[] = [];

  selectedBluetoothDevice: SerializableBluetoothDevice | null = null;

  isBluetoothScanning = false;

  constructor(app: App) {
    this.app = app;
    // Register for Bluetooth device discovered events
    window.electronAPI.bluetooth.onDeviceDiscovered(this.onIpcBluetoothDeviceDiscovered);

    // Make sure to do this at the end of the constructor
    makeAutoObservable(this);
  }

  /** Send a command to the main process to start scanning for Bluetooth devices. */
  scanForBluetoothDevices = async () => {
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
