import { ipcMain } from 'electron';
import { SerializableBluetoothDevice, BluetoothDeviceResponse, BluetoothServicesMessage, SerializableService, BluetoothConnectionAttemptSuccess } from '../shared/types/bluetooth';

// Don't call noble.reset(). On Windows this gave me the error:
// FATAL ERROR:  this._bindings.reset is not a function
import noble from '@abandonware/noble';

const CONNECTION_ATTEMPT_TIMEOUT_MS = 5 * 1000;


enum ConnectionState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
}

/**
 * Provide a Bluetooth service running in the Electron main process for the renderer process to use.
 *
 * Uses the noble library under the hood to communicate with Bluetooth devices.
 */
export class MainBluetoothService {

  connectionState: ConnectionState = ConnectionState.DISCONNECTED;

  discoveredDevices: noble.Peripheral[] = [];

  isScanningForPeripherals: boolean = false;

  scanningTimer: NodeJS.Timeout | null = null;

  nobleState: string | null = null;

  /**
   * Holds the peripheral that we are either connecting to, or have connected to.
   */
  peripheral: noble.Peripheral | null = null;
  discoveredServices: noble.Service[] = [];
  txCharacteristic: noble.Characteristic | null = null;
  rxCharacteristic: noble.Characteristic | null = null;

  // For storing received data batches similar to serial/socket services
  // private dataBatches = new Map<string, Buffer[]>();
  // private batchTimeouts = new Map<string, NodeJS.Timeout>();
  // private readonly RX_DATA_BATCH_TIMEOUT_MS = 50;
  private mainWindow: Electron.BrowserWindow | null = null;

  connectionAttemptTimeout: NodeJS.Timeout | null = null;

  /**
   *
   * @param mainWindow The main window is needed to send Bluetooth events to the renderer (such as received data).
   */
  constructor(mainWindow?: Electron.BrowserWindow) {
    this.mainWindow = mainWindow || null;

    // Initialize noble event handlers
    noble.on('discover', this.onNobleDiscover);
    // noble automatically fires a poweredOn state change event on startup (it seems)
    noble.on('stateChange', this.onNobleStateChange);
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

    ipcMain.handle('bluetooth:stop-peripheral-scan', this.onIpcStopPeripheralScan);

    ipcMain.handle('bluetooth:get-discovered-devices', this.onIpcGetDiscoveredDevices);

    ipcMain.handle('bluetooth:start-connection-attempt', async (_event, deviceId: string) => {
      console.log('bluetooth:start-connection-attempt called. deviceId=', deviceId);
      return await this.onIpcConnectToDevice(deviceId);
    });

    ipcMain.handle('bluetooth:disconnect-device', async (_event, deviceId: string) => {
      console.log('bluetooth:disconnect-device called. deviceId=', deviceId);
      return await this.disconnectFromDevice(deviceId);
    });

    ipcMain.handle('bluetooth:write-data', async (_event, data: Buffer) => {
      console.log('bluetooth:write-data called. data.length=', data.length);
      return await this.writeData(data);
    });

    ipcMain.handle('bluetooth:setup-read-and-write', async (_event, serviceUuid: string, rxCharacteristicUuid: string, txCharacteristicUuid: string) => {
      return await this.setupReadAndWrite(serviceUuid, rxCharacteristicUuid, txCharacteristicUuid);
    });

  }

  onNobleStateChange = (state: string) => {
    console.log('onNobleStateChange called. state=', state);
    this.nobleState = state;
  }

  onNobleDiscover = (peripheral: noble.Peripheral) => {
    console.log('onNobleDiscover called. peripheral.id=', peripheral.id);

    if (peripheral.id.startsWith('f7a2')) {
      console.log('Peripheral:', peripheral);
    }

    this.mainWindow?.webContents.send('bluetooth:device-discovered', this.noblePeripheralToSerializable(peripheral));

    // Check if we already have this device (avoid duplicates)
    // const existingDevice = this.discoveredDevices.find(p => p.id === peripheral.id);
    // if (existingDevice) {
    //   return;
    // }

    // if (!peripheral.connectable) {
    //   return;
    // }

    // Devices don't normally report services and characteristics during
    // peripheral.discoverAllServicesAndCharacteristics(this.onDiscoveredServicesAndCharacteristics);

    // If we get here, we have a valid device we want to present to the user
    this.discoveredDevices.push(peripheral);
  }

  noblePeripheralToSerializable = (peripheral: noble.Peripheral): SerializableBluetoothDevice => {
    return {
      id: peripheral.id,
      uuid: peripheral.uuid,
      address: peripheral.address,
      addressType: peripheral.addressType,
      connectable: peripheral.connectable,
      advertisement: peripheral.advertisement,
      rssi: peripheral.rssi,
      state: peripheral.state
    };
  }

  convertServicesToSerializable = (services: noble.Service[]): SerializableService[] => {
    return services.map(service => ({
      uuid: service.uuid,
      name: service.name,
      type: service.type,
      characteristics: service.characteristics?.map(char => ({
        uuid: char.uuid,
        name: char.name,
        properties: char.properties || [],
        descriptors: char.descriptors?.map(desc => ({
          uuid: desc.uuid,
          name: desc.name
        }))
      })) || []
    }));
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

    // Clear previously discovered devices
    this.discoveredDevices = [];

    this.isScanningForPeripherals = true;

    // Setting allowDuplicates to true allowed me to capture more information from a Bluetooth device on Windows which would sometimes
    // return some fields in a discover event, but not in subsequent events.
    noble.startScanning([], true, this.onScanningError);
    // The renderer process will tell us when to stop scanning
  }

  onIpcStopPeripheralScan = (): { success: boolean; error?: string } => {
    console.log('onIpcStopPeripheralScan called.');
    noble.stopScanning();
    return { success: true };
  }

  /**
   * Handler for when the renderer requests the list of discovered devices.
   */
  onIpcGetDiscoveredDevices = (): BluetoothDeviceResponse => {
    console.log('bluetooth:get-discovered-devices called.');
    try {
      // Convert peripheral objects to serializable format
      const serializableDevices: SerializableBluetoothDevice[] = this.discoveredDevices.map(peripheral => ({
        id: peripheral.id,
        uuid: peripheral.uuid,
        address: peripheral.address,
        addressType: peripheral.addressType,
        connectable: peripheral.connectable,
        advertisement: {
          localName: peripheral.advertisement?.localName,
          serviceUuids: peripheral.advertisement?.serviceUuids,
          manufacturerData: peripheral.advertisement?.manufacturerData,
          serviceData: peripheral.advertisement?.serviceData,
          txPowerLevel: peripheral.advertisement?.txPowerLevel
        },
        rssi: peripheral.rssi,
        state: peripheral.state
      }));

      return { success: true, devices: serializableDevices };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Called when the renderer requests to connect to a Bluetooth device. Connects to the specified device (by ID), discovers services and characteristics
   * and returns the services and characteristics to the renderer.
   *
   * @param deviceId
   * @returns
   */
  async onIpcConnectToDevice(deviceId: string): Promise<{ error?: string }> {
    console.log('onIpcConnectToDevice() called. deviceId=', deviceId);
    if (this.connectionState === ConnectionState.CONNECTING) {
      console.log('Already connecting to a device. Cannot connect to another device.');
      return { error: 'Already connecting to a device. Cannot connect to another device.' };
    }
    if (this.connectionState === ConnectionState.CONNECTED) {
      console.log('Already connected to a device. Cannot connect to another device.');
      return { error: 'Already connected to a device. Cannot connect to another device.' };
    }
    this.connectionState = ConnectionState.CONNECTING;
    // Set a timeout to fail the connection attempt if it takes too long
    this.connectionAttemptTimeout = setTimeout(() => {
      console.log(`Bluetooth connection attempt to ${deviceId} timed out.`);
      this.connectionState = ConnectionState.DISCONNECTED;
      this.mainWindow!.webContents.send('bluetooth:connection-attempt-complete', 'Connection attempt timed out.', null);
      this.connectionAttemptTimeout = null;
      // Stop noble from trying to connect
      this.peripheral!.disconnect();
      // this.peripheral!.cancelConnect();
    }, CONNECTION_ATTEMPT_TIMEOUT_MS);

    // Find the device in discovered peripherals
    const peripheral = this.discoveredDevices.find(p => p.id === deviceId);
    if (!peripheral) {
      return { error: 'Device not found in discovered peripherals.' };
    }

    // Register for the connect event
    peripheral.once('connect', (error ) => {
      this.onConnect(peripheral, error);
    });

    // Connect to the peripheral
    peripheral.connect((error: string | null) => {
      // We only need to handle errors here. If we connect successfully, we'll handle that in the connect event listener.
      if (error) {
        console.error(`Callback passed to connect() called and error was not null. Failed to connect to Bluetooth device: ${peripheral.advertisement!.localName} (${peripheral.id}). error=${error}.`);
        if (this.connectionAttemptTimeout) {
          clearTimeout(this.connectionAttemptTimeout);
          this.connectionAttemptTimeout = null;
        }
        this.connectionState = ConnectionState.DISCONNECTED;
        // Emit a IPC connection attempt complete message, indicating failure
        this.mainWindow!.webContents.send('bluetooth:connection-attempt-complete', error, null);
        return { error };
      }
    });

    return {};
  }

  onConnect = (peripheral: noble.Peripheral, error: string | null) => {
    if (error) {
      console.error(`Failed to connect to Bluetooth device: ${peripheral.advertisement!.localName} (${peripheral.id}). error=${error}.`);
      if (this.connectionAttemptTimeout) {
        clearTimeout(this.connectionAttemptTimeout);
        this.connectionAttemptTimeout = null;
      }
      this.connectionState = ConnectionState.DISCONNECTED;
      // Emit a IPC connection attempt complete message, indicating failure
      this.mainWindow!.webContents.send('bluetooth:connection-attempt-complete', error, null);
      return;
    }

    // If we get here, connection was successful
    console.log(`Connected to Bluetooth device: ${peripheral.advertisement!.localName} (${peripheral.id}). error=${error}.`);
    this.peripheral = peripheral;

    peripheral.discoverAllServicesAndCharacteristics(this.onNobleDiscoveredServicesAndCharacteristics);

    // Handle disconnection
    peripheral.on('disconnect', () => {
      this.onNoblePeripheralDisconnect(peripheral);
    });
  }

  /**
   * Called when the noble library discovers services and characteristics on a peripheral.
   * @param error
   * @param services
   * @param characteristics
   */
  onNobleDiscoveredServicesAndCharacteristics = (error: string, services: noble.Service[], characteristics: noble.Characteristic[]) => {
    console.log('onNobleDiscoveredServicesAndCharacteristics called. error=', error, 'services=', services, 'characteristics=', characteristics);

    // At this point, we have successfully discovered services and characteristics, so we consider the connection attempt complete.
    this.connectionState = ConnectionState.CONNECTED;

    if (this.connectionAttemptTimeout) {
      clearTimeout(this.connectionAttemptTimeout);
      this.connectionAttemptTimeout = null;
    }

    // Save the discovered services and characteristics
    this.discoveredServices = services;

    // Emit a IPC connection attempt complete message, indicating success
    const bluetoothConnectionAttemptSuccess: BluetoothConnectionAttemptSuccess = {
      deviceId: this.peripheral!.id,
      services: this.convertServicesToSerializable(services)
    };
    this.mainWindow!.webContents.send('bluetooth:connection-attempt-complete', error, bluetoothConnectionAttemptSuccess);
  }

  async disconnectFromDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    console.log('disconnectFromDevice() called. deviceId=', deviceId);
    try {
      const peripheral = this.peripheral;
      if (!peripheral) {
        return { success: false, error: 'Device not connected' };
      }

      await new Promise<void>((resolve, reject) => {
        peripheral.disconnect((error?: Error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      return { success: true };
    } catch (error) {
      console.error(`Failed to disconnect from Bluetooth device ${deviceId}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /** Called by the noble library when a peripheral disconnects, e.g. after disconnectFromDevice() is called or the device itself initiates the disconnect. */
  onNoblePeripheralDisconnect(peripheral: noble.Peripheral) {
    console.log('onNoblePeripheralDisconnect called. peripheral.id=', peripheral.id);
    if (this.connectionState === ConnectionState.DISCONNECTED) {
      console.log('Got disconnect event for peripheral, but no device is connected. Ignoring.');
      return;
    }

    if (peripheral.id !== this.peripheral!.id) {
      console.log('Got disconnect event for peripheral, but it is not the connected peripheral. Ignoring.');
      return;
    }

    // I've seen sometimes that after connection, the device disconnects and scanning for services and characteristics does not work,
    // but also does not trigger an error (fails silently). This event gets triggered, so in this case we need to set connectionState to DISCONNECTED.
    if (this.connectionState === ConnectionState.CONNECTING) {
      console.log('Got disconnect event for peripheral, but we are still connecting to it. Setting connectionState to DISCONNECTED.');
      this.connectionState = ConnectionState.DISCONNECTED;
      // Emit a IPC connection attempt complete message, indicating failure
      this.mainWindow!.webContents.send('bluetooth:connection-attempt-complete', 'Device disconnected while still connecting and scanning for services and characteristics.', null);
    }

    const deviceId = peripheral.id;
    console.log(`Bluetooth device disconnected: ${deviceId}`);
    this.connectionState = ConnectionState.DISCONNECTED;
    this.peripheral = null;
    this.discoveredServices = [];
    this.txCharacteristic = null;
    this.rxCharacteristic = null;

    this.mainWindow!.webContents.send('bluetooth:device-disconnected', deviceId);
  }

  async setupReadAndWrite(serviceUuid: string, rxCharacteristicUuid: string, txCharacteristicUuid: string): Promise<{ success: boolean; error?: string }> {
    console.log('setupReadAndWrite called. serviceUuid=', serviceUuid, 'rxCharacteristicUuid=', rxCharacteristicUuid, 'txCharacteristicUuid=', txCharacteristicUuid);
    const peripheral = this.peripheral;
    if (!peripheral) {
      return { success: false, error: 'No device is connected. Cannot setup read and write.' };
    }

    if (!this.discoveredServices) {
      return { success: false, error: 'No services have been discovered (this.discoveredServices is null). Cannot setup read and write.' };
    }

    const service = this.discoveredServices.find(service => service.uuid === serviceUuid);
    if (!service) {
      return { success: false, error: `Service with UUID "${serviceUuid}" not found. Cannot setup read and write.` };
    }

    const rxCharacteristic = service.characteristics.find(characteristic => characteristic.uuid === rxCharacteristicUuid);
    if (!rxCharacteristic) {
      return { success: false, error: `Read characteristic with UUID "${rxCharacteristicUuid}" not found. Cannot setup read and write.` };
    }

    const txCharacteristic = service.characteristics.find(characteristic => characteristic.uuid === txCharacteristicUuid);
    if (!txCharacteristic) {
      return { success: false, error: `Write characteristic with UUID "${txCharacteristicUuid}" not found. Cannot setup read and write.` };
    }

    this.txCharacteristic = txCharacteristic;
    this.rxCharacteristic = rxCharacteristic;

    // Setup listener for TX data. Before we can do this, we need to start notifications.
    txCharacteristic.notify(true, (error) => {
      if (error) {
        console.log(`Failed to start notifications on tx characteristic ${txCharacteristicUuid}:`, error);
      }
    });
    txCharacteristic.on('data', (data: Buffer) => {
      console.log(`Received data from ${peripheral.id} on write characteristic. data: ${data.toString('hex')}`);
      // Send data to renderer
      this.mainWindow?.webContents.send('bluetooth:data-received', peripheral.id, data);
    });

    return { success: true };
  }

  async writeData(data: Buffer): Promise<{ success: boolean; error?: string }> {
    console.log('writeData called. data.length=', data.length);
    console.log('data=', data.toString('hex'));
    // try {
    //   const connection = this.connectedPeripherals.get(deviceId);
    //   if (!connection) {
    //     return { success: false, error: 'Device not connected' };
    //   }

    //   if (!connection.writeCharacteristic) {
    //     return { success: false, error: 'No write characteristic available' };
    //   }

    //   const buffer = Buffer.from(data);

    //   await new Promise<void>((resolve, reject) => {
    //     connection.writeCharacteristic!.write(buffer, false, (error) => {
    //       if (error) {
    //         reject(error);
    //       } else {
    //         resolve();
    //       }
    //     });
    //   });

    //   return { success: true };
    // } catch (error) {
    //   console.error(`Failed to write data to Bluetooth device ${deviceId}:`, error);
    //   return { success: false, error: (error as Error).message };
    // }
    if (!this.peripheral) {
      return { success: false, error: 'No device is connected. Cannot write data.' };
    }

    if (!this.rxCharacteristic) {
      return { success: false, error: 'No write characteristic available. Cannot write data.' };
    }

    await new Promise<void>((resolve, reject) => {
      this.rxCharacteristic!.write(data, false, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    console.log('writeData done. data.length=', data.length);
    return { success: true };
  }

}
