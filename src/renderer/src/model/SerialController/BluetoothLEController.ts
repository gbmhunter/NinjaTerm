import { SerializableBluetoothDevice, BluetoothDeviceServicesMessage, SerializableService } from '@shared/types/bluetooth';
import { App } from '@/model/App';
import { action, makeAutoObservable, runInAction } from 'mobx';
import { PortState } from '@/model/Settings/PortSettings/PortSettings';

const SCAN_DURATION_MS = 5000;

// Combine serial capabilities with SerializableBluetoothDevice
export class SerializableBluetoothDeviceWithMetadata {
  nobleData: SerializableBluetoothDevice;
  serialCapabilities: {
    nordicNus: boolean;
  };

  constructor(nobleData: SerializableBluetoothDevice) {
    this.nobleData = nobleData;
    this.serialCapabilities = {
      nordicNus: false,
    };
    makeAutoObservable(this);
  }

}

/**
 * Controller for Bluetooth LE (BLE) operations.
 */
export class BluetoothLEController {
  private app: App;

  discoveredBluetoothDevices: SerializableBluetoothDeviceWithMetadata[] = [];

  selectedBluetoothDevice: SerializableBluetoothDeviceWithMetadata | null = null;

  connectedDeviceServices: SerializableService[] = [];

  isBluetoothScanning = false;

  constructor(app: App) {
    this.app = app;
    // Register for Bluetooth device discovered events
    window.electronAPI.bluetooth.onDeviceDiscovered((device) => this.onIpcBluetoothDeviceDiscovered(device));

    // Register for Bluetooth device services discovered events
    window.electronAPI.bluetooth.onDeviceServicesDiscovered((servicesMessage) => this.onIpcBluetoothDeviceServicesDiscovered(servicesMessage));

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
    // Check if device is already in the list
      // Update the device in the list
    let index = this.discoveredBluetoothDevices.findIndex(deviceInList => deviceInList.nobleData.id === device.id);
    if (index !== -1) {
      // Device already exists. Update specific fields if they have not been set before
      let deviceInList = this.discoveredBluetoothDevices[index];
      if (deviceInList.nobleData.advertisement.localName === '') {
        deviceInList.nobleData.advertisement.localName = device.advertisement.localName;
      }
      if (deviceInList.nobleData.advertisement.manufacturerData === undefined) {
        deviceInList.nobleData.advertisement.manufacturerData = device.advertisement.manufacturerData;
      }
      // Add service UUIDs if they are not present in the list already
      for (const serviceUuid of device.advertisement.serviceUuids) {
        if (!deviceInList.nobleData.advertisement.serviceUuids.includes(serviceUuid)) {
          deviceInList.nobleData.advertisement.serviceUuids.push(serviceUuid);
        }
      }
    } else {
      // Device has not already been discovered in scan, so add it
      this.discoveredBluetoothDevices.push(new SerializableBluetoothDeviceWithMetadata(device));
      index = this.discoveredBluetoothDevices.length - 1;
    }
    // The following code gets run no matter if the device is already in the list or not

    let deviceInList = this.discoveredBluetoothDevices[index];
    // Add some additional metadata
    if (deviceInList.nobleData.advertisement.serviceUuids.includes('6e400001b5a3f393e0a9e50e24dcca9e')) {
      deviceInList.serialCapabilities.nordicNus = true;
    }
  }

  setSelectedBluetoothDevice = (device: SerializableBluetoothDeviceWithMetadata) => {
    this.selectedBluetoothDevice = device;
  }

  /** Callback that is called when the main process sends device services information after connection. */
  private onIpcBluetoothDeviceServicesDiscovered = (servicesMessage: BluetoothDeviceServicesMessage) => {
    console.log('Received device services for device:', servicesMessage.deviceId, 'services:', servicesMessage.services);

    runInAction(() => {
      this.connectedDeviceServices = servicesMessage.services;
    });

    // Optionally show a snackbar with service count
    this.app.snackbar.sendToSnackbar(
      `Discovered ${servicesMessage.services.length} services on connected Bluetooth device.`,
      'info'
    );
  }

  /**
   * Opens the selected Bluetooth device. This should be called when the user presses an "Open" button in NinjaTerm, and "Bluetooth" is selected as the connection type.
   */
  open = async () => {
    if (!this.selectedBluetoothDevice) {
      this.app.snackbar.sendToSnackbar('No Bluetooth device selected. Please select a device from the Bluetooth Settings.', 'error');
      return;
    }


    // Show the circular progress modal when trying to connect to Bluetooth device
    this.app.setShowCircularProgressModal(true);

    const result = await window.electronAPI.bluetooth.connectDevice(this.selectedBluetoothDevice.nobleData.id);
    if (!result.success) {
      this.app.snackbar.sendToSnackbar(`Failed to connect to Bluetooth device. Error: ${result.error}.`, 'error');
      this.app.setShowCircularProgressModal(false);
      return;
    }

    this.app.snackbar.sendToSnackbar(`Bluetooth device connected: ${this.selectedBluetoothDevice.nobleData.advertisement.localName}.`, 'success');
    this.app.setShowCircularProgressModal(false);
    runInAction(() => {
      this.app.serialController.portState = PortState.OPENED;
    });



      // try {
      //   // Make direct IPC call to connect to Bluetooth device
      //   const result = await window.electronAPI.bluetooth.connectDevice(selectedDevice.id);

      //   if (!result.success) {
      //     throw new Error(result.error);
      //   }

      //   // Store the current device ID for IPC communication
      //   this.currentBluetoothDeviceId = selectedDevice.id;

      //   // Save device info for reconnection purposes
      //   this.bluetoothDeviceInfo = {
      //     deviceId: selectedDevice.id,
      //     deviceName: selectedDevice.advertisement?.localName || 'Unknown Device'
      //   };

      //   // Set up IPC event listeners for data reception
      //   window.electronAPI.bluetooth.onDataReceived((deviceId: string, data: Buffer) => {
      //     if (deviceId === this.currentBluetoothDeviceId) {
      //       // Buffer can be used directly as Uint8Array - much faster than conversion
      //       const uint8Array = new Uint8Array(data);
      //       this.app.parseRxData(uint8Array);
      //     }
      //   });

      //   // Listen for disconnection events
      //   window.electronAPI.bluetooth.onDeviceDisconnected((deviceId: string) => {
      //     console.log('onBluetoothDeviceDisconnected() called. deviceId=', deviceId);
      //     if (deviceId === this.currentBluetoothDeviceId) {
      //       this.handlePortClosed();
      //     }
      //   });

      //   runInAction(() => {
      //     // Stop any existing polling since we're now connected
      //     this.stopPollingForReconnection();
      //     this.portState = PortState.OPENED;
      //     this.lastSelectedPortType = PortType.BLUETOOTH;
      //   });

      //   if (!silenceSnackbar) {
      //     const deviceName = selectedDevice.advertisement?.localName || selectedDevice.id;
      //     this.app.snackbar.sendToSnackbar(`Bluetooth device connected: ${deviceName}`, 'success');
      //   }

      //   this.app.setShowCircularProgressModal(false);

      //   // Create custom GA4 event to see how many Bluetooth connections have been opened in NinjaTerm
      //   await window.electronAPI.analytics.event('bluetooth_connect');
      // } catch (error) {
      //   const msg = `Error connecting to Bluetooth device: ${error}`;
      //   this.app.snackbar.sendToSnackbar(msg, 'error');
      //   console.error(msg);
      //   this.app.setShowCircularProgressModal(false);
      //   return false;
      // }
  }

  close = async () => {
    console.log('BluetoothLEController.close() called');
    if (!this.selectedBluetoothDevice) {
      console.error('close() called but no Bluetooth device selected. Cannot close Bluetooth connection.');
      return;
    }

    const result = await window.electronAPI.bluetooth.disconnectDevice(this.selectedBluetoothDevice.nobleData.id);
    if (!result.success) {
      this.app.snackbar.sendToSnackbar(`Failed to disconnect from Bluetooth device. Error: ${result.error}.`, 'error');
      return;
    }

    this.app.snackbar.sendToSnackbar(`Bluetooth device disconnected: ${this.selectedBluetoothDevice.nobleData.advertisement.localName}.`, 'success');

    // Clear connected device services
    runInAction(() => {
      this.connectedDeviceServices = [];
    });

    // Disconnect all listeners
    window.electronAPI.bluetooth.removeAllListeners('bluetooth:data-received');
    window.electronAPI.bluetooth.removeAllListeners('bluetooth:device-disconnected');
  }
}
