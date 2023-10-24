/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from '@playwright/test';

import { ExpectedTerminalChar, AppTestHarness } from './Util';

test.describe('TX data', () => {

  test('app should send basic A char', async ({ page }) => {

    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    // fireEvent.keyDown(terminal, {key: 'A', code: 'KeyA'});
    await page.getByTestId("tx-rx-terminal-view").focus();
    await page.getByTestId("tx-rx-terminal-view").click();
    await page.getByTestId("tx-rx-terminal-view").press("A");

    const utf8EncodeText = new TextEncoder();
    const expectedText = utf8EncodeText.encode('A');
    console.log(appTestHarness.writtenData);
    expect(appTestHarness.writtenData).toEqual(Array.from(expectedText));
  });

});
