import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  // Launch Electron app
  electronApp = await electron.launch({ 
    args: ['.'] 
  });
  
  // Get the first window that the app opens
  window = await electronApp.firstWindow();
  
  // Wait for the app to be ready
  await window.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await electronApp.close();
});

test('should have electron APIs available', async () => {
  // Check that the electron APIs are exposed
  const hasElectronAPI = await window.evaluate(() => {
    return typeof (window as any).electronAPI !== 'undefined';
  });
  
  expect(hasElectronAPI).toBe(true);
});

test('should be able to list serial ports', async () => {
  // Test that we can call the serial port list function
  const result = await window.evaluate(async () => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI) return { success: false, error: 'No electron API' };
    
    try {
      return await electronAPI.serial.listPorts();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  expect(result.success).toBe(true);
  expect(Array.isArray(result.ports)).toBe(true);
});

test('should be able to select directory for file operations', async () => {
  // Note: This test will require user interaction to select a directory
  // In a real test environment, you might want to mock this
  const result = await window.evaluate(async () => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI) return { success: false, error: 'No electron API' };
    
    // For testing purposes, we'll just verify the function exists
    return { success: typeof electronAPI.fs.selectDirectory === 'function' };
  });
  
  expect(result.success).toBe(true);
});

test('should initialize serial adapter correctly', async () => {
  // Check that navigator.serial has been replaced with our Electron implementation
  const hasSerialAPI = await window.evaluate(() => {
    return typeof (navigator as any).serial !== 'undefined';
  });
  
  expect(hasSerialAPI).toBe(true);
  
  // Check that it has the expected methods
  const hasRequiredMethods = await window.evaluate(() => {
    const serial = (navigator as any).serial;
    return (
      typeof serial.getPorts === 'function' &&
      typeof serial.requestPort === 'function' &&
      typeof serial.addEventListener === 'function'
    );
  });
  
  expect(hasRequiredMethods).toBe(true);
});

test('should have file system API replacement', async () => {
  // Check that the showDirectoryPicker function is available
  const hasDirectoryPicker = await window.evaluate(() => {
    return typeof (window as any).showDirectoryPicker === 'function';
  });
  
  expect(hasDirectoryPicker).toBe(true);
});