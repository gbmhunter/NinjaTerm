/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from '@playwright/test';

import { ElectronAppTestHarness } from './ElectronUtil';
import { PortState } from '../src/renderer/src/model/Settings/PortSettings/PortSettings';
import './types';

let appTestHarness: ElectronAppTestHarness;

test.beforeEach(async () => {
  appTestHarness = new ElectronAppTestHarness();
  await appTestHarness.setupElectronApp();
});

test.afterEach(async () => {
  await appTestHarness.closeElectronApp();
});

test.describe('IPC Mocking (Electron)', () => {

  test('should mock serial port listing', async () => {
    // The app should automatically get our mocked port list
    await appTestHarness.page.waitForSelector('[data-testid="settings-button"]', { timeout: 5000 });

    // Trigger port scanning
    const ports = await appTestHarness.page.evaluate(async () => {
      const app = window.app;
      await app.settings.portConfiguration.scanForSerialPorts();
      return app.settings.portConfiguration.availableSerialPorts;
    });

    expect(ports).toHaveLength(1);
    expect(ports[0].path).toBe('/dev/ttyTEST');
    expect(ports[0].manufacturer).toBe('Test Manufacturer');
  });

  test('should mock port opening and closing', async () => {
    await appTestHarness.openPortAndGoToTerminalView();

    // Check that the port appears to be opened
    const portState = await appTestHarness.page.evaluate(() => {
      const app = window.app;
      return {
        portState: app.serialController.portState,
        currentPortPath: app.serialController.currentPortPath
      };
    });

    expect(portState.portState).toBe(PortState.OPENED);
    expect(portState.currentPortPath).toBe('/dev/ttyTEST');
  });

  test('should capture written data through mocked IPC', async () => {
    await appTestHarness.openPortAndGoToTerminalView();

    // Clear any previous data
    appTestHarness.writtenData = [];

    // Type some text (this should trigger writeData through IPC)
    await appTestHarness.page.click('#tx-rx-terminal');
    await appTestHarness.page.keyboard.type('test data');
    await appTestHarness.page.keyboard.press('Enter');

    // Wait for the data to be captured
    await appTestHarness.page.waitForTimeout(500);

    // Retrieve captured data from the main process
    await appTestHarness.updateWrittenDataFromMainProcess();

    // Check that our mocked writeData captured the data
    // Note: The application seems to convert Enter key to just \n instead of \r\n
    const expectedBytes = Array.from(new TextEncoder().encode('test data\n'));
    expect(appTestHarness.writtenData).toEqual(expectedBytes);
  });

  // test('should simulate serial port errors via mocked IPC', async () => {
  //   await appTestHarness.openPortAndGoToTerminalView();

  //   // Simulate an error
  //   await appTestHarness.simulateSerialError('/dev/ttyTEST', 'Test error message');

  //   // Wait for the error to be processed
  //   await appTestHarness.page.waitForTimeout(500);

  //   // Check if the error was handled (this depends on how the app handles errors)
  //   const snackbarVisible = await appTestHarness.page.locator('.SnackbarContent-root').isVisible().catch(() => false);

  //   // The app should show some indication of the error
  //   expect(snackbarVisible).toBe(true);
  // });

});
