/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';

// Configure mock API before each test.
test.beforeEach(async ({ page }) => {

  // Listen for all console logs in browser and print them
  // to the Playwright terminal
  page.on('console', msg => console.log(msg.text()));

  await page.addInitScript(() => {

    let writtenData: number[] = []

    const mockWriter = {
      write: (data: Uint8Array) => {
        for (let i = 0; i < data.length; i += 1) {
          writtenData.push(data[i]);
        }
        return Promise.resolve();
      },
      releaseLock: () => {
        return Promise.resolve();
      },
    }

    const mockReader = {
      read: () => {
        return new Promise(function(resolve, reject) {
          // Don't do anything, which will cause read() in App to never resolve. I tried to get a
          // deferred promise working but I could never just trigger a resolution once (e.g. provide
          // a single character, it was always get stuck repeatedly resolving)
        });;
      },
      releaseLock: () => {
        // console.log('mock releaseLock() called.');
        return;
      },
    }

    const mockPort = {
      getInfo: () => {
        return {
          usbProductId: '123',
          usbVendorId: '456',
        };
      },
      open: () => {
        // console.log('mock open() called.');
        return Promise.resolve();
      },
      close: () => {
        // console.log('mock open() called.');
        return Promise.resolve();
      },
      writable:  {
        getWriter: () => {
          // console.log('mock writable() called.');
          return mockWriter;
        },
      },
      readable: {
        getReader: () => {
          // console.log('mock readable() called.');
          return mockReader;
        },
      }
    };

    const mockSerial = {
      requestPort: () => {
        console.log('mock requestPort() called.');
        return Promise.resolve(mockPort);
      },
    };
    console.log('Overriding window.navigator.serial');

    // WARNING: For Edge and Firefox, the mock needs to be assigned to window.navigator.serial, but for Chrome it
    // needs to be window.navigator.serial.requestPort. I don't know why???

    // @ts-ignore:next-line
    window.navigator.serial = mockSerial;

    // @ts-ignore:next-line
    window.navigator.serial.requestPort = () => {
      console.log('mock requestPort() called.');
      return Promise.resolve(mockPort);
    };

    // @ts-ignore:next-line
    console.log('window.navigator.serial.test=', window.navigator.serial.test());
  });
});

test.describe('Basic loading', () => {

  test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect the "Go to app" button to be visible on the homepage.
    await page.getByText(/Go to app/).click();

    await page.getByTestId('settings-button').click();

    await page.getByTestId('request-port-access').click();

    await page.getByText('Open Port').click();
  });

});
