// See https://www.electronjs.org/docs/latest/tutorial/automated-testing#using-playwright
import { expect, Page, Locator, _electron as electron } from '@playwright/test';
import { ElectronApplication } from 'playwright';
import * as os from 'os';
import * as path from 'path';
import { createRequire } from 'module';
import './types';

const require = createRequire(import.meta.url);

// Re-export ExpectedTerminalChar so it can be imported from ElectronUtil
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

export class ElectronAppTestHarness {
  /**
   * This array is used to store the data that is written to the serial port from the app.
   * Used to checking if data was written correctly during e2e tests. You might need to
   * poll this because it is written to asynchronously.
   */
  writtenData: number[] = [];

  /**
   * One entry per call to `serial:write-data`, each holding that call's bytes.
   *
   * `writtenData` above flattens every write into a single byte array, which
   * cannot distinguish six one-byte writes from one six-byte write. That is
   * exactly the distinction TX line mode is about (issue #410), so the chunk
   * boundaries are captured separately here.
   */
  writeChunks: number[][] = [];

  electronApp!: ElectronApplication;

  /** The main page of the Electron app. Saved in setupElectronApp(). */
  page!: Page;

  constructor() {
    // These will be initialized in setupElectronApp
  }

  /**
   * Sets up the Electron app and gets the main window.
   * Call this before any tests.
   */
  setupElectronApp = async () => {
    // Create a unique temporary user data directory for complete test isolation
    // If we don't do this, user data (e.g. "local storage") will persist between tests
    const tempUserDataDir = path.join(os.tmpdir(), `ninjaterm-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);

    // In CI environment on Linux, wait a bit for Xvfb to be ready
    if (process.env.CI && process.platform === 'linux') {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Launch Electron app with headless configuration and isolated user data
    const launchOptions: any = {
      executablePath: require('electron'),
      args: ['.', `--user-data-dir=${tempUserDataDir}`],
    };

    // Run headless unless HEADED=1 is set. This prevents Electron windows from
    // popping up during normal development workflow.
    const isHeaded = process.env.HEADED === '1';
    if (!isHeaded) {
      launchOptions.args.push('--headless');
      launchOptions.args.push('--no-sandbox');
      launchOptions.args.push('--disable-gpu');
      launchOptions.args.push('--disable-dev-shm-usage');
      launchOptions.args.push('--disable-background-timer-throttling');
      launchOptions.args.push('--disable-backgrounding-occluded-windows');
      launchOptions.args.push('--disable-renderer-backgrounding');
      launchOptions.args.push('--no-first-run');

      if (process.platform === 'linux') {
        launchOptions.env = {
          ...process.env,
          DISPLAY: process.env.DISPLAY || ':99', // For Xvfb on Linux
        };
      }
    }

    try {
      this.electronApp = await electron.launch(launchOptions);
    } catch (error) {
      console.error('[ERROR] Failed to launch Electron app:', error);
      throw new Error(`Failed to launch Electron app: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Mock IPC handlers at the main process level before the app starts
    await this.setupIPCMocking();

    // Get the first window that the app opens. This is the main window.
    try {
      this.page = await this.electronApp.firstWindow();
    } catch (error) {
      console.error('[ERROR] Failed to get first window:', error);
      throw new Error(`Failed to get first window: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Capture internal Electron console logs and route to Playwright console with [ELECTRON] prefix
    this.page.on('console', (msg) => console.log(`[ELECTRON]: ${msg.text()}`));

    // Wait for the app to be ready
    await this.page.waitForLoadState('domcontentloaded');

    // Disable tooltips globally for e2e tests to prevent interference with Playwright element interactions
    await this.page.evaluate(() => {
      window.app.settings.displaySettings.setTooltipsEnabled(false);
      console.log('[E2E] Tooltips disabled globally for test stability');
    });

    // Set up data capture for serial port writes
    await this.setupDataCapture();
  };

  /**
   * Closes the Electron app.
   * Call this after tests are done.
   */
  closeElectronApp = async () => {
    if (this.electronApp) {
      await this.electronApp.close();
    }
  };

  /**
   * Sets up IPC mocking at the main process level.
   */
  private setupIPCMocking = async () => {
    // Mock IPC handlers in the main process
    await this.electronApp.evaluate(async ({ ipcMain }) => {
      // Remove existing handlers first
      ipcMain.removeHandler('serial:list-ports');
      ipcMain.removeHandler('serial:open-port');
      ipcMain.removeHandler('serial:close-port');
      ipcMain.removeHandler('serial:write-data');

      // Set up mock handlers
      ipcMain.handle('serial:list-ports', async () => {
        console.log('[MOCK] Main process: serial:list-ports');
        return {
          success: true,
          ports: [
            {
              path: '/dev/ttyTEST',
              manufacturer: 'Test Manufacturer',
              serialNumber: 'TEST123',
              vendorId: '1234',
              productId: '5678',
              friendlyName: 'Test Port'
            }
          ]
        };
      });

      ipcMain.handle('serial:open-port', async (event, portPath, options) => {
        console.log(`[MOCK] Main process: serial:open-port ${portPath}`);
        return { success: true };
      });

      ipcMain.handle('serial:close-port', async (event, portPath) => {
        console.log(`[MOCK] Main process: serial:close-port ${portPath}`);
        return { success: true };
      });

      ipcMain.handle('serial:write-data', async (event, portPath, data) => {
        console.log(`[MOCK] Main process: serial:write-data ${portPath}, ${data.length} bytes`);

        // Store the data globally for the test to retrieve
        if (!global._testWrittenData) {
          global._testWrittenData = [];
        }
        global._testWrittenData.push(...data);

        // Also record this write's bytes as their own chunk, so tests can
        // assert on how many writes happened, not just the bytes overall.
        if (!global._testWriteChunks) {
          global._testWriteChunks = [];
        }
        global._testWriteChunks.push(Array.from(data));

        return { success: true };
      });

      console.log('[MOCK] IPC handlers mocked successfully');
    });
  };

  /**
   * Sets up data capture for testing.
   */
  private setupDataCapture = async () => {
    // Store mock callbacks for event simulation
    await this.page.addInitScript(() => {
      const mockCallbacks: { [key: string]: Function[] } = {};
      (window as any)._mockSerialCallbacks = mockCallbacks;
    });

    // Initialize the global test data storage in the main process
    await this.electronApp.evaluate(() => {
      global._testWrittenData = [];
      global._testWriteChunks = [];
    });
  };

  /**
   * Retrieves captured written data from the main process and updates writtenData.
   */
  updateWrittenDataFromMainProcess = async () => {
    const captured = await this.electronApp.evaluate(() => {
      const data = global._testWrittenData || [];
      const chunks = global._testWriteChunks || [];
      global._testWrittenData = []; // Clear after retrieving
      global._testWriteChunks = [];
      return { data, chunks };
    });

    this.writtenData.push(...captured.data);
    this.writeChunks.push(...captured.chunks);
  };

  /** Clears both the flattened written data and the per-write chunks. */
  clearWrittenData = () => {
    this.writtenData = [];
    this.writeChunks = [];
  };

  /**
   * Opens a port and navigates to terminal view.
   * This is the Electron equivalent of the web version.
   */
  openPortAndGoToTerminalView = async () => {
    // Wait for the app to be fully loaded
    await this.page.waitForSelector('[data-testid="settings-button"]', { timeout: 10000 });

    // Dismiss any tooltips by pressing Escape
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(200);

    // Now use the app's normal flow but with mocked IPC calls
    // First, trigger port scanning to populate the list (this will use our mock listPorts)
    await this.page.evaluate(async () => {
      const app = window.app;
      // Trigger the normal port scanning process
      await app.settings.portConfiguration.scanForSerialPorts();

      // The mocked listPorts will return our fake port, so select it
      const availablePorts = app.settings.portConfiguration.availableSerialPorts;
      if (availablePorts && availablePorts.length > 0) {
        app.settings.portConfiguration.setSelectedSerialPort(availablePorts[0]);
      }
    });

    // Wait for the port list to be populated
    await this.page.waitForTimeout(300);

    // Open the port using the app's normal flow (this will use our mocked openPort)
    await this.page.evaluate(async () => {
      const app = window.app;
      await app.connController.openConnection({ silenceSnackbar: true });
    });

    // Wait for the port to be "opened"
    await this.page.waitForTimeout(500);

    // Ensure we're on the terminal view
    await this.dismissTooltipsAndClick('[data-testid="show-terminal-button"]');

    // Wait for terminal to be ready
    await this.page.waitForSelector('[data-testid="tx-rx-terminal-view"]', { timeout: 5000 });
  };

  /**
   * Helper method to dismiss tooltips and click an element
   */
  private dismissTooltipsAndClick = async (selector: string) => {
    // Press Escape multiple times to dismiss any tooltips
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(200);

    // Wait for element and click with force if needed
    await this.page.waitForSelector(selector, { timeout: 5000 });

    // Try clicking with force to bypass tooltip interference
    try {
      await this.page.click(selector, { force: true });
    } catch (error) {
      // If force click fails, try again after more escape presses
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(300);
      await this.page.click(selector, { force: true });
    }
  };

  /**
   * Sends text data to the terminal as if it came from the serial port.
   * This directly calls the parseRxData method.
   */
  sendTextToTerminal = async (textToSend: string) => {
    await this.page.evaluate((textToSend) => {
      let dataToSend: number[] = [];
      for (let i = 0; i < textToSend.length; i += 1) {
        dataToSend.push(textToSend.charCodeAt(i));
      }
      window.app.parseRxData(Uint8Array.from(dataToSend));
    }, textToSend);
  };

  /**
   * Sends byte data to the terminal as if it came from the serial port.
   */
  sendBytesToTerminal = async (bytesToSend: number[]) => {
    await this.page.evaluate((bytesToSend) => {
      window.app.parseRxData(Uint8Array.from(bytesToSend));
    }, bytesToSend);
  };

  /**
   * Simulates data received from the serial port via IPC event (alternative method).
   * This triggers the normal IPC data received flow.
   */
  simulateSerialDataReceived = async (portPath: string, data: number[]) => {
    await this.page.evaluate(({ portPath, data }) => {
      const callbacks = (window as any)._mockSerialCallbacks;
      if (callbacks && callbacks['data-received']) {
        callbacks['data-received'].forEach((callback: Function) => {
          callback(portPath, data);
        });
      }
    }, { portPath, data });
  };

  /**
   * Simulates a serial port error via IPC event.
   */
  simulateSerialError = async (portPath: string, error: string) => {
    await this.page.evaluate(({ portPath, error }) => {
      const callbacks = (window as any)._mockSerialCallbacks;
      if (callbacks && callbacks['error']) {
        callbacks['error'].forEach((callback: Function) => {
          callback(portPath, error);
        });
      }
    }, { portPath, error });
  };

  /**
   * Simulates a serial port being closed via IPC event.
   */
  simulateSerialPortClosed = async (portPath: string) => {
    await this.page.evaluate((portPath) => {
      const callbacks = (window as any)._mockSerialCallbacks;
      if (callbacks && callbacks['port-closed']) {
        callbacks['port-closed'].forEach((callback: Function) => {
          callback(portPath);
        });
      }
    }, portPath);
  };

  /**
   * Checks terminal text against expected display.
   */
  checkTerminalTextAgainstExpected = async (expectedDisplay: ExpectedTerminalChar[][]) => {
    for (let rowIdx = 0; rowIdx < expectedDisplay.length; rowIdx += 1) {
      for (let colIdx = 0; colIdx < expectedDisplay[rowIdx].length; colIdx += 1) {
        const expectedTerminalChar = expectedDisplay[rowIdx][colIdx];
        const actualTerminalRow = await this.page
          .getByTestId('tx-rx-terminal-view')
          .locator('.terminal-row')
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
            expect((computedStyle as any)[key]).toEqual(expectedTerminalChar.style![key]);
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
   * Extracts information about an actual displayed char at the given column index.
   */
  getInfoAboutActualChar = async (
    rowDiv: Locator,
    colIdx: number
  ): Promise<{ text: string, span: Locator }> => {
    let currSpanIdx = 0;
    let spans = await rowDiv.locator('span').all();
    let currSpan = spans[0];
    let currSpanTextContent = await currSpan.textContent();
    if (currSpanTextContent === null) {
      throw new Error('currSpanTextContent is null');
    }
    let currIdxInSpanString = 0;
    for (let idx = 0; idx < colIdx; idx += 1) {
      currIdxInSpanString += 1;
      if (currIdxInSpanString >= currSpanTextContent.length) {
        currSpanIdx += 1;
        currSpan = spans[currSpanIdx];
        currSpanTextContent = await currSpan.textContent();
        if (currSpanTextContent === null) {
          throw new Error('currSpanTextContent is null');
        }
        currIdxInSpanString = 0;
      }
    }

    const text = currSpanTextContent[currIdxInSpanString];

    return { text, span: currSpan };
  };

  // Navigation helpers
  goToRxSettings = async () => {
    await this.dismissTooltipsAndClick('[data-testid="settings-button"]');
    await this.page.waitForTimeout(300);
    await this.dismissTooltipsAndClick('[data-testid="rx-settings-button"]');
  };

  goToDisplaySettings = async () => {
    await this.dismissTooltipsAndClick('[data-testid="settings-button"]');
    await this.page.waitForTimeout(300);
    await this.dismissTooltipsAndClick('[data-testid="display-settings-button"]');
  };

  /** Opens Settings and selects the Presets category (which also hosts profiles). */
  goToPresets = async () => {
    await this.dismissTooltipsAndClick('[data-testid="settings-button"]');
    await this.page.waitForTimeout(300);
    await this.dismissTooltipsAndClick('[data-testid="profile-settings-button"]');
    await this.page.waitForTimeout(300);
  };

  /** Opens Settings and selects the TX Settings category. */
  goToTxSettings = async () => {
    await this.dismissTooltipsAndClick('[data-testid="settings-button"]');
    await this.page.waitForTimeout(300);
    await this.dismissTooltipsAndClick('[data-testid="tx-settings-button"]');
    await this.page.waitForTimeout(300);
  };

  goToGeneralSettings = async () => {
    await this.dismissTooltipsAndClick('[data-testid="settings-button"]');
    await this.page.waitForTimeout(300);
    await this.dismissTooltipsAndClick('[data-testid="general-settings-button"]');
  };

  goToTerminalView = async () => {
    await this.dismissTooltipsAndClick('[data-testid="show-terminal-button"]');
  };

  enableGraphing = async () => {
    await this.dismissTooltipsAndClick('[data-testid="show-graphing-pane-button"]');
    await this.page.waitForTimeout(300);
    await this.page.getByLabel('Enable Graphing').click();
  };

  changeTerminalWidth = async (newWidth: number) => {
    await this.goToDisplaySettings();
    await this.page.waitForTimeout(500); // Wait for settings dialog to fully open

    // Clear and fill the terminal width field
    const widthField = this.page.locator("[name='terminalWidthChars']");
    await widthField.clear();
    await widthField.fill(String(newWidth));
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(300); // Wait for setting to apply

    // Go back to terminal view
    await this.dismissTooltipsAndClick('[data-testid="show-terminal-button"]');
  };
}
