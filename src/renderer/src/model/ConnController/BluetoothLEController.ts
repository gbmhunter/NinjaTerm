import { SerializableBluetoothDevice, SerializableService, BluetoothConnectionAttemptSuccess } from '@shared/types/bluetooth';
import { App } from '@/model/App';
import { makeAutoObservable, runInAction } from 'mobx';
import { ConnState } from '@/model/Settings/PortSettings/PortSettings';
import { z } from 'zod';
import log from 'electron-log/renderer';

const DEFAULT_SCAN_DURATION_MS = 5000;
export const SCAN_DURATION_MS_MIN = 100;
export const SCAN_DURATION_MS_MAX = 30000;

const RECONNECTION_POLLING_INTERVAL_MS = 1000;

/**
 * Enumeration of Bluetooth serial protocol selection options.
 */
export enum BluetoothLESerialProtocolType {
  FIRST_DETECTED = 'First detected serial protocol',
  NORDIC_UART_SERVICE_NUS = 'Nordic Uart Service (NUS)',
  MICROCHIP_TRANSPARENT_UART = 'Microchip Transparent Uart Service',
  TI_SERIAL_PORT_SERVICE_SPP = 'TI Serial Port Service (SPS)',
  UBLOX_UCONNECT_XPRESS = 'u-blox u-connectXpress',
  SILICON_LABS_SPP = 'Silicon Labs SPP over BLE',
  MANUALLY_SPECIFY = 'Manually Specify',
}

// Combine serial capabilities with SerializableBluetoothDevice
export class SerializableBluetoothDeviceWithMetadata {
  nobleData: SerializableBluetoothDevice;

  /** These are the supported serial protocols determined by any services listed in device advertisement data. The device may choose not to list the service in the advertisement data, but still support the protocol (in which case you can't determine this until you connect to the device and retrieve all it's services and characteristics). */
  supportedSerialProtocolsInAdvData: BluetoothLESerialProtocol[];

  constructor(nobleData: SerializableBluetoothDevice) {
    this.nobleData = nobleData;
    this.supportedSerialProtocolsInAdvData = [];
    makeAutoObservable(this);
  }

  getHumanReadableSupportedSerialProtocolsInAdvData() {
    // For each supported protocol, get the human readable name as set by the BluetoothLESerialProtocolType enum
    // and create a comma separated string of the names
    let humanReadableProtocols;
    if (this.supportedSerialProtocolsInAdvData.length > 0) {
      humanReadableProtocols = this.supportedSerialProtocolsInAdvData.map(protocol => protocol.selectionType).join(', ');
    } else {
      humanReadableProtocols = '-';
    }
    return humanReadableProtocols;
  }

}

class BluetoothLESerialProtocol {
  name: string;
  serviceUuid: string;
  txUuid: string;
  rxUuid: string;
  selectionType: BluetoothLESerialProtocolType;
  constructor(name: string, serviceUuid: string, txUuid: string, rxUuid: string, selectionType: BluetoothLESerialProtocolType) {
    this.name = name;
    this.serviceUuid = serviceUuid;
    this.txUuid = txUuid;
    this.rxUuid = rxUuid;
    this.selectionType = selectionType;
  }
}

const nordicNus = new BluetoothLESerialProtocol(
  'Nordic NUS',
  '6e400001b5a3f393e0a9e50e24dcca9e',
  '6e400003b5a3f393e0a9e50e24dcca9e',
  '6e400002b5a3f393e0a9e50e24dcca9e',
  BluetoothLESerialProtocolType.NORDIC_UART_SERVICE_NUS
);

const microchipTransparentUart = new BluetoothLESerialProtocol(
  'Microchip Transparent UART',
  '49535343fe7d4ae58fa99fafd205e455',
  '495353431e4d4bd9ba6123c647249616',
  '49535343884143f4a8d4ecbe34729bb3',
  BluetoothLESerialProtocolType.MICROCHIP_TRANSPARENT_UART
);

const tiSerialPortService = new BluetoothLESerialProtocol(
  'TI Serial Port Service',
  'f000c0e004514000b000000000000000',
  'f000c0e104514000b000000000000000', // TI uses the same characteristic for read and write
  'f000c0e104514000b000000000000000',
  BluetoothLESerialProtocolType.TI_SERIAL_PORT_SERVICE_SPP
);

const ubloxUconnectXpress = new BluetoothLESerialProtocol(
  'u-blox u-connectXpress',
  '2456e1b926e28f83e744f34f01e9d701',
  '2456e1b926e28f83e744f34f01e9d703',
  '2456e1b926e28f83e744f34f01e9d703', // UBlox uses the same characteristic for read and write
  BluetoothLESerialProtocolType.UBLOX_UCONNECT_XPRESS
);

const siliconLabsSpp = new BluetoothLESerialProtocol(
  'Silicon Labs SPP',
  '4880c12cfdcb40778920a450d7f9b907',
  'fec26ec46d7144429f8155bc21d658d6',
  'fec26ec46d7144429f8155bc21d658d6', // Silicon Labs uses the same characteristic for read and write
  BluetoothLESerialProtocolType.SILICON_LABS_SPP
);

/** A array of all recognized BLE serial protocols. */
export const bluetoothLESerialProtocols = [
  nordicNus,
  microchipTransparentUart,
  tiSerialPortService,
  ubloxUconnectXpress,
  siliconLabsSpp
];

/**
 * Controller for Bluetooth LE (BLE) operations.
 */
export class BluetoothLEController {
  private app: App;

  discoveredBluetoothDevices: SerializableBluetoothDeviceWithMetadata[] = [];

  /**
   * This will be assigned when the user selects a Bluetooth device from the Bluetooth Settings.
   */
  selectedBluetoothDevice: SerializableBluetoothDeviceWithMetadata | null = null;

  /**
   * Stores info about the connected Bluetooth device. null if not connected to any device.
   */
  connectedBluetoothDevice: SerializableBluetoothDeviceWithMetadata | null = null;

  connectedDeviceServices: SerializableService[] = [];

  isBluetoothScanning = false;

  scanningTimer: NodeJS.Timeout | null = null;

  weInitiatedDisconnection = false;

  reconnectionPollingInterval: NodeJS.Timeout | null = null;

  /**
   * The selected Bluetooth protocol to use when connecting to a device.
   * Defaults to FIRST_DETECTED which automatically selects the first valid protocol found.
   */
  selectedSerialProtocol: BluetoothLESerialProtocolType = BluetoothLESerialProtocolType.FIRST_DETECTED;

  /**
   * Manual UUID inputs for when user selects "Manually Specify" protocol.
   */
  manualServiceUuid: string = '';
  manualRxCharacteristicUuid: string = '';
  manualTxCharacteristicUuid: string = '';

  /**
   * The duration in milliseconds to scan for Bluetooth devices.
   */
  scanDurationMsInput: string = DEFAULT_SCAN_DURATION_MS.toString();
  scanDurationMsValidated: number = DEFAULT_SCAN_DURATION_MS;
  scanDurationMsError: boolean = false;
  scanDurationMsHelperText: string = '';
  scanDurationDefaultHelperText: string = 'The duration to scan for BLE devices.';

  constructor(app: App) {
    this.app = app;

    // Reset the main process Bluetooth state, in case the renderer was reloaded but the main process was not
    window.electronAPI.bluetooth.resetBluetoothState();

    // Register for Bluetooth device discovered events
    window.electronAPI.bluetooth.onDeviceDiscovered((device) => this.onIpcBluetoothDeviceDiscovered(device));

    // Listen for disconnection events
    window.electronAPI.bluetooth.onDeviceDisconnected((deviceId: string) => {
      this.onIpcBluetoothDeviceDisconnected(deviceId);
    });

    // Listen for connection attempt complete events
    window.electronAPI.bluetooth.onConnectionAttemptComplete(async (error: string | null, bluetoothConnectionAttemptSuccess: BluetoothConnectionAttemptSuccess | null) => {
      await this.onIpcBluetoothConnectionAttemptComplete(error, bluetoothConnectionAttemptSuccess);
    });

    this.validateAndApplyScanDurationMs();

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

    this.scanningTimer = setTimeout(() => {
      this.stopBluetoothScan();
    }, this.scanDurationMsValidated);
  }

  /**
   * Call to stop the Bluetooth scanning process. This might be called by the user if they click the "Stop scanning" button mid-way through a scan. It also gets called automatically after the scan duration.
   */
  stopBluetoothScan = async () => {
    const result = await window.electronAPI.bluetooth.stopPeripheralScan();
    if (!result.success) {
      this.app.snackbar.sendToSnackbar(`Failed to stop Bluetooth scan. Error: ${result.error}.`, 'error');
      return;
    }

    this.app.snackbar.sendToSnackbar('Bluetooth scan finished.', 'success');

    runInAction(() => {
      this.isBluetoothScanning = false;
      if (this.scanningTimer) {
        clearTimeout(this.scanningTimer);
        this.scanningTimer = null;
      }
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
    // Add some additional metadata - detect which serial protocols this device supports
    for (const protocol of bluetoothLESerialProtocols) {
      if (deviceInList.nobleData.advertisement.serviceUuids.includes(protocol.serviceUuid)) {
        // Add protocol to list of supported serial protocols in advertisement data, unless it is already in the list
        if (!deviceInList.supportedSerialProtocolsInAdvData.includes(protocol)) {
          deviceInList.supportedSerialProtocolsInAdvData.push(protocol);
        }
      }
    }
  }

  setSelectedBluetoothDevice = (device: SerializableBluetoothDeviceWithMetadata) => {
    log.info('setSelectedBluetoothDevice() called. device=', device);
    this.selectedBluetoothDevice = device;
  }

  setSelectedProtocol = (protocol: BluetoothLESerialProtocolType) => {
    this.selectedSerialProtocol = protocol;
  }

  setManualServiceUuid = (uuid: string) => {
    this.manualServiceUuid = uuid;
  }

  setManualRxCharacteristicUuid = (uuid: string) => {
    this.manualRxCharacteristicUuid = uuid;
  }

  setManualTxCharacteristicUuid = (uuid: string) => {
    this.manualTxCharacteristicUuid = uuid;
  }

  /**
   * Set the number of milliseconds to scan for Bluetooth devices. The user can always stop the scan prior to this timeout by clicking the "Stop scanning" button.
   * @param durationMs The number of milliseconds to scan for Bluetooth devices.
   */
  setScanDurationMsInput = (durationMs: string) => {
    this.scanDurationMsInput = durationMs;
  }

  validateAndApplyScanDurationMs = () => {
    const parsed = z.coerce.number().int().min(SCAN_DURATION_MS_MIN).max(SCAN_DURATION_MS_MAX).safeParse(this.scanDurationMsInput);
    if (!parsed.success) {
      this.scanDurationMsError = true;
      this.scanDurationMsHelperText = parsed.error.errors[0].message;
      return;
    }

    // If we get here, the input is valid
    this.scanDurationMsError = false;
    this.scanDurationMsHelperText = this.scanDurationDefaultHelperText;
    this.scanDurationMsValidated = parsed.data;
  }

  /**
   * Starts the process of connecting to the selected Bluetooth device. This should be called when the user presses an "Open" button in NinjaTerm, and "Bluetooth" is selected as the connection type.
   */
  connect = async () => {
    log.info('connect() called.');
    if (!this.selectedBluetoothDevice) {
      this.app.snackbar.sendToSnackbar('No Bluetooth device selected. Please select a device from the Bluetooth Settings.', 'error');
      return;
    }
    // Make IPC call to start the connection attempt
    const result = await window.electronAPI.bluetooth.startConnectionAttempt(this.selectedBluetoothDevice.nobleData.id);
    // Starting the connection can fail if we are already connecting to a device.
    if (result.error) {
      // Don't show error if we are already trying to reconnect as errors are to be expected here.
      if (this.app.connController.connState !== ConnState.CLOSED_BUT_WILL_REOPEN) {
        this.app.snackbar.sendToSnackbar(`Failed to start connection attempt to Bluetooth device. Error: ${result.error}.`, 'error');
      }
      return;
    }
  }

  /**
   * Called by the main process when the connection attempt is complete. This could be either because the connection attempt was successful or failed.
   *
   * @param error The error message if the connection attempt failed.
   * @param bluetoothConnectionAttemptSuccess The success message if the connection attempt was successful.
   * @returns
   */
  async onIpcBluetoothConnectionAttemptComplete (error: string | null, bluetoothConnectionAttemptSuccess: BluetoothConnectionAttemptSuccess | null) {
    log.info('onIpcBluetoothConnectionAttemptComplete() called. error: ', error, 'bluetoothConnectionAttemptSuccess: ', bluetoothConnectionAttemptSuccess);
    if (error) {
      // Don't show error if we are already trying to reconnect as errors are to be expected here.
      if (this.app.connController.connState !== ConnState.CLOSED_BUT_WILL_REOPEN) {
        this.app.snackbar.sendToSnackbar(`Failed to connect to Bluetooth device. Error: ${error}.`, 'error');
      }
      return;
    }

    if (this.selectedBluetoothDevice === null) {
      this.app.snackbar.sendToSnackbar('No Bluetooth device selected (this.selectedBluetoothDevice is null) even though the connection attempt was successful.', 'error');
      return;
    }

    if (bluetoothConnectionAttemptSuccess === null) {
      this.app.snackbar.sendToSnackbar('Bluetooth connection success message was not returned from the main process.', 'error');
      return;
    }

    // Look for valid services/characteristics in the returned information
    if(!bluetoothConnectionAttemptSuccess.services) {
      this.app.snackbar.sendToSnackbar('Services information was not returned from the main process.', 'error');
      return;
    }

    // Build array of protocols to check based on user selection
    let protocolsToCheck: BluetoothLESerialProtocol[] = [];

    if (this.selectedSerialProtocol === BluetoothLESerialProtocolType.MANUALLY_SPECIFY) {
      // Validate that manual UUIDs are provided
      if (!this.manualServiceUuid || !this.manualRxCharacteristicUuid || !this.manualTxCharacteristicUuid) {
        this.app.snackbar.sendToSnackbar('Manual UUIDs not specified. Please enter Service, RX, and TX UUIDs.', 'error');
        window.electronAPI.bluetooth.disconnectDevice(this.selectedBluetoothDevice.nobleData.id);
        return;
      }
      // Create a protocol object with the manual UUIDs
      protocolsToCheck = [
        new BluetoothLESerialProtocol(
          'Manually Specified',
          this.manualServiceUuid,
          this.manualTxCharacteristicUuid,
          this.manualRxCharacteristicUuid,
          BluetoothLESerialProtocolType.MANUALLY_SPECIFY
        )
      ];
    } else if (this.selectedSerialProtocol === BluetoothLESerialProtocolType.FIRST_DETECTED) {
      // Check all protocols
      protocolsToCheck = bluetoothLESerialProtocols;
    } else {
      // User selected a specific protocol
      const selectedProtocolObj = bluetoothLESerialProtocols.find(p => p.selectionType === this.selectedSerialProtocol);
      if (selectedProtocolObj) {
        protocolsToCheck = [selectedProtocolObj];
      }
    }

    // Iterate over protocols to find a valid one
    let foundProtocol: BluetoothLESerialProtocol | null = null;
    for (const protocol of protocolsToCheck) {
      // Look for the service
      const serviceIndex = bluetoothConnectionAttemptSuccess.services.findIndex(service => service.uuid === protocol.serviceUuid);
      if (serviceIndex === -1) {
        continue;
      }
      log.info('Found service.');

      const service = bluetoothConnectionAttemptSuccess.services[serviceIndex];

      // Check RX characteristic is present and has "writeWithoutResponse" property
      const readCharacteristicIndex = service.characteristics.findIndex(characteristic => characteristic.uuid === protocol.rxUuid);
      if (readCharacteristicIndex === -1) {
        continue;
      }
      const readCharacteristic = service.characteristics[readCharacteristicIndex];
      if (!readCharacteristic.properties.includes('writeWithoutResponse')) {
        continue;
      }
      log.info('Found read characteristic.');

      // Check TX characteristic is present and has "notify" property
      const writeCharacteristicIndex = service.characteristics.findIndex(characteristic => characteristic.uuid === protocol.txUuid);
      if (writeCharacteristicIndex === -1) {
        continue;
      }
      const writeCharacteristic = service.characteristics[writeCharacteristicIndex];
      if (!writeCharacteristic.properties.includes('notify')) {
        continue;
      }
      log.info(`Found write characteristic. This completed the check for the protocol. Found ${protocol.name} on connected Bluetooth device.`);

      // Use the first valid serial protocol we find
      foundProtocol = protocol;
      break;
    }

    if (!foundProtocol) {
      this.app.snackbar.sendToSnackbar('Correct service and characteristic UUIDs were not found on connected Bluetooth device.', 'error');
      // We need to tell the main process to disconnect from the device
      window.electronAPI.bluetooth.disconnectDevice(this.selectedBluetoothDevice.nobleData.id);
      return;
    }

    // If we get here, we have found a valid serial protocol
    const setupReadAndWriteResult = await window.electronAPI.bluetooth.setupReadAndWrite(
      foundProtocol.serviceUuid,
      foundProtocol.rxUuid,
      foundProtocol.txUuid);
    if (!setupReadAndWriteResult.success) {
      this.app.snackbar.sendToSnackbar(`Failed to setup read and write on connected Bluetooth device. Error: ${setupReadAndWriteResult.error}.`, 'error');
      // We need to tell the main process to disconnect from the device
      window.electronAPI.bluetooth.disconnectDevice(this.selectedBluetoothDevice.nobleData.id);
      return;
    }

    // Setup listener for RX data
    window.electronAPI.bluetooth.onDataReceived((deviceId: string, data: Buffer) => {
      this.app.parseRxData(data);
    });

    // If we get here, we have connected to the device and have found valid services and characteristics for the selected serial protocol
    // We can consider our connection attempt successful
    this.app.snackbar.sendToSnackbar(
      `Bluetooth device connected: ${this.selectedBluetoothDevice.nobleData.advertisement.localName} (${this.selectedBluetoothDevice.nobleData.id}).`,
      'success');
    runInAction(() => {
      this.connectedBluetoothDevice = this.selectedBluetoothDevice;
      this.app.connController.connState = ConnState.OPENED;
      this.stopPollingForReconnection();
    });
  }

  /**
   * Call to stop the polling for reconnection to the Bluetooth device. Does nothing if no reconnection polling is in progress.
   */
  stopPollingForReconnection = () => {
    if (this.reconnectionPollingInterval) {
      clearInterval(this.reconnectionPollingInterval);
      this.reconnectionPollingInterval = null;
    }
  }

  /** Close the Bluetooth connection to currently connected Bluetooth device. */
  close = async () => {
    log.info('BluetoothLEController.close() called');
    if (!this.connectedBluetoothDevice) {
      log.error('close() called but no Bluetooth device selected. Cannot close Bluetooth connection.');
      return;
    }

    this.stopPollingForReconnection();

    this.weInitiatedDisconnection = true;
    const result = await window.electronAPI.bluetooth.disconnectDevice(this.connectedBluetoothDevice.nobleData.id);
    if (!result.success) {
      this.app.snackbar.sendToSnackbar(`Failed to disconnect from Bluetooth device. Error: ${result.error}.`, 'error');
      return;
    }
  }

  /** Called from the main process when a Bluetooth device is disconnected. This might be because we called close() and initiated the disconnection, or the device itself initiated the disconnection. */
  onIpcBluetoothDeviceDisconnected(deviceId: string) {
    log.info('onIpcBluetoothDeviceDisconnected() called. deviceId=', deviceId);

    // If we have already disconnected the device, don't do anything
    if (this.connectedBluetoothDevice === null) {
      log.info('onIpcBluetoothDeviceDisconnected() called but no Bluetooth device connected. Ignoring.');
      return;
    }

    // If we get here, it means we did not initiate the disconnection
    let portState = ConnState.CLOSED;
    if (this.weInitiatedDisconnection) {
      this.app.snackbar.sendToSnackbar(
        `Bluetooth device disconnected: ${this.connectedBluetoothDevice.nobleData.advertisement.localName} (${this.connectedBluetoothDevice.nobleData.id}).`,
        'success');
      portState = ConnState.CLOSED;
    } else {
      // Bluetooth device disconnected unexpectedly!
      this.app.snackbar.sendToSnackbar(
        `Bluetooth device disconnected unexpectedly: ${this.connectedBluetoothDevice.nobleData.advertisement.localName} (${this.connectedBluetoothDevice.nobleData.id}).`,
        'error');
      portState = ConnState.CLOSED_BUT_WILL_REOPEN
      this.reconnectionPollingInterval = setInterval(() => {
        // Attempt to reconnect to the Bluetooth device
        this.connect();
      }, RECONNECTION_POLLING_INTERVAL_MS);
    }
    this.weInitiatedDisconnection = false;

    runInAction(() => {
      this.connectedBluetoothDevice = null;
      this.connectedDeviceServices = [];
      this.app.connController.connState = portState;
    });

    window.electronAPI.bluetooth.removeAllListeners('bluetooth:data-received');
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
