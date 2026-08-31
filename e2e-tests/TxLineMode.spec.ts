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

/** Switches TX mode to Line and returns to the terminal view. */
const enableLineMode = async () => {
  await appTestHarness.goToTxSettings();
  await appTestHarness.page.click('[data-testid="tx-mode-line"] input');
  await appTestHarness.page.waitForTimeout(200);
  await appTestHarness.goToTerminalView();
  await appTestHarness.page.waitForTimeout(200);
};

const bytesOf = (s: string) => Array.from(new TextEncoder().encode(s));

test.describe('TX line mode (Electron)', () => {

  test('character mode sends one write per keystroke', async () => {
    // The behaviour line mode exists to avoid. Pinned so a future change to
    // the typing path can't silently start batching (or further splitting).
    await appTestHarness.openPortAndGoToTerminalView();
    appTestHarness.clearWrittenData();

    await appTestHarness.page.click('#tx-rx-terminal');
    await appTestHarness.page.keyboard.type('abc');

    await appTestHarness.page.waitForTimeout(200);
    await appTestHarness.updateWrittenDataFromMainProcess();

    expect(appTestHarness.writeChunks).toEqual([[0x61], [0x62], [0x63]]);
  });

  test('line mode sends the whole line as a single write', async () => {
    // This is issue #410: `*IDN?\n` typed in character mode leaves as six
    // separate writes -- and so six TCP segments -- which SCPI instruments
    // that parse one datagram per command ignore.
    await appTestHarness.openPortAndGoToTerminalView();
    await enableLineMode();
    appTestHarness.clearWrittenData();

    await appTestHarness.page.fill('[data-testid="tx-line-bar-input"]', '*IDN?');
    await appTestHarness.page.waitForTimeout(100);
    await appTestHarness.updateWrittenDataFromMainProcess();
    // Typing into the bar must not put anything on the wire.
    expect(appTestHarness.writeChunks).toEqual([]);

    await appTestHarness.page.keyboard.press('Enter');
    await appTestHarness.page.waitForTimeout(200);
    await appTestHarness.updateWrittenDataFromMainProcess();

    expect(appTestHarness.writeChunks).toEqual([bytesOf('*IDN?\n')]);
  });

  test('line mode clears the input after sending', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await enableLineMode();

    await appTestHarness.page.fill('[data-testid="tx-line-bar-input"]', '*IDN?');
    await appTestHarness.page.keyboard.press('Enter');
    await appTestHarness.page.waitForTimeout(200);

    await expect(appTestHarness.page.locator('[data-testid="tx-line-bar-input"]')).toHaveValue('');
  });

  test('the send button sends the same single write as Enter', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await enableLineMode();
    appTestHarness.clearWrittenData();

    await appTestHarness.page.fill('[data-testid="tx-line-bar-input"]', 'MEAS?');
    await appTestHarness.page.click('[data-testid="tx-line-bar-send-button"]');
    await appTestHarness.page.waitForTimeout(200);
    await appTestHarness.updateWrittenDataFromMainProcess();

    expect(appTestHarness.writeChunks).toEqual([bytesOf('MEAS?\n')]);
  });

  test('Up recalls the previously sent line', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await enableLineMode();

    const input = appTestHarness.page.locator('[data-testid="tx-line-bar-input"]');
    await input.fill('*IDN?');
    await appTestHarness.page.keyboard.press('Enter');
    await appTestHarness.page.waitForTimeout(200);

    await input.focus();
    await appTestHarness.page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('*IDN?');
  });

  test('Escape clears the line without sending it', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await enableLineMode();
    appTestHarness.clearWrittenData();

    const input = appTestHarness.page.locator('[data-testid="tx-line-bar-input"]');
    await input.fill('do not send');
    await appTestHarness.page.keyboard.press('Escape');
    await appTestHarness.page.waitForTimeout(200);
    await appTestHarness.updateWrittenDataFromMainProcess();

    await expect(input).toHaveValue('');
    expect(appTestHarness.writeChunks).toEqual([]);
  });

  test('the line bar is only shown in line mode', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await expect(appTestHarness.page.locator('[data-testid="tx-line-bar"]')).toHaveCount(0);

    await enableLineMode();
    await expect(appTestHarness.page.locator('[data-testid="tx-line-bar"]')).toHaveCount(1);
  });

  test('switching back to character mode leaves typing working', async () => {
    // The line bar unmounting drops focus to document.body, outside
    // #outer-border, which would silently stop the terminal receiving keys.
    await appTestHarness.openPortAndGoToTerminalView();
    await enableLineMode();

    await appTestHarness.goToTxSettings();
    await appTestHarness.page.click('[data-testid="tx-mode-character"] input');
    await appTestHarness.page.waitForTimeout(200);
    await appTestHarness.goToTerminalView();
    await appTestHarness.page.waitForTimeout(200);

    appTestHarness.clearWrittenData();
    await appTestHarness.page.keyboard.press('A');
    await appTestHarness.page.waitForTimeout(200);
    await appTestHarness.updateWrittenDataFromMainProcess();

    expect(appTestHarness.writtenData).toEqual(bytesOf('A'));
  });
});
