/* eslint-disable testing-library/prefer-screen-queries */
import { test } from '@playwright/test';

import { ExpectedTerminalChar } from './Util';
import { ElectronAppTestHarness } from './ElectronUtil';

let appTestHarness: ElectronAppTestHarness;

test.beforeAll(async () => {
  appTestHarness = new ElectronAppTestHarness();
  await appTestHarness.setupElectronApp();
});

test.afterAll(async () => {
  await appTestHarness.closeElectronApp();
});

test.describe('RX data (Electron)', () => {

  test('hello, world!', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('Hello, world!\n');

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'H' }),
        new ExpectedTerminalChar({ char: 'e' }),
        new ExpectedTerminalChar({ char: 'l' }),
        new ExpectedTerminalChar({ char: 'l' }),
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: ',' }),
        new ExpectedTerminalChar({ char: ' ' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'r' }),
        new ExpectedTerminalChar({ char: 'l' }),
        new ExpectedTerminalChar({ char: 'd' }),
        new ExpectedTerminalChar({ char: '!' }),
      ],
      // Because of new line char in input, we expect the cursor now to be on the next line
      [new ExpectedTerminalChar({ char: ' ' })],
    ];

    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('should render red text', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('\x1B[31mred');

    // Check that all data is displayed correctly in terminal
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(170, 0, 0)'} }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(170, 0, 0)'} }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(170, 0, 0)'} }),
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('should render bright red text using number 91', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('\x1B[91mred');

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(255, 85, 85)'} }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(255, 85, 85)'} }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(255, 85, 85)'} }),
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('ESC[m should reset CSI styles', async () => {
    const TX_COLOR = 'rgb(0, 255, 0)'; // green
    const RX_COLOR = 'rgb(255, 255, 0)'; // yellow

    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.page.evaluate(({TX_COLOR, RX_COLOR}) => {
      const app = (window as any).app;
      app.settings.displaySettings.defaultTxTextColor.setDispValue(TX_COLOR);
      app.settings.displaySettings.defaultTxTextColor.apply();
      app.settings.displaySettings.defaultRxTextColor.setDispValue(RX_COLOR);
      app.settings.displaySettings.defaultRxTextColor.apply();
    }, {TX_COLOR, RX_COLOR});
    await appTestHarness.sendTextToTerminal('\x1B[31mred\x1B[mreset');

    // Check that all data is displayed correctly in terminal
    // After "red", the word "reset" should be back to the default
    // color set in the display settings
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'r' , style: { color: RX_COLOR } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: RX_COLOR } }),
        new ExpectedTerminalChar({ char: 's' , style: { color: RX_COLOR } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: RX_COLOR } }),
        new ExpectedTerminalChar({ char: 't' , style: { color: RX_COLOR } }),
        new ExpectedTerminalChar({ char: ' ' , style: { color: RX_COLOR } }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('ESC[1A should go up 1 row', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('up\n\x1B[1A');

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'u', classNames: 'cursorUnfocused' }), 
        new ExpectedTerminalChar({ char: 'p' }),
      ],
      [
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('changing num chars per row', async () => {
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToDisplaySettings();

    await appTestHarness.page.locator("[name='terminalWidthChars']").fill("10")
    // Press enter to "apply" change
    await appTestHarness.page.keyboard.press('Enter');

    // Go back to terminal view
    await appTestHarness.page.getByTestId('show-terminal-button').click();

    // We set the width to 10 chars, so let's send 20 chars and expect 2 rows
    await appTestHarness.sendTextToTerminal('01234567890123456789');

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: '2' }),
        new ExpectedTerminalChar({ char: '3' }),
        new ExpectedTerminalChar({ char: '4' }),
        new ExpectedTerminalChar({ char: '5' }),
        new ExpectedTerminalChar({ char: '6' }),
        new ExpectedTerminalChar({ char: '7' }),
        new ExpectedTerminalChar({ char: '8' }),
        new ExpectedTerminalChar({ char: '9' }),
      ],
      [
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: '2' }),
        new ExpectedTerminalChar({ char: '3' }),
        new ExpectedTerminalChar({ char: '4' }),
        new ExpectedTerminalChar({ char: '5' }),
        new ExpectedTerminalChar({ char: '6' }),
        new ExpectedTerminalChar({ char: '7' }),
        new ExpectedTerminalChar({ char: '8' }),
        new ExpectedTerminalChar({ char: '9' }),
      ],
      [
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

});