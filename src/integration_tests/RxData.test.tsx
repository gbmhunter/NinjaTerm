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
import { TextEncoder, TextDecoder } from 'util';

import { App } from 'App';
import AppView from 'AppView';

import { createAppWithMockSerialPort, ExpectedTerminalChar, checkExpectedAgainstActualDisplay } from './Util';

Object.assign(global, { TextDecoder, TextEncoder });

describe('RxData', () => {

  //==========================================================================
  // RX TESTS
  //==========================================================================

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
        new ExpectedTerminalChar({ char: 'r' , classNames: 'f31' }),
        new ExpectedTerminalChar({ char: 'e' , classNames: 'f31' }),
        new ExpectedTerminalChar({ char: 'd' , classNames: 'f31' }),
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
        new ExpectedTerminalChar({ char: 'r' , classNames: 'f31 b' }),
        new ExpectedTerminalChar({ char: 'e' , classNames: 'f31 b' }),
        new ExpectedTerminalChar({ char: 'd' , classNames: 'f31 b' }),
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
        new ExpectedTerminalChar({ char: 'r' , classNames: 'f91' }),
        new ExpectedTerminalChar({ char: 'e' , classNames: 'f91' }),
        new ExpectedTerminalChar({ char: 'd' , classNames: 'f91' }),
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

  it('escape code over max size should not lock up parser', async () => {
    const app = new App(true);
    render(<AppView app={app} />);

    // ESC byte then 0-7, this is 9 bytes in all
    let textToSend = '\x1B01234567';

    const utf8EncodeText = new TextEncoder();
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];

    // We haven't sent 10 bytes in the escape code yet, so nothing should
    // be displayed on screen
    let expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }),
      ],
    ];
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });

    // Now send 10th byte! This should cause the parser to emit all the chars
    // after the ESC byte to the screen
    textToSend = '8';
    await act(async () => {
      app.parseRxData(utf8EncodeText.encode(`${textToSend}`));
    });

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
    await waitFor(() => {
      checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
    });
  });
});
