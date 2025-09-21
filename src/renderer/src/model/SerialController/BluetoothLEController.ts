import { SerializableBluetoothDevice } from '@shared/types/bluetooth';
import { App } from '@/model/App';
import { action, makeAutoObservable, runInAction } from 'mobx';

const SCAN_DURATION_MS = 10000;

/**
 * Controller for Bluetooth LE (BLE) operations.
 */
export class BluetoothLEController {
  private app: App;

  discoveredBluetoothDevices: SerializableBluetoothDevice[] = [];

  selectedBluetoothDevice: SerializableBluetoothDevice | null = null;

  isBluetoothScanning = false;

  constructor(app: App) {
    this.app = app;
    // Register for Bluetooth device discovered events
    window.electronAPI.bluetooth.onDeviceDiscovered((device) => this.onIpcBluetoothDeviceDiscovered(device));

    // Make sure to do this at the end of the constructor
    makeAutoObservable(this);
  }

  /** Send a command to the main process to start scanning for Bluetooth devices. */
  scanForBluetoothDevices = async () => {

    // Clear previous discovered devices
    runInAction(() => {
      this.discoveredBluetoothDevices = [];
    });

    const result = await window.electronAPI.bluetooth.startPeripheralScan();
    if (!result.success) {
      this.app.snackbar.sendToSnackbar(`Failed to start Bluetooth scan. Error: ${result.error}.`, 'error');
      return;
    }

    this.app.snackbar.sendToSnackbar('Bluetooth scan started...', 'info');
    runInAction(() => {
      this.isBluetoothScanning = true;
    });

    setTimeout(() => {
      this.stopBluetoothScan();
    }, SCAN_DURATION_MS);
  }

  stopBluetoothScan = async () => {
    const result = await window.electronAPI.bluetooth.stopPeripheralScan();
    if (!result.success) {
      this.app.snackbar.sendToSnackbar(`Failed to stop Bluetooth scan. Error: ${result.error}.`, 'error');
      return;
    }

    this.app.snackbar.sendToSnackbar('Bluetooth scan finished.', 'success');

    runInAction(() => {
      this.isBluetoothScanning = false;
    });
  }

  /** Callback that is called every time the main process discovers a Bluetooth device. */
  private onIpcBluetoothDeviceDiscovered = (device: SerializableBluetoothDevice) => {
    console.log('onIpcBluetoothDeviceDiscovered called. device=', device);
    // Check if device is already in the list
      // Update the device in the list
    const index = this.discoveredBluetoothDevices.findIndex(deviceInList => deviceInList.id === device.id);
    if (index !== -1) {
      // Device already exists. Update specific fields if they have not been set before
      let deviceInList = this.discoveredBluetoothDevices[index];
      if (deviceInList.advertisement.localName === '') {
        deviceInList.advertisement.localName = device.advertisement.localName;
      }
      if (deviceInList.advertisement.manufacturerData === undefined) {
        deviceInList.advertisement.manufacturerData = device.advertisement.manufacturerData;
      }
      return;
    } else {
      // Device has not already been discovered in scan, so add it
      this.discoveredBluetoothDevices.push(device);
    }
  }

  setSelectedBluetoothDevice = (device: SerializableBluetoothDevice) => {
    this.selectedBluetoothDevice = device;
  }
}
