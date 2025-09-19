import { ipcMain } from 'electron';
import { SerializableBluetoothDevice, BluetoothDeviceResponse } from '../shared/types/bluetooth';
import noble from '@abandonware/noble';

const SCAN_DURATION_MS = 2000;

export class BluetoothService {

  discoveredDevices: noble.Peripheral[] = [];

  isScanningForPeripherals: boolean = false;

  scanningTimer: NodeJS.Timeout | null = null;

  nobleState: string | null = null;

  // Connected devices and their characteristics
  connectedPeripherals = new Map<string, {
    peripheral: noble.Peripheral;
    writeCharacteristic: noble.Characteristic | null;
    readCharacteristic: noble.Characteristic | null;
  }>();

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

    ipcMain.handle('bluetooth:get-discovered-devices', this.onIpcGetDiscoveredDevices);

    ipcMain.handle('bluetooth:connect-device', async (_event, deviceId: string) => {
      console.log('bluetooth:connect-device called. deviceId=', deviceId);
      return await this.connectToDevice(deviceId);
    });

    ipcMain.handle('bluetooth:disconnect-device', async (_event, deviceId: string) => {
      console.log('bluetooth:disconnect-device called. deviceId=', deviceId);
      return await this.disconnectFromDevice(deviceId);
    });

    ipcMain.handle('bluetooth:write-data', async (_event, deviceId: string, data: number[]) => {
      console.log('bluetooth:write-data called. deviceId=', deviceId, 'data.length=', data.length);
      return await this.writeData(deviceId, data);
    });

  }

  onStateChange = (state: string) => {
    console.log('stateChange called. state=', state);
    this.nobleState = state;
  }

  onNobleDiscover = (peripheral: noble.Peripheral) => {
    console.log('onNobleDiscover called. peripheral=', peripheral);

    // Check if we already have this device (avoid duplicates)
    const existingDevice = this.discoveredDevices.find(p => p.id === peripheral.id);
    if (existingDevice) {
      return;
    }

    if (!peripheral.connectable) {
      return;
    }

    // If we get here, we have a valid device we want to present to the user
    this.discoveredDevices.push(peripheral);
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
    noble.startScanning([], false, this.onScanningError);

    // Setup timer to stop scanning after 5 seconds
    console.log('Setting up scanning timer...');
    this.scanningTimer = setTimeout(() => {
      console.log('Stopping scan after 5 seconds.');
      noble.stopScanning();
    }, SCAN_DURATION_MS);
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

  async connectToDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the device in discovered peripherals
      const peripheral = this.discoveredDevices.find(p => p.id === deviceId);
      if (!peripheral) {
        return { success: false, error: 'Device not found in discovered peripherals' };
      }

      // Connect to the peripheral
      await new Promise<void>((resolve, reject) => {
        peripheral.connect((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      console.log(`Connected to Bluetooth device: ${deviceId}`);

      // Discover services and characteristics
      const { services, characteristics } = await new Promise<{
        services: import('@abandonware/noble').Service[];
        characteristics: import('@abandonware/noble').Characteristic[];
      }>((resolve, reject) => {
        peripheral.discoverAllServicesAndCharacteristics((error, services, characteristics) => {
          if (error) {
            reject(error);
          } else {
            resolve({ services: services || [], characteristics: characteristics || [] });
          }
        });
      });

      console.log(`Discovered ${services.length} services and ${characteristics.length} characteristics`);

      // Find suitable characteristics for reading and writing
      // Look for characteristics with notify/read properties for RX
      // Look for characteristics with write properties for TX
      let readCharacteristic: import('@abandonware/noble').Characteristic | null = null;
      let writeCharacteristic: import('@abandonware/noble').Characteristic | null = null;

      for (const char of characteristics) {
        if (char.properties.includes('notify') || char.properties.includes('read')) {
          readCharacteristic = char;
        }
        if (char.properties.includes('write') || char.properties.includes('writeWithoutResponse')) {
          writeCharacteristic = char;
        }
      }

      if (!readCharacteristic && !writeCharacteristic) {
        peripheral.disconnect();
        return { success: false, error: 'No suitable characteristics found for communication' };
      }

      // Set up data batching for this device
      this.dataBatches.set(deviceId, []);

      // Subscribe to notifications if available
      if (readCharacteristic && readCharacteristic.properties.includes('notify')) {
        await new Promise<void>((resolve, reject) => {
          readCharacteristic!.subscribe((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });

        readCharacteristic.on('data', (data: Buffer) => {
          console.log(`Received data from ${deviceId}:`, data);

          const batch = this.dataBatches.get(deviceId);
          if (batch) {
            const isFirstChar = batch.length === 0;
            batch.push(data);

            if (isFirstChar) {
              const timeout = setTimeout(() => {
                this.sendBatchedData(deviceId);
                this.batchTimeouts.delete(deviceId);
              }, this.RX_DATA_BATCH_TIMEOUT_MS);
              this.batchTimeouts.set(deviceId, timeout);
            }
          }
        });
      }

      // Handle disconnection
      peripheral.on('disconnect', () => {
        console.log(`Bluetooth device disconnected: ${deviceId}`);
        this.connectedPeripherals.delete(deviceId);

        // Clean up batching
        const timeout = this.batchTimeouts.get(deviceId);
        if (timeout) {
          clearTimeout(timeout);
          this.batchTimeouts.delete(deviceId);
        }
        this.sendBatchedData(deviceId); // Send any remaining data
        this.dataBatches.delete(deviceId);

        this.mainWindow?.webContents.send('bluetooth:device-disconnected', deviceId);
      });

      // Store the connection
      this.connectedPeripherals.set(deviceId, {
        peripheral,
        readCharacteristic,
        writeCharacteristic
      });

      return { success: true };
    } catch (error) {
      console.error(`Failed to connect to Bluetooth device ${deviceId}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  async disconnectFromDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const connection = this.connectedPeripherals.get(deviceId);
      if (!connection) {
        return { success: false, error: 'Device not connected' };
      }

      await new Promise<void>((resolve, reject) => {
        connection.peripheral.disconnect((error?: Error) => {
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

  async writeData(deviceId: string, data: number[]): Promise<{ success: boolean; error?: string }> {
    try {
      const connection = this.connectedPeripherals.get(deviceId);
      if (!connection) {
        return { success: false, error: 'Device not connected' };
      }

      if (!connection.writeCharacteristic) {
        return { success: false, error: 'No write characteristic available' };
      }

      const buffer = Buffer.from(data);

      await new Promise<void>((resolve, reject) => {
        connection.writeCharacteristic!.write(buffer, false, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      return { success: true };
    } catch (error) {
      console.error(`Failed to write data to Bluetooth device ${deviceId}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

}
