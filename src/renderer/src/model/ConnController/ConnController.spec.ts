import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortInfo } from '@serialport/bindings-interface';
import { ConnController, PortType } from './ConnController';
import { App } from '../App';

describe('SerialController', () => {
  describe('sortSerialPortsNaturally', () => {
    it('should sort Windows COM ports numerically', () => {
      const unsortedPorts: PortInfo[] = [
        { path: 'COM16', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: 'COM2', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: 'COM10', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: 'COM1', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: 'COM6', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: 'COM7', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
      ];

      const sortedPorts = ConnController.sortSerialPortsNaturally(unsortedPorts);
      const sortedPaths = sortedPorts.map(port => port.path);

      expect(sortedPaths).toEqual(['COM1', 'COM2', 'COM6', 'COM7', 'COM10', 'COM16']);
    });

    it('should sort Linux ttyUSB ports numerically', () => {
      const unsortedPorts: PortInfo[] = [
        { path: '/dev/ttyUSB10', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/ttyUSB0', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/ttyUSB2', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/ttyUSB1', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
      ];

      const sortedPorts = ConnController.sortSerialPortsNaturally(unsortedPorts);
      const sortedPaths = sortedPorts.map(port => port.path);

      expect(sortedPaths).toEqual(['/dev/ttyUSB0', '/dev/ttyUSB1', '/dev/ttyUSB2', '/dev/ttyUSB10']);
    });

    it('should sort Linux tty ports numerically', () => {
      const unsortedPorts: PortInfo[] = [
        { path: '/dev/tty12', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/tty1', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/tty2', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
      ];

      const sortedPorts = ConnController.sortSerialPortsNaturally(unsortedPorts);
      const sortedPaths = sortedPorts.map(port => port.path);

      expect(sortedPaths).toEqual(['/dev/tty1', '/dev/tty2', '/dev/tty12']);
    });

    it('should sort macOS cu.usbserial ports numerically', () => {
      const unsortedPorts: PortInfo[] = [
        { path: '/dev/cu.usbserial-10', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/cu.usbserial-1', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/cu.usbserial-2', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
      ];

      const sortedPorts = ConnController.sortSerialPortsNaturally(unsortedPorts);
      const sortedPaths = sortedPorts.map(port => port.path);

      expect(sortedPaths).toEqual(['/dev/cu.usbserial-1', '/dev/cu.usbserial-2', '/dev/cu.usbserial-10']);
    });

    it('should handle mixed port types by grouping by prefix first', () => {
      const unsortedPorts: PortInfo[] = [
        { path: '/dev/ttyUSB10', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/tty2', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/ttyUSB1', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/tty12', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
      ];

      const sortedPorts = ConnController.sortSerialPortsNaturally(unsortedPorts);
      const sortedPaths = sortedPorts.map(port => port.path);

      expect(sortedPaths).toEqual(['/dev/tty2', '/dev/tty12', '/dev/ttyUSB1', '/dev/ttyUSB10']);
    });

    it('should handle ports without numeric parts alphabetically', () => {
      const unsortedPorts: PortInfo[] = [
        { path: '/dev/ttyZ', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/ttyA', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/ttyM', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
      ];

      const sortedPorts = ConnController.sortSerialPortsNaturally(unsortedPorts);
      const sortedPaths = sortedPorts.map(port => port.path);

      expect(sortedPaths).toEqual(['/dev/ttyA', '/dev/ttyM', '/dev/ttyZ']);
    });

    it('should handle mixed numeric and non-numeric ports', () => {
      const unsortedPorts: PortInfo[] = [
        { path: '/dev/tty10', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/ttyZ', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/tty2', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
        { path: '/dev/ttyA', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
      ];

      const sortedPorts = ConnController.sortSerialPortsNaturally(unsortedPorts);
      const sortedPaths = sortedPorts.map(port => port.path);

      expect(sortedPaths).toEqual(['/dev/tty2', '/dev/tty10', '/dev/ttyA', '/dev/ttyZ']);
    });

    it('should handle empty array', () => {
      const emptyPorts: PortInfo[] = [];
      const sortedPorts = ConnController.sortSerialPortsNaturally(emptyPorts);
      expect(sortedPorts).toEqual([]);
    });

    it('should handle single port', () => {
      const singlePort: PortInfo[] = [
        { path: 'COM1', manufacturer: 'test', serialNumber: 'test', pnpId: 'test', locationId: 'test', vendorId: 'test', productId: 'test' },
      ];
      const sortedPorts = ConnController.sortSerialPortsNaturally(singlePort);
      expect(sortedPorts).toHaveLength(1);
      expect(sortedPorts[0].path).toBe('COM1');
    });
  });

  describe('IPC listener disposers', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    it('cleanup() invokes every captured disposer and clears the list', () => {
      const app = new App();
      const conn: any = app.connController;

      const dispose1 = vi.fn();
      const dispose2 = vi.fn();
      conn.connDisposers.push(dispose1, dispose2);

      conn.cleanup();

      expect(dispose1).toHaveBeenCalledTimes(1);
      expect(dispose2).toHaveBeenCalledTimes(1);
      expect(conn.connDisposers).toEqual([]);
    });

    it('a throwing disposer does not block the rest', () => {
      // If a stale wrapper somehow throws on removal, the remaining listeners
      // must still be cleaned up. Otherwise one bad disposer leaks every
      // sibling listener for the rest of the session.
      const app = new App();
      const conn: any = app.connController;

      const throwingDispose = vi.fn(() => { throw new Error('boom'); });
      const goodDispose = vi.fn();
      conn.connDisposers.push(throwingDispose, goodDispose);

      conn.cleanup();

      expect(throwingDispose).toHaveBeenCalledTimes(1);
      expect(goodDispose).toHaveBeenCalledTimes(1);
      expect(conn.connDisposers).toEqual([]);
    });
  });

  describe('writeData', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    it('no-ops for fake ports instead of attempting a real serial write', async () => {
      // Fake ports have no underlying connection. writeData must succeed
      // silently so the caller can still local-echo the typed bytes — if it
      // threw "Port not found" here, local echo would never render.
      const app = new App();
      const conn: any = app.connController;
      conn.lastSelectedPortType = PortType.FAKE;

      // Spy on the serial write so we can assert it is never reached.
      const serialWrite = vi.fn();
      (window as any).electronAPI = { serial: { writeData: serialWrite } };

      await expect(conn.writeData(Uint8Array.from([0x61, 0x08]))).resolves.toBeUndefined();
      expect(serialWrite).not.toHaveBeenCalled();
    });
  });
});
