/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';

import { ElectronAppTestHarness } from './ElectronUtil';
import './types';

let appTestHarness: ElectronAppTestHarness;

test.beforeEach(async () => {
  appTestHarness = new ElectronAppTestHarness();
  await appTestHarness.setupElectronApp();
});

test.afterEach(async () => {
  await appTestHarness.closeElectronApp();
});

test.describe('TX data (Electron)', () => {

  test('app should send basic A char', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    
    // Clear any previous data
    appTestHarness.writtenData = [];

    await appTestHarness.page.click('#tx-rx-terminal');
    await appTestHarness.page.keyboard.press('A');

    // Wait for data to be captured and retrieve it
    await appTestHarness.page.waitForTimeout(100);
    await appTestHarness.updateWrittenDataFromMainProcess();

    const utf8EncodeText = new TextEncoder();
    const expectedText = utf8EncodeText.encode('A');
    expect(appTestHarness.writtenData).toEqual(Array.from(expectedText));
  });

  test('app should send BS (0x08) when Backspace key is pressed', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    
    // Clear any previous data
    appTestHarness.writtenData = [];

    await appTestHarness.page.click('#tx-rx-terminal');
    await appTestHarness.page.keyboard.press('Backspace');

    // Wait for data to be captured and retrieve it
    await appTestHarness.page.waitForTimeout(100);
    await appTestHarness.updateWrittenDataFromMainProcess();

    const expectedData = [ 0x08 ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should send [ESC][3~ when Delete key is pressed', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    
    // Clear any previous data
    appTestHarness.writtenData = [];

    await appTestHarness.page.click('#tx-rx-terminal');
    await appTestHarness.page.keyboard.press('Delete');

    // Wait for data to be captured and retrieve it
    await appTestHarness.page.waitForTimeout(100);
    await appTestHarness.updateWrittenDataFromMainProcess();

    const expectedData = [ 0x1B, '['.charCodeAt(0), '3'.charCodeAt(0), '~'.charCodeAt(0) ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should send Horizontal Tab, HT (0x09) when Tab key is pressed', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    
    // Clear any previous data
    appTestHarness.writtenData = [];

    await appTestHarness.page.click('#tx-rx-terminal');
    await appTestHarness.page.keyboard.press('Tab');

    // Wait for data to be captured and retrieve it
    await appTestHarness.page.waitForTimeout(100);
    await appTestHarness.updateWrittenDataFromMainProcess();

    const expectedData = [ 0x09 ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should send 0x01 when Ctrl-A is pressed', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    
    // Clear any previous data
    appTestHarness.writtenData = [];

    await appTestHarness.page.click('#tx-rx-terminal');
    await appTestHarness.page.keyboard.press('Control+A');

    // Wait for data to be captured and retrieve it
    await appTestHarness.page.waitForTimeout(100);
    await appTestHarness.updateWrittenDataFromMainProcess();

    const expectedData = [ 0x01 ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should not send anything when Ctrl-0 is pressed', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    
    // Clear any previous data
    appTestHarness.writtenData = [];

    await appTestHarness.page.click('#tx-rx-terminal');
    await appTestHarness.page.keyboard.press('Control+0');

    // Wait for data to be captured and retrieve it
    await appTestHarness.page.waitForTimeout(100);
    await appTestHarness.updateWrittenDataFromMainProcess();

    const expectedData = [];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should send [ESC]-A when Alt-A is pressed', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    
    // Clear any previous data
    appTestHarness.writtenData = [];

    await appTestHarness.page.click('#tx-rx-terminal');
    await appTestHarness.page.keyboard.press('Alt+A');

    // Wait for data to be captured and retrieve it
    await appTestHarness.page.waitForTimeout(100);
    await appTestHarness.updateWrittenDataFromMainProcess();

    const expectedData = [ 0x1B, 0x41 ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should send [ESC]-a when Alt-a is pressed', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    
    // Clear any previous data
    appTestHarness.writtenData = [];

    await appTestHarness.page.click('#tx-rx-terminal');
    await appTestHarness.page.keyboard.press('Alt+a');

    // Wait for data to be captured and retrieve it
    await appTestHarness.page.waitForTimeout(100);
    await appTestHarness.updateWrittenDataFromMainProcess();

    const expectedData = [ 0x1B, 0x61 ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

});