import { expect, test } from '@playwright/test';

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

test.describe('sessions (Electron)', () => {
  test('a new session gets its own tab and settings, and closing it returns to the first', async () => {
    const page = appTestHarness.page;
    const tabs = page.getByTestId('session-tabs').locator('[role="tab"]');

    await expect(tabs).toHaveCount(1);
    const firstId = await page.evaluate(() => window.app.activeSession.id);

    await page.getByTestId('new-session-button').click();
    await expect(tabs).toHaveCount(2);

    // The new session is active and the settings pane says so.
    const secondId = await page.evaluate(() => window.app.activeSession.id);
    expect(secondId).not.toBe(firstId);
    await page.getByTestId('settings-button').click();
    await expect(page.getByTestId('settings-session-name')).toContainText('Session 2');

    // A setting changed here is this session's alone.
    await page.evaluate(() => {
      window.app.settings.portConfiguration.baudRate.setDispValue('9600');
      window.app.settings.portConfiguration.baudRate.apply();
    });
    const baudRates = await page.evaluate(() => window.app.sessions.map((s) => s.settings.portConfiguration.baudRate.appliedValue));
    expect(baudRates[1]).toBe(9600);
    expect(baudRates[0]).not.toBe(9600);

    // Clicking the first tab switches back, and the settings pane follows.
    await page.getByTestId(`session-tab-${firstId}`).click();
    await expect(page.getByTestId('settings-session-name')).toContainText('Session 1');
    expect(await page.evaluate(() => window.app.activeSession.id)).toBe(firstId);

    // Close the second session from its tab.
    await page.getByTestId(`session-tab-close-${secondId}`).click();
    await expect(tabs).toHaveCount(1);
    expect(await page.evaluate(() => window.app.sessions.length)).toBe(1);
    expect(await page.evaluate(() => window.app.activeSession.id)).toBe(firstId);
  });

  test('received data lands in the session that owns the connection', async () => {
    const page = appTestHarness.page;

    // Open the fake port on session 1, then open a second session and leave it active.
    await appTestHarness.openPortAndGoToTerminalView();
    const firstId = await page.evaluate(() => window.app.activeSession.id);
    await page.getByTestId('new-session-button').click();
    await page.getByTestId('show-terminal-button').click();

    // Feed bytes to session 1 directly, as its connection would.
    await page.evaluate((id) => {
      const session = window.app.sessions.find((s) => s.id === id)!;
      session.parseRxData(new TextEncoder().encode('from session one\n'));
    }, firstId);

    // The active (second) session's terminal shows nothing...
    await expect(page.getByTestId('tx-rx-terminal-view')).not.toContainText('from session one');

    // ...and switching to the first shows the data.
    await page.getByTestId(`session-tab-${firstId}`).click();
    await expect(page.getByTestId('tx-rx-terminal-view')).toContainText('from session one');
  });
});
