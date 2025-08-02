import { expect, test } from '@playwright/test';

import { AppTestHarness } from './Util';

test.describe('TX data', () => {

  test('app should send basic A char', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId('tx-rx-terminal-view').click();
    await page.getByTestId('tx-rx-terminal-view').press('A');

    const utf8EncodeText = new TextEncoder();
    const expectedText = utf8EncodeText.encode('A');
    expect(appTestHarness.writtenData).toEqual(Array.from(expectedText));
  });

  test('app should send BS (0x08) when Backspace key is pressed', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId('tx-rx-terminal-view').click();
    await page.getByTestId('tx-rx-terminal-view').press('Backspace');

    const expectedData = [ 0x08 ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should send [ESC][3~ when Delete key is pressed', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId('tx-rx-terminal-view').click();
    await page.getByTestId('tx-rx-terminal-view').press('Delete');

    const expectedData = [ 0x1B, '['.charCodeAt(0), '3'.charCodeAt(0), '~'.charCodeAt(0) ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should send Horizontal Tab, HT (0x09) when Tab key is pressed', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId('tx-rx-terminal-view').click();
    await page.getByTestId('tx-rx-terminal-view').press('Tab');

    const expectedData = [ 0x09 ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should send 0x01 when Ctrl-A is pressed', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId('tx-rx-terminal-view').click();
    await page.getByTestId('tx-rx-terminal-view').press('Control+A');

    const expectedData = [ 0x01 ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should not send anything when Ctrl-0 is pressed', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId('tx-rx-terminal-view').click();
    await page.getByTestId('tx-rx-terminal-view').press('Control+0');

    const expectedData = [];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should send [ESC]-A when Alt-A is pressed', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId('tx-rx-terminal-view').click();
    await page.getByTestId('tx-rx-terminal-view').press('Alt+A');

    const expectedData = [ 0x1B, 0x41 ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });

  test('app should send [ESC]-a when Alt-a is pressed', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId('tx-rx-terminal-view').click();
    await page.getByTestId('tx-rx-terminal-view').press('Alt+a');

    const expectedData = [ 0x1B, 0x61 ];
    expect(appTestHarness.writtenData).toEqual(expectedData);
  });
});
