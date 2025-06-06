/* eslint-disable testing-library/prefer-screen-queries */
import { test } from '@playwright/test';

import { ExpectedTerminalChar, AppTestHarness } from './Util';

test.describe('RX data', () => {

  test('hello, world!', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
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

  test('should render red text', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
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

  test('should render bright red text using number 91', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
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

  test('ESC[m should reset CSI styles', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();

    const TX_COLOR = 'rgb(0, 255, 0)'; // green
    const RX_COLOR = 'rgb(255, 255, 0)'; // yellow

    await appTestHarness.openPortAndGoToTerminalView();
    await page.evaluate(({TX_COLOR, RX_COLOR}) => {
      window.app.settings.displaySettings.defaultTxTextColor.setDispValue(TX_COLOR);
      window.app.settings.displaySettings.defaultTxTextColor.apply();
      window.app.settings.displaySettings.defaultRxTextColor.setDispValue(RX_COLOR);
      window.app.settings.displaySettings.defaultRxTextColor.apply();
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

  test('ESC[0m should reset CSI styles', async ({ page }) => {
    const TX_COLOR = 'rgb(0, 255, 0)'; // green
    const RX_COLOR = 'rgb(255, 255, 0)'; // yellow

    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await page.evaluate(({TX_COLOR, RX_COLOR}) => {
      window.app.settings.displaySettings.defaultTxTextColor.setDispValue(TX_COLOR);
      window.app.settings.displaySettings.defaultTxTextColor.apply();
      window.app.settings.displaySettings.defaultRxTextColor.setDispValue(RX_COLOR);
      window.app.settings.displaySettings.defaultRxTextColor.apply();
    }, {TX_COLOR, RX_COLOR});
    // ESC[m should be interpreted as ESC[0m
    await appTestHarness.sendTextToTerminal('\x1B[31mred\x1B[0mreset');

    // Check that all data is displayed correctly in terminal
    // After "red", the word "reset" should be back to the default
    // style
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

  test('ESC[1A should go up 1 row', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    // ESC[m should be interpreted as ESC[0m
    await appTestHarness.sendTextToTerminal('up\n\x1B[1A');

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'u', classNames: 'cursorUnfocused' }), // Cursor should be here now!
        new ExpectedTerminalChar({ char: 'p' }),
      ],
      [
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('ESC[2A should go up 2 rows', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    // ESC[m should be interpreted as ESC[0m
    await appTestHarness.sendTextToTerminal('row1\nrow2\nrow3\n\x1B[2A');

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' }), // Cursor should be here now!
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: '1' }),
      ],
      [
        new ExpectedTerminalChar({ char: 'r', classNames: 'cursorUnfocused' }), // Cursor should be here now!
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: '2' }),
      ],
      [
        new ExpectedTerminalChar({ char: 'r' }),
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: '3' }),
      ],
      [
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('ESC[1D should go back 1', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    // ESC[m should be interpreted as ESC[0m
    await appTestHarness.sendTextToTerminal('row1\x1B[1D');

    // Check that all data is displayed correctly in terminal
    let expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' }),
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: '1', classNames: 'cursorUnfocused' }), // Cursor should be moved back 1
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);

    await appTestHarness.sendTextToTerminal('A');
    expectedDisplay = [
      [
        new ExpectedTerminalChar({ char: 'r' }),
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: 'A' }), // 1 should be changed to A
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('ESC[J rewriting a single row', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    // ESC[m should be interpreted as ESC[0m
    await appTestHarness.sendTextToTerminal('row1\x1B[4D\x1B[JrowA');

    // Check that all data is displayed correctly in terminal
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' }),
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: 'A' }),
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('ESC[J clearing multiple rows', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    // 2D go back 2, 1A go up 1, J clear to end of screen
    // row1
    // row2
    await appTestHarness.sendTextToTerminal('row1\nrow2\x1B[2D\x1B[1A\x1B[J');

    // Check that all data is displayed correctly in terminal
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' }),
        new ExpectedTerminalChar({ char: 'o' }), // All data after this 'o' should be gone!
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('escape code over max size should not lock up parser', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    // ESC byte then 0-7, this is 9 bytes in all
    await appTestHarness.sendTextToTerminal('\x1B01234567');

    // We haven't sent 10 bytes in the escape code yet, so nothing should
    // be displayed on screen
    let expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);

    // Now send 10th byte! This should cause the parser to emit all the chars
    // after the ESC byte to the screen
    await appTestHarness.sendTextToTerminal('8');

    // Check that all data is displayed correctly in terminal
    expectedDisplay = [
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
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('do nothing new line cursor behavior should work', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    await page.getByTestId('new-line-dont-move-cursor').click();
    await page.getByTestId('show-terminal-button').click();

    await appTestHarness.sendTextToTerminal('1\n2\n3');

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: '2' }),
        new ExpectedTerminalChar({ char: '3' }),
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('changing num chars per row', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToDisplaySettings();

    await page.locator("[name='terminalWidthChars']").fill("10")
    // Press enter to "apply" change
    await page.keyboard.press('Enter');

    // Go back to terminal view
    await page.getByTestId('show-terminal-button').click();

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
