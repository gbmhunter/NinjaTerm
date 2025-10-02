import { SerializableBluetoothDevice, BluetoothServicesMessage, SerializableService } from '@shared/types/bluetooth';
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

class BluetoothLESerialProtocol {
  name: string;
  serviceUuid: string;
  txUuid: string;
  rxUuid: string;
  constructor(name: string, serviceUuid: string, txUuid: string, rxUuid: string) {
    this.name = name;
    this.serviceUuid = serviceUuid;
    this.txUuid = txUuid;
    this.rxUuid = rxUuid;
  }
}

"6e400003b5a3f393e0a9e50e24dcca9e"
const nordicNus = new BluetoothLESerialProtocol('Nordic NUS', '6e400001b5a3f393e0a9e50e24dcca9e', '6e400003b5a3f393e0a9e50e24dcca9e', '6e400002b5a3f393e0a9e50e24dcca9e');

const bluetoothLESerialProtocols = [nordicNus];

/**
 * Controller for Bluetooth LE (BLE) operations.
 */
export class BluetoothLEController {
  private app: App;

  discoveredBluetoothDevices: SerializableBluetoothDeviceWithMetadata[] = [];

  selectedBluetoothDevice: SerializableBluetoothDeviceWithMetadata | null = null;

  /**
   * Stores info about the connected Bluetooth device. null if not connected to any device.
   */
  connectedBluetoothDevice: SerializableBluetoothDeviceWithMetadata | null = null;

  connectedDeviceServices: SerializableService[] = [];

  isBluetoothScanning = false;

  constructor(app: App) {
    this.app = app;
    // Register for Bluetooth device discovered events
    window.electronAPI.bluetooth.onDeviceDiscovered((device) => this.onIpcBluetoothDeviceDiscovered(device));

    // Listen for disconnection events
    window.electronAPI.bluetooth.onDeviceDisconnected((deviceId: string) => {
      console.log('onDeviceDisconnected() called. deviceId=', deviceId);
    });

    // Register for Bluetooth device services discovered events
    // window.electronAPI.bluetooth.onDeviceServicesDiscovered((servicesMessage) => this.onIpcBluetoothDeviceServicesDiscovered(servicesMessage));

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
  // private onIpcBluetoothDeviceServicesDiscovered = (servicesMessage: BluetoothOnConnectMessage) => {
  //   console.log('Received device services for device:', servicesMessage.deviceId, 'services:', servicesMessage.services);

  //   runInAction(() => {
  //     this.connectedDeviceServices = servicesMessage.services;
  //   });

  //   // Optionally show a snackbar with service count
  //   this.app.snackbar.sendToSnackbar(
  //     `Discovered ${servicesMessage.services.length} services on connected Bluetooth device.`,
  //     'info'
  //   );
  // }

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
    this.app.setShowCircularProgressModal(false);
    console.log('result=', result);
    if (result.error) {
      this.app.snackbar.sendToSnackbar(`Failed to connect to Bluetooth device. Error: ${result.error}.`, 'error');
      return;
    }

    this.app.snackbar.sendToSnackbar(`Bluetooth device connected: ${this.selectedBluetoothDevice.nobleData.advertisement.localName}.`, 'success');
    runInAction(() => {
      this.connectedBluetoothDevice = this.selectedBluetoothDevice;
      this.app.serialController.portState = PortState.OPENED;
    });

    // Look for valid services/characteristics in the returned information
    console.log('result.services=', result.bluetoothServicesMsg);
    if(!result.bluetoothServicesMsg) {
      this.app.snackbar.sendToSnackbar('Services information was not returned from the main process.', 'error');
      return;
    }

    let foundProtocol: BluetoothLESerialProtocol | null = null;
    for (const protocol of bluetoothLESerialProtocols) {
      // Get index of service in result.bluetoothServicesMsg.services
      const serviceIndex = result.bluetoothServicesMsg.services.findIndex(service => service.uuid === protocol.serviceUuid);
      if (serviceIndex === -1) {
        continue;
      }
      console.log('Found service.');
      // Now make sure the read and write UUIDs are present
      const service = result.bluetoothServicesMsg.services[serviceIndex];

      // Check read UUID is present as has "writeWithoutResponse" property
      const readCharacteristicIndex = service.characteristics.findIndex(characteristic => characteristic.uuid === protocol.rxUuid);
      if (readCharacteristicIndex === -1) {
        continue;
      }
      const readCharacteristic = service.characteristics[readCharacteristicIndex];
      if (!readCharacteristic.properties.includes('writeWithoutResponse')) {
        continue;
      }
      console.log('Found read characteristic.');

      // Check write UUID is present as has "notify" property
      const writeCharacteristicIndex = service.characteristics.findIndex(characteristic => characteristic.uuid === protocol.txUuid);
      if (writeCharacteristicIndex === -1) {
        continue;
      }
      const writeCharacteristic = service.characteristics[writeCharacteristicIndex];
      if (!writeCharacteristic.properties.includes('notify')) {
        continue;
      }
      console.log('Found write characteristic.');
      console.log(`Found ${protocol.name} on connected Bluetooth device.`);

      // Use the first valid serial protocol we find
      foundProtocol = protocol;
      break;
    }

    if (!foundProtocol) {
      this.app.snackbar.sendToSnackbar('No valid serial protocol found on connected Bluetooth device.', 'error');
      return;
    }

    const setupReadAndWriteResult = await window.electronAPI.bluetooth.setupReadAndWrite(foundProtocol.serviceUuid, foundProtocol.rxUuid, foundProtocol.txUuid);
    if (!setupReadAndWriteResult.success) {
      this.app.snackbar.sendToSnackbar(`Failed to setup read and write on connected Bluetooth device. Error: ${setupReadAndWriteResult.error}.`, 'error');
      return;
    }

    // Setup listener for RX data
    window.electronAPI.bluetooth.onDataReceived((deviceId: string, data: Buffer) => {
      this.app.parseRxData(data);
    });
  }

  /** Close the Bluetooth connection to currently connected Bluetooth device. */
  close = async () => {
    console.log('BluetoothLEController.close() called');
    if (!this.connectedBluetoothDevice) {
      console.error('close() called but no Bluetooth device selected. Cannot close Bluetooth connection.');
      return;
    }

    const result = await window.electronAPI.bluetooth.disconnectDevice(this.connectedBluetoothDevice.nobleData.id);
    if (!result.success) {
      this.app.snackbar.sendToSnackbar(`Failed to disconnect from Bluetooth device. Error: ${result.error}.`, 'error');
      return;
    }

    this.app.snackbar.sendToSnackbar(`Bluetooth device disconnected: ${this.connectedBluetoothDevice.nobleData.advertisement.localName}.`, 'success');

    // Clear connected device services
    runInAction(() => {
      this.connectedBluetoothDevice = null;
      this.connectedDeviceServices = [];
    });

    // Disconnect all listeners
    window.electronAPI.bluetooth.removeAllListeners('bluetooth:data-received');
    window.electronAPI.bluetooth.removeAllListeners('bluetooth:device-disconnected');
  }

  /**
   * Send data to the connected Bluetooth device. Shows a snackbar error if there is no connected Bluetooth device.
   *
   * @param data The data to send.
   */
  sendData = (data: Uint8Array) => {
    if (!this.connectedBluetoothDevice) {
      this.app.snackbar.sendToSnackbar('No Bluetooth device connected. Cannot send data.', 'error');
      return;
    }
    window.electronAPI.bluetooth.writeData(data);
  }
}
