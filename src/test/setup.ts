import { expect, afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock electron-log. This hang the tests if not mocked, as it is looking for the logger running in the main process.
// It gives the error:
// stderr | Timeout._onTimeout (C:\personal\NinjaTerm\node_modules\electron-log\src\renderer\lib\transports\console.js:28:24)
// 16:00:11.762 › electron-log: logger isn't initialized in the main process
vi.mock('electron-log', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    verbose: vi.fn(),
    debug: vi.fn(),
    silly: vi.fn(),
    log: vi.fn(),
  },
}))

vi.mock('electron-log/renderer', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    verbose: vi.fn(),
    debug: vi.fn(),
    silly: vi.fn(),
    log: vi.fn(),
  },
}))

// Mock Electron APIs
beforeEach(() => {
  // Mock window.electronAPI
  Object.defineProperty(window, 'electronAPI', {
    value: {
      general: {
        removeAllListeners: vi.fn(),
      },
      serial: {
        listPorts: vi.fn().mockResolvedValue({ success: true, ports: [] }),
        openPort: vi.fn().mockResolvedValue({ success: true }),
        closePort: vi.fn().mockResolvedValue({ success: true }),
        writeData: vi.fn().mockResolvedValue({ success: true }),
        onDataReceived: vi.fn(),
        onError: vi.fn(),
        onPortClosed: vi.fn(),
        removeAllListeners: vi.fn(),
        closeAllPortsAndRemoveListeners: vi.fn(),
      },
      fs: {
        selectDirectory: vi.fn().mockResolvedValue({ success: true, path: '/mock/path', canceled: false }),
        writeFile: vi.fn().mockResolvedValue({ success: true }),
        getFileSize: vi.fn().mockResolvedValue({ success: true, size: 0 }),
        fileExists: vi.fn().mockResolvedValue({ success: true, exists: true }),
        getDefaultLogDirectory: vi.fn().mockResolvedValue({ success: true, path: '/mock/home/NinjaTerm/logs' }),
      },
      socket: {
        connect: vi.fn().mockResolvedValue({ success: true, connectionId: 'mock-connection-id' }),
        disconnect: vi.fn().mockResolvedValue({ success: true }),
        writeData: vi.fn().mockResolvedValue({ success: true }),
        onDataReceived: vi.fn(),
        onError: vi.fn(),
        onClosed: vi.fn(),
        removeAllListeners: vi.fn(),
        disconnectAllSocketsAndRemoveListeners: vi.fn(),
      },
      bluetooth: {
        resetBluetoothState: vi.fn().mockResolvedValue({ success: true }),
        startPeripheralScan: vi.fn().mockResolvedValue({ success: true }),
        stopPeripheralScan: vi.fn().mockResolvedValue({ success: true }),
        connectDevice: vi.fn().mockResolvedValue({ success: true }),
        disconnectDevice: vi.fn().mockResolvedValue({ success: true }),
        writeData: vi.fn().mockResolvedValue({ success: true }),
        onDeviceDiscovered: vi.fn(),
        onDataReceived: vi.fn(),
        onDeviceDisconnected: vi.fn(),
        onDeviceServicesDiscovered: vi.fn(),
        removeAllListeners: vi.fn(),
        onConnectionAttemptComplete: vi.fn(),
      }
    },
    writable: true,
    configurable: true
  })
})

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})
