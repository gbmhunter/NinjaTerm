import { expect, Page, Locator } from "@playwright/test";

// This import is so we can grab window.app without typescript complaining
// Complains it's unused though...
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { App } from "../src/App";

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

// To make typescript happy about the exposeFunction below.
declare global {
  interface Window { writeData: (data: number) =>{}; }
}

export class AppTestHarness {
  writtenData: number[] = [];

  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  setupPage = async () => {
    // Listen for all console logs in browser and print them
    // to the Playwright terminal
    this.page.on("console", (msg) => console.log(msg.text()));

    // We need expose a function to pass the written data back from
    // the browser context to this node.js test context
    await this.page.exposeFunction('writeData', (data) => {
      console.log('exposeFunction() called with data=', data);
      this.writtenData.push(data);
    });
    await this.page.addInitScript(() => {
      const mockWriter = {
        write: (data: Uint8Array) => {
          console.log('mock write() called with data=', data);
          // Uint8Array's are serialized a bit weirdly,
          // so do the loop client side and just send back numbers
          for (let i = 0; i < data.length; i += 1) {
            console.log('mock write() pushing data[i]=', data[i]);
            window.writeData(data[i]);
          }
          return Promise.resolve();
        },
        releaseLock: () => {
          return Promise.resolve();
        },
      };

      const mockReader = {
        read: () => {
          return new Promise(function (resolve, reject) {
            // Don't do anything, which will cause read() in App to never resolve. I tried to get a
            // deferred promise working but I could never just trigger a resolution once (e.g. provide
            // a single character, it was always get stuck repeatedly resolving)
          });
        },
        releaseLock: () => {
          // console.log('mock releaseLock() called.');
          return;
        },
      };

      const mockPort = {
        getInfo: () => {
          return {
            usbProductId: "123",
            usbVendorId: "456",
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
        writable: {
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
        },
      };

      const mockSerial = {
        requestPort: () => {
          // console.log("mock requestPort() called.");
          return Promise.resolve(mockPort);
        },
      };

      // WARNING: For Edge and Firefox, the mock needs to be assigned to window.navigator.serial, but for Chrome it
      // needs to be window.navigator.serial.requestPort. I don't know why???

      // @ts-ignore:next-line
      window.navigator.serial = mockSerial;

      // @ts-ignore:next-line
      window.navigator.serial.requestPort = () => {
        // console.log("mock requestPort() called.");
        return Promise.resolve(mockPort);
      };
    });
  };

  openPortAndGoToTerminalView = async () => {
    await this.page.goto("/");

    // Expect the "Go to app" button to be visible on the homepage.
    await this.page.getByText(/Go to app/).click();
    await this.page.getByTestId("settings-button").click();
    await this.page.getByTestId("request-port-access").click();
    await this.page.getByText("Open Port").click();
    await this.page.getByTestId("show-terminal-button").click();
  };

  /**
   * Use this to send data to NinjaTerm when testing. For the most
   * part NinjaTerm thinks this came from the serial port.
   *
   * @param textToSend The data you want to send as a string.
   */
  sendTextToTerminal = async (textToSend: string) => {
    await this.page.evaluate((textToSend) => {
      let dataToSend: number[] = [];
      for (let i = 0; i < textToSend.length; i += 1) {
        dataToSend.push(textToSend.charCodeAt(i));
      }
      window.app.parseRxData(Uint8Array.from(dataToSend));
    }, textToSend);
  }

  checkTerminalTextAgainstExpected = async (expectedDisplay: ExpectedTerminalChar[][]) => {
    for (let rowIdx = 0; rowIdx < expectedDisplay.length; rowIdx += 1) {
      for (let colIdx = 0; colIdx < expectedDisplay[rowIdx].length; colIdx += 1) {
        const expectedTerminalChar = expectedDisplay[rowIdx][colIdx];
        const actualTerminalRow = await this.page
          .getByTestId("tx-rx-terminal-view")
          .locator(".terminal-row")
          .nth(rowIdx);
        let { text, span } = await this.getInfoAboutActualChar(actualTerminalRow, colIdx);

        // Check the string (text) of each character is identical
        expect(text).toEqual(expectedDisplay[rowIdx][colIdx].char);

        // Grab the computed style for the span element the text char was contained in
        const computedStyle = await span.evaluate((element) =>
          window.getComputedStyle(element)
        );

        // For each property in the expected style, check that it's the same value in the
        // computed style
        if (expectedTerminalChar.style !== null) {
          Object.keys(expectedTerminalChar.style).forEach(function(key, index) {
            expect(computedStyle[key]).toEqual(expectedTerminalChar.style![key]);
          });
        }

        // Check the class names are the same
        if (expectedTerminalChar.classNames !== null) {
          const actualClassNames = await span.evaluate((element) => element.className);
          expect(actualClassNames).toContain(expectedTerminalChar.classNames);
        }
      }
    }
  };

  /**
   * Use this to extract information about an actual displayed char at the
   * given column index in a particular row div in the terminal pane.
   *
   * This walks through the one or more spans in the row div, and finds the
   * span that contains the char at the specified column index.
   *
   * @param rowDiv The row div to look in.
   * @param colIdx The column index of the char you want to find.
   * @returns The text of the char, the span element that contains it, and
   * the computed style of the span.
   */
  getInfoAboutActualChar = async (
    rowDiv: Locator,
    colIdx: number
  ): Promise<{ text: string, span: Locator }> => {
    // console.log('getInfoAboutActualChar() called with colIdx=', colIdx);
    // Move through the spans in this row div, finding the span that
    // contains the char at specified colId
    // <div>
    //   <span>abc</span>
    //   <span>d</span>
    // </div>
    // const spans = rowDiv.children;
    let currSpanIdx = 0;
    let spans = await rowDiv.locator("span").all();
    let currSpan = spans[0];
    let currSpanTextContent = await currSpan.textContent();
    if (currSpanTextContent === null) {
      throw new Error("currSpanTextContent is null");
    }
    let currIdxInSpanString = 0;
    for (let idx = 0; idx < colIdx; idx += 1) {
      currIdxInSpanString += 1;
      if (currIdxInSpanString >= currSpanTextContent.length) {
        currSpanIdx += 1;
        currSpan = spans[currSpanIdx];
        currSpanTextContent = await currSpan.textContent();
        if (currSpanTextContent === null) {
          throw new Error("currSpanTextContent is null");
        }
        currIdxInSpanString = 0;
      }
    }

    const text = currSpanTextContent[currIdxInSpanString];

    return { text, span: currSpan };
  };
}
