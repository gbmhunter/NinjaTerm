import {
  render,
  fireEvent,
  within,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupJestCanvasMock } from 'jest-canvas-mock';

import { App } from 'App';
import AppView from 'AppView';

/**
 * Setup function that is re-used by all tests in this file.
 *
 * @returns Created app with mock serial port.
 */
export async function createAppWithMockSerialPort() {

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

  // Mock out the ResizeObserver, as per
  // https://github.com/maslianok/react-resize-detector/issues/145
  // TODO: Undo change after tests finish?
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Setup mocking for HTML canvas, this is required for the graphing pane
  // to work
  setupJestCanvasMock();

  const app = new App(true);
  render(<AppView app={app} />);

  // Make sure dialog window is not open by default
  // let dialogWindow = screen.queryByRole('dialog');
  // expect(dialogWindow).toBeNull();

  // Click button to open settings dialog window
  const button = await screen.findByTestId('settings-button');
  fireEvent.click(button);

  let settingsPane = screen.getByTestId('settings-pane');
  expect(settingsPane).toBeVisible();

  let requestPortAcessButton = await screen.findByTestId('request-port-access');

  await act(async () => {
    fireEvent.click(requestPortAcessButton);
  });

  // Now click the "Open Port" button
  const openPortButton = await within(settingsPane).findByText('Open Port');
  await waitFor(() => {
    expect(openPortButton).toBeEnabled(); // It should be enabled
  })
  await act(async () => {
    fireEvent.click(openPortButton);
  });

  // Now click the Terminal icon button to go back to the terminal screen
  const showTerminalButton = await screen.findByTestId('show-terminal-button');
  fireEvent.click(showTerminalButton);

  // Wait for settings dialog to disappear
  await waitFor(() => {
    const settingsDialog = screen.queryByRole('dialog');
    expect(settingsDialog).not.toBeInTheDocument();
  });

  return { app, writtenData };

}

export class ExpectedTerminalChar {
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
export function checkExpectedAgainstActualDisplay(
  expectedDisplay: ExpectedTerminalChar[][],
  actualDisplay: Element
) {

  // Enable these two lines for easy debugging!
  // console.log('expectedDisplay=', expectedDisplay);
  // screen.debug(actualDisplay);

  // Make sure there are the same number of actual rows as expected rows
  expect(actualDisplay.children.length).toBe(expectedDisplay.length);

  // Now iterate over every row and check contents are equal
  for (let rowIdx = 0; rowIdx < expectedDisplay.length; rowIdx += 1) {
    const row = expectedDisplay[rowIdx];
    // Make sure there are the same number of expected text elements as actual
    // spans
    // expect(actualDisplay.children[rowIdx].children.length).toBe(row.length);
    for (let colIdx = 0; colIdx < row.length; colIdx += 1) {
      const expectedTerminalChar = row[colIdx];
      const actualRow = actualDisplay.children[rowIdx];
      const actualChar = getInfoAboutActualChar(actualRow, colIdx);
      expect(actualChar.text).toEqual(expectedTerminalChar.char);
      // toHaveStyle doesn't work well if you pass it an empty object
      // if (expectedTerminalChar.style !== null) {
        // eslint-disable-next-line jest/no-conditional-expect
        // expect(span).toHaveStyle(expectedTerminalChar.style);
      // }
      // if (expectedTerminalChar.classNames !== null) {
        // expect(span).toHaveClass(expectedTerminalChar.classNames);
      // }
    }
  }
}

const getInfoAboutActualChar = (rowDiv: Element, colIdx: number): {text: string, style: any} => {
  console.log('getInfoAboutActualChar() called with colIdx=', colIdx);
  // Move through the spans in this row div, finding the span that
  // contains the char at specified colId
  // <div>
  //   <span>abc</span>
  //   <span>d</span>
  // </div>
  const spans = rowDiv.children;
  let currSpanIdx = 0;
  let currSpan = spans[currSpanIdx];
  let currIdxInSpanString = 0;
  for (let idx = 0; idx < colIdx; idx += 1) {
    currIdxInSpanString += 1;
    if (currIdxInSpanString >= currSpan.textContent!.length) {
      currSpanIdx += 1;
      currSpan = spans[currSpanIdx];
      currIdxInSpanString = 0;
    }
  }

  const text = currSpan.textContent![currIdxInSpanString];

  console.log('currIdxInSpanString=', currIdxInSpanString, 'char=', text);
  return { text, style: {} };
}

/**
 * Helper class which wraps an App instance and provides some extra
 * functionality which is useful for integration tests.
 */
export class AppTestHarness {

  app: App;
  writtenData: number[];

  constructor(app: App, writtenData: number[]) {
    this.app = app;
    this.writtenData = writtenData;
  }

  /**
   * Use this to create an AppTestHarness instance. This is done because
   * we need to be async, so we can't use the constructor directly.
   *
   * @returns AppTestHarness instance.
   */
  public static async build() {
    let {app, writtenData} = await createAppWithMockSerialPort();
    let appHarness = new AppTestHarness(app, writtenData);

    return appHarness;
  }

  async sendData(data: string) {
    let dataBytes = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i += 1) {
      dataBytes[i] = data.charCodeAt(i);
    }
    await act(async () => {
      this.app.parseRxData(dataBytes);
    });
  }

  async enableGraphing() {
    let showGraphingPaneButton = await screen.findByTestId('show-graphing-pane-button');
    fireEvent.click(showGraphingPaneButton);
    let enableGraphingButton = await screen.findByLabelText('Enable Graphing');
    fireEvent.click(enableGraphingButton);
    expect(this.app.graphing.graphingEnabled).toBe(true);
  }

  /**
   * MUI select inputs are notorously difficult to test. This helper
   * function makes it easier to select an option from a select input.
   *
   * @param select The select element you want to click an option on.
   * @param optionText The text of the option you want to click.
   */
  async chooseMuiSelectOption(select: HTMLElement, optionText: string) {
    let button = within(select).getByRole("button");

    await act(() => {
      userEvent.click(button);
    });

    // The dropdown is not contained within the parent select element!!!
    // It's right at the bottom of the page, outside normal doc flow
    // Best I could do was find a listbox, hopefully there is only
    // ever one on the page (the opened dropdown!).
    let optionElement: HTMLElement;
    await waitFor(() => {
      optionElement = within(screen.getByRole('listbox')).getByText(optionText);
    });

    await act(() => {
      userEvent.click(optionElement);
    });
  }
}
