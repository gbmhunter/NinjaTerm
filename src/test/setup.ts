import { expect, afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Electron APIs
beforeEach(() => {
  // Mock window.electronAPI
  Object.defineProperty(window, 'electronAPI', {
    value: {
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