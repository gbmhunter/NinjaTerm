/* eslint-disable testing-library/no-unnecessary-act */
/* eslint-disable testing-library/no-node-access */
// /* eslint-disable jest/expect-expect */
// /**
//  * This file contains the integration tests for NinjaTerm. These test the entire application, from faking mouse clicks to connect
//  * to a fake serial port, injecting fake serial data, and making sure that this data is rendered correctly on the screen.
//  *
//  * Add .only to the end of "it" to run just 1 test during development, e.g. it.only(...)
//  */
import '@testing-library/jest-dom';
import {
  render,
  fireEvent,
  within,
  screen,
  waitFor,
  act,
} from '@testing-library/react';

import { App } from './model/App';
import AppView from './AppView';

import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

/**
 * Setup function that is re-used by all tests in this file.
 *
 * @returns Created app with mock serial port.
 */
async function createAppWithMockSerialPort() {

  let writtenData: number[] = []

  const mockWriter = {
    write: jest.fn().mockImplementation((data: Uint8Array) => {
      for (let i = 0; i < data.length; i += 1) {
        writtenData.push(data[i]);
      }
      return Promise.resolve();
    }),
    releaseLock: jest.fn().mockImplementation(() => {
      return Promise.resolve();
    }),
  }

  const mockReader = {
    read: jest.fn().mockImplementation(() => {
      return new Promise(function(resolve, reject) {
        // Don't do anything, which will cause read() in App to never resolve. I tried to get a
        // deferred promise working but I could never just trigger a resolution once (e.g. provide
        // a single character, it was always get stuck repeatedly resolving)
      });;
    }),
    releaseLock: jest.fn().mockImplementation(() => {
      // console.log('mock releaseLock() called.');
      return;
    }),
  }

  const mockPort = {
    getInfo: jest.fn().mockImplementation(() => {
      return {
        usbProductId: '123',
        usbVendorId: '456',
      };
    }),
    open: jest.fn().mockImplementation(() => {
      // console.log('mock open() called.');
      return Promise.resolve();
    }),
    close: jest.fn().mockImplementation(() => {
      // console.log('mock open() called.');
      return Promise.resolve();
    }),
    writable:  {
      getWriter: jest.fn().mockImplementation(() => {
        // console.log('mock writable() called.');
        return mockWriter;
      }),
    },
    readable: {
      getReader: jest.fn().mockImplementation(() => {
        // console.log('mock readable() called.');
        return mockReader;
      }),
    }
  }

  const mockSerial = {
    requestPort: jest.fn().mockImplementation(() => {
      // console.log('mock requestPort() called.');
      return Promise.resolve(mockPort);
    }),
  };
  // @ts-ignore:next-line
  global.navigator.serial = mockSerial;

  const app = new App(true);
  render(<AppView app={app} />);

  // Make sure dialog window is not open by default
  let dialogWindow = screen.queryByRole('dialog');
  expect(dialogWindow).toBeNull();

  // Click button to open settings dialog window
  const button = await screen.findByTestId('settings-button');
  fireEvent.click(button);

  dialogWindow = screen.getByRole('dialog');
  // Dialog window should now be in the DOM and visible
  expect(dialogWindow).toBeVisible();

  let requestPortAcessButton = await screen.findByTestId('request-port-access');

  await act(async () => {
    fireEvent.click(requestPortAcessButton);
  });

  // Now click the "Open Port" button
  const openPortButton = await within(dialogWindow).findByText('Open Port');
  await waitFor(() => {
    expect(openPortButton).toBeEnabled(); // It should be enabled
  })
  await act(async () => {
    fireEvent.click(openPortButton);
  });
  // Wait for settings dialog to disappear
  await waitFor(() => {
    const settingsDialog = screen.queryByRole('dialog');
    expect(settingsDialog).not.toBeInTheDocument();
  });

  return { app, writtenData };

}

class ExpectedTerminalChar {
  char: string;

  style: { [key: string]: string } | null;

  classNames: string | null;

  constructor({
    char,
    style = null,
    classNames = null,
  }: {
    char: string;
    style?: { [key: string]: string } | null;
    classNames?: string | null;
  }) {
    this.char = char;
    this.style = style;
    this.classNames = classNames;
  }
}

/**
 * Helper function which compares expected displayed data with
 * what was actually rendered.
 *
 * @param expectedDisplay What you expect to be displayed.
 * @param actualDisplay What was actually displayed.
 */
function checkExpectedAgainstActualDisplay(
  expectedDisplay: ExpectedTerminalChar[][],
  actualDisplay: Element
) {
  // Make sure there are the same number of actual rows as expected rows
  expect(actualDisplay.children.length).toBe(expectedDisplay.length);

  // Now iterate over every row and check contents are equal
  for (let rowIdx = 0; rowIdx < expectedDisplay.length; rowIdx += 1) {
    const row = expectedDisplay[rowIdx];
    // Make sure there are the same number of expected text elements as actual
    // spans
    expect(actualDisplay.children[rowIdx].children.length).toBe(row.length);
    for (let colIdx = 0; colIdx < row.length; colIdx += 1) {
      const expectedTerminalChar = row[colIdx];
      const span = actualDisplay.children[rowIdx].children[colIdx];
      expect(span.textContent).toEqual(expectedTerminalChar.char);
      // toHaveStyle doesn't work well if you pass it an empty object
      if (expectedTerminalChar.style !== null) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(span).toHaveStyle(expectedTerminalChar.style);
      }
      if (expectedTerminalChar.classNames !== null) {
        expect(span).toHaveClass(expectedTerminalChar.classNames);
      }
    }
  }
}

describe('App', () => {

  it('should handle single RX char', async () => {
    let {app, writtenData} = await createAppWithMockSerialPort();

    const textToSend = 'A';
    const utf8EncodeText = new TextEncoder();

    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

    // Check that all data is displayed correctly in terminal
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'A' }),
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }),
      ],
    ];
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  it('should display "Hello, World"', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    const textToSend = 'Hello, world!';
    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}\n`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

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
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  it('should render red text', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    const textToSend = '\x1B[31mred';
    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

    // Check that all data is displayed correctly in terminal
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  it('should render bright red text using bold mode', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    const textToSend = '\x1B[31;1mred';

    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

    // Check that all data is displayed correctly in terminal
    // Red should be "bright red"
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(255, 85, 85)' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(255, 85, 85)' } }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(255, 85, 85)' } }),
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  it('should render bright red text using number 91', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    const textToSend = '\x1B[91mred';


    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

    // Check that all data is displayed correctly in terminal
    // Red should be "bright red"
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(255, 85, 85)' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(255, 85, 85)' } }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(255, 85, 85)' } }),
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  it('ESC[m should reset CSI styles', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    // ESC[m should be interpreted as ESC[0m
    const textToSend = '\x1B[31mred\x1B[mreset';

    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

    // Check that all data is displayed correctly in terminal
    // After "red", the word "reset" should be back to the default
    // style
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'r' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 's' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 't' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: ' ' , style: { color: '' } }),
      ],
    ];
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  it('ESC[0m should reset CSI styles', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    // ESC[m should be interpreted as ESC[0m
    const textToSend = '\x1B[31mred\x1B[0mreset';

    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

    // Check that all data is displayed correctly in terminal
    // After "red", the word "reset" should be back to the default
    // style
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'r' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 's' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 't' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: ' ' , style: { color: '' } }),
      ],
    ];
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  it('ESC[1A should go up 1 row', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    const textToSend = 'up\n\x1B[1A';

    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

    // Check that all data is displayed correctly in terminal
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'u', classNames: 'cursorUnfocused' }), // Cursor should be here now!
        new ExpectedTerminalChar({ char: 'p' }),
      ],
      [
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  it('ESC[2A should go up 2 rows', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    const textToSend = 'row1\nrow2\nrow3\n\x1B[2A';

    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

    // Check that all data is displayed correctly in terminal
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
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  it('ESC[1D should go back 1', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    const textToSend = 'row1\x1B[1D';

    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

    // Check that all data is displayed correctly in terminal
    let expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' }),
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: '1', classNames: 'cursorUnfocused' }), // Cursor should be moved back 1
      ],
    ];
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });

    await act(async () => {
      app.parseRxData(utf8EncodeText.encode('A'));
    });
    expectedDisplay = [
      [
        new ExpectedTerminalChar({ char: 'r' }),
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: 'A' }), // 1 should be changed to A
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }),
      ],
    ];
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  it('ESC[J rewriting a single row', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    // Let's rename row1 to rowA
    const textToSend = 'row1\x1B[4D\x1B[JrowA';

    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

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
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  it('ESC[J clearing multiple rows', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    // Let's move back to the 'w' in row2 and then up to the 'w' in row1, then clear everything
    // to the end of screen
    const textToSend = 'row1\nrow2\x1B[2D\x1B[1A\x1B[J';

    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

    // Check that all data is displayed correctly in terminal
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' }),
        new ExpectedTerminalChar({ char: 'o' }), // All data after this 'o' should be gone!
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }),
      ],
    ];
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });

  // TX TESTS
  //==========================================================

  it('app should send basic A char', async () => {
    let {app, writtenData} = await createAppWithMockSerialPort();

    const terminal = screen.getByTestId('tx-rx-terminal-view');
    // Simulate a key press
    fireEvent.keyDown(terminal, {key: 'A', code: 'KeyA'})
    const utf8EncodeText = new TextEncoder();
    const expectedText = utf8EncodeText.encode('A');
    await waitFor(() => {
      // Comparing Uint8Array's does not work, so convert to
      // number[] and compare those instead
      expect(writtenData).toEqual(Array.from(expectedText));
    });
  });

  it('app should send BS (0x08) when Backspace key is pressed', async () => {
    let {app, writtenData} = await createAppWithMockSerialPort();

    const terminal = screen.getByTestId('tx-rx-terminal-view');
    // Simulate a key press
    fireEvent.keyDown(terminal, {key: 'Backspace'})
    const expectedData = [ 0x08 ];
    await waitFor(() => {
      expect(writtenData).toEqual(expectedData);
    });
  });
});
