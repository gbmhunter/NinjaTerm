/* eslint-disable testing-library/prefer-screen-queries */
import { test } from '@playwright/test';

import { ExpectedTerminalChar, AppTestHarness } from './Util';

test.describe('RX data', () => {

  test('hello, world!', async ({ page }) => {

    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('Hello, world!\n');

    // await page.evaluate(() => {
    //   let textToSend = 'Hello, world!\n';
    //   let dataToSend: number[] = [];
    //   for (let i = 0; i < textToSend.length; i += 1) {
    //     dataToSend.push(textToSend.charCodeAt(i));
    //   }
    //   window.app.parseRxData(Uint8Array.from(dataToSend));
    // });

    // Check that all data is displayed correctly in terminal
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

    await page.evaluate(() => {
      let textToSend = '\x1B[31mred';
      let dataToSend: number[] = [];
      for (let i = 0; i < textToSend.length; i += 1) {
        dataToSend.push(textToSend.charCodeAt(i));
      }
      window.app.parseRxData(Uint8Array.from(dataToSend));
    });

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



});
