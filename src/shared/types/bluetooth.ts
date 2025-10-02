/**
 * Shared types for Bluetooth functionality between main and renderer processes
 */

import noble from '@abandonware/noble';

export interface BluetoothDeviceAdvertisement {
  /**
   * This can be '' if not known.
   */
  localName: string;
  manufacturerData: Buffer;
  serviceData: Array<{ uuid: string; data: Buffer }>;
  serviceUuids: string[];
  txPowerLevel: number;
}

export interface SerializableBluetoothDevice {
  id: string;
  uuid: string;
  address: string;
  addressType: string;
  connectable: boolean;
  /**
   * The noble advertisement object is directly serializable, no need to copy its internal fields individually.
   */
  advertisement: noble.Advertisement;
  rssi: number;
  state: string;
}

export interface BluetoothDeviceResponse {
  success: boolean;
  devices?: SerializableBluetoothDevice[];
  error?: string;
}

export interface PeripheralServicesAndCharacteristics {
  services: noble.Service[];
}

export interface SerializableService {
  uuid: string;
  name?: string;
  type?: string;
  characteristics: SerializableCharacteristic[];
}

export interface SerializableCharacteristic {
  uuid: string;
  name?: string;
  properties: string[];
  descriptors?: SerializableDescriptor[];
}

export interface SerializableDescriptor {
  uuid: string;
  name?: string;
}

export interface BluetoothServicesMessage {
  deviceId: string;
  services: SerializableService[];
}
