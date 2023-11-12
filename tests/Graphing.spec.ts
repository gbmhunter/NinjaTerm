/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from '@playwright/test';

import { ExpectedTerminalChar, AppTestHarness } from './Util';

test.describe('Graphing', () => {

  test('should graph basic data point', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.enableGraphing();

    await appTestHarness.sendTextToTerminal('y=1\n');
    const graphData = await page.evaluate(() => {
      return window.app.graphing.graphData;
    });
    expect(graphData.length).toBe(1);
    expect(graphData[0].y).toBe(1);
  });

  test('should extract data with preamble', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.enableGraphing();

    await appTestHarness.sendTextToTerminal('TEXT BEFORE VALUE y=5\n');
    const graphData = await page.evaluate(() => {
      return window.app.graphing.graphData;
    });
    expect(graphData.length).toBe(1);
    expect(graphData[0].y).toBe(5);
  });

  test('should extract data with postamble', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.enableGraphing();

    await appTestHarness.sendTextToTerminal('y=5 TEXT AFTER VALUE\n');
    const graphData = await page.evaluate(() => {
      return window.app.graphing.graphData;
    });
    expect(graphData.length).toBe(1);
    expect(graphData[0].y).toBe(5);
  });

  test('should extract data with pre and postamble', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.enableGraphing();

    await appTestHarness.sendTextToTerminal('TEXT BEFORE VALUE y=5 TEXT AFTER VALUE\n');
    const graphData = await page.evaluate(() => {
      return window.app.graphing.graphData;
    });
    expect(graphData.length).toBe(1);
    expect(graphData[0].y).toBe(5);
  });

  test('should limit max. num of data points', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.enableGraphing();

    await page.getByLabel('Max. Num. Data Points').fill('2');
    // Press enter to "apply" change
    await page.getByLabel('Max. Num. Data Points').press('Enter');

    // Send 3 data points
    await appTestHarness.sendTextToTerminal('y=5\ny=6\ny=7\n');

    const graphData = await page.evaluate(() => {
      return window.app.graphing.graphData;
    });
    expect(graphData.length).toBe(2);
    expect(graphData[0].y).toBe(6);
    expect(graphData[1].y).toBe(7);
  });

  test('should extract both x and y values', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.enableGraphing();

    await page.getByTestId('xVarSource').click();
    await page.click('li[data-value="In Data"]');

    await appTestHarness.sendTextToTerminal('x=2,y=3\n');

    const graphData = await page.evaluate(() => {
      return window.app.graphing.graphData;
    });
    expect(graphData.length).toBe(1);
    expect(graphData[0].x).toBe(2);
    expect(graphData[0].y).toBe(3);
  });

});
