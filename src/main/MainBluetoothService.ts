import { ipcMain } from 'electron';
import { SerializableBluetoothDevice, BluetoothDeviceResponse, BluetoothServicesMessage, SerializableService, BluetoothConnectionAttemptSuccess } from '../shared/types/bluetooth';
import noble from '@abandonware/noble';

/**
 * Provide a Bluetooth service running in the Electron main process for the renderer process to use.
 *
 * Uses the noble library under the hood to communicate with Bluetooth devices.
 */
export class MainBluetoothService {

  discoveredDevices: noble.Peripheral[] = [];

  isScanningForPeripherals: boolean = false;

  scanningTimer: NodeJS.Timeout | null = null;

  nobleState: string | null = null;

  connectedPeripheral: noble.Peripheral | null = null;
  discoveredServices: noble.Service[] = [];
  txCharacteristic: noble.Characteristic | null = null;
  rxCharacteristic: noble.Characteristic | null = null;

  // For storing received data batches similar to serial/socket services
  private dataBatches = new Map<string, Buffer[]>();
  private batchTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly RX_DATA_BATCH_TIMEOUT_MS = 50;
  private mainWindow: Electron.BrowserWindow | null = null;

  /**
   *
   * @param mainWindow The main window is needed to send Bluetooth events to the renderer (such as received data).
   */
  constructor(mainWindow?: Electron.BrowserWindow) {
    this.mainWindow = mainWindow || null;

    // Initialize noble event handlers
    noble.on('discover', this.onNobleDiscover);
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

    ipcMain.handle('bluetooth:stop-peripheral-scan', this.onIpcStopPeripheralScan);

    ipcMain.handle('bluetooth:get-discovered-devices', this.onIpcGetDiscoveredDevices);

    ipcMain.handle('bluetooth:connect-device', async (_event, deviceId: string) => {
      console.log('bluetooth:connect-device called. deviceId=', deviceId);
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

  onStateChange = (state: string) => {
    console.log('stateChange called. state=', state);
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

  onDiscoveredServicesAndCharacteristics = (error: string, services: noble.Service[], characteristics: noble.Characteristic[]) => {
    console.log('onDiscoveredServicesAndCharacteristics called. error=', error, 'services=', services, 'characteristics=', characteristics);

    // Save the discovered services and characteristics
    this.discoveredServices = services;

    // Emit a IPC connection attempt complete message, indicating success
    const bluetoothConnectionAttemptSuccess: BluetoothConnectionAttemptSuccess = {
      deviceId: this.connectedPeripheral!.id,
      services: this.convertServicesToSerializable(services)
    };
    this.mainWindow!.webContents.send('bluetooth:connection-attempt-complete', error, bluetoothConnectionAttemptSuccess);
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

  private sendBatchedData(deviceId: string) {
    const batch = this.dataBatches.get(deviceId);
    if (batch && batch.length > 0) {
      const combinedBuffer = Buffer.concat(batch);
      this.mainWindow?.webContents.send('bluetooth:data-received', deviceId, combinedBuffer);
      this.dataBatches.set(deviceId, []);
    }
  }

  /**
   * Called when the renderer requests to connect to a Bluetooth device. Connects to the specified device (by ID), discovers services and characteristics
   * and returns the services and characteristics to the renderer.
   *
   * @param deviceId
   * @returns
   */
  async onIpcConnectToDevice(deviceId: string): Promise<{ bluetoothServicesMsg: BluetoothServicesMessage | null; error?: string }> {
    // Find the device in discovered peripherals
    const peripheral = this.discoveredDevices.find(p => p.id === deviceId);
    if (!peripheral) {
      return { bluetoothServicesMsg: null, error: 'Device not found in discovered peripherals.' };
    }

    // Connect to the peripheral
    peripheral.once('connect', (error ) => {
      this.onConnect(peripheral, error);
    });

    peripheral.connect((error: string) => {
      console.log(`Callback passed to connect() called. error=${error}.`);
      this.connectedPeripheral = peripheral;
    });

    return { bluetoothServicesMsg: null, error: 'Test' };
  }

  onConnect = (peripheral: noble.Peripheral, error: string) => {
    console.log(`Connected to Bluetooth device: ${peripheral.advertisement!.localName} (${peripheral.id}). error=${error}.`);
    this.connectedPeripheral = peripheral;

    // // Discover services and characteristics
    // const { services, characteristics } = await new Promise<{
    //   services: noble.Service[];
    //   characteristics: noble.Characteristic[];
    // }>((resolve, reject) => {
    //   peripheral.discoverAllServicesAndCharacteristics((error, services, characteristics) => {
    //     if (error) {
    //       reject(error);
    //     } else {
    //       resolve({ services: services || [], characteristics: characteristics || [] });
    //     }
    //   });
    // });

    peripheral.discoverAllServicesAndCharacteristics(this.onDiscoveredServicesAndCharacteristics);

    // console.log(`Discovered ${services.length} services and ${characteristics.length} characteristics`);
    // console.log('services=', services);
    // console.log('characteristics=', characteristics);

    // // Save discovered services, we need to keep these around to use when the renderer process wants to
    // // read and write data.
    // this.discoveredServices = services;

    // // Handle disconnection
    // peripheral.on('disconnect', () => {
    //   this.onNoblePeripheralDisconnect(peripheral);
    // });

    // Send device services information to renderer
    // const serializableServices = this.convertServicesToSerializable(services);
    // const servicesMessage: BluetoothServicesMessage = {
    //   deviceId,
    //   services: serializableServices
    // };

    // this.mainWindow?.webContents.send('bluetooth:device-services-discovered', servicesMessage);
  }

  async disconnectFromDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {

    try {
      const peripheral = this.connectedPeripheral;
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
  onNoblePeripheralDisconnect = (peripheral: noble.Peripheral) => {
    if (this.connectedPeripheral === null) {
      console.log('Got disconnect event for peripheral, but no device is connected. Ignoring.');
      return;
    }

    if (peripheral.id !== this.connectedPeripheral.id) {
      console.log('Got disconnect event for peripheral, but it is not the connected peripheral. Ignoring.');
      return;
    }

    const deviceId = peripheral.id;
    console.log(`Bluetooth device disconnected: ${deviceId}`);
    this.connectedPeripheral = null;
    this.discoveredServices = [];
    this.txCharacteristic = null;
    this.rxCharacteristic = null;

    // Clean up batching
    const timeout = this.batchTimeouts.get(deviceId);
    if (timeout) {
      clearTimeout(timeout);
      this.batchTimeouts.delete(deviceId);
    }
    this.sendBatchedData(deviceId); // Send any remaining data
    this.dataBatches.delete(deviceId);

    this.mainWindow!.webContents.send('bluetooth:device-disconnected', deviceId);
  }

  async setupReadAndWrite(serviceUuid: string, rxCharacteristicUuid: string, txCharacteristicUuid: string): Promise<{ success: boolean; error?: string }> {
    console.log('setupReadAndWrite called. serviceUuid=', serviceUuid, 'rxCharacteristicUuid=', rxCharacteristicUuid, 'txCharacteristicUuid=', txCharacteristicUuid);
    const peripheral = this.connectedPeripheral;
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
    if (!this.connectedPeripheral) {
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
