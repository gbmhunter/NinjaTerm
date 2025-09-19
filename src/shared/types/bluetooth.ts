/**
 * Shared types for Bluetooth functionality between main and renderer processes
 */

export interface BluetoothDeviceAdvertisement {
  localName?: string;
  serviceUuids?: string[];
  manufacturerData?: Buffer;
  serviceData?: Array<{ uuid: string; data: Buffer }>;
  txPowerLevel?: number;
}

export interface SerializableBluetoothDevice {
  id: string;
  uuid: string;
  address: string;
  addressType: string;
  connectable: boolean;
  advertisement: BluetoothDeviceAdvertisement;
  rssi: number;
  state: string;
}

export interface BluetoothDeviceResponse {
  success: boolean;
  devices?: SerializableBluetoothDevice[];
  error?: string;
}
