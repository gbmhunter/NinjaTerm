import { expect, Page, Locator, _electron as electron } from '@playwright/test';
import { ElectronApplication } from 'playwright';
import { ExpectedTerminalChar } from './Util';

export class ElectronAppTestHarness {
  /**
   * This array is used to store the data that is written to the serial port from the app.
   * Used to checking if data was written correctly during e2e tests. You might need to
   * poll this because it is written to asynchronously.
   */
  writtenData: number[] = [];

  electronApp: ElectronApplication;
  page: Page;

  constructor() {
    // These will be initialized in setupElectronApp
  }

  /**
   * Sets up the Electron app and gets the main window.
   * Call this before any tests.
   */
  setupElectronApp = async () => {
    // Launch Electron app
    this.electronApp = await electron.launch({ 
      args: ['.'],
      // Enable debugging if needed
      // executablePath: require('electron'), // if you want to use a specific Electron version
    });
    
    // Get the first window that the app opens
    this.page = await this.electronApp.firstWindow();
    
    // Wait for the app to be ready
    await this.page.waitForLoadState('domcontentloaded');

    // Set up console logging
    this.page.on('console', (msg) => console.log(`[ELECTRON]: ${msg.text()}`));

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
   * Sets up data capture to track what data is written to serial ports.
   */
  private setupDataCapture = async () => {
    // Expose a function to capture written data
    await this.page.exposeFunction('captureWrittenData', (data: number) => {
      this.writtenData.push(data);
    });

    // Override the serial write functionality to capture data
    await this.page.addInitScript(() => {
      // Store the original electronAPI functions
      const originalElectronAPI = (window as any).electronAPI;
      
      if (originalElectronAPI && originalElectronAPI.serial) {
        const originalWriteData = originalElectronAPI.serial.writeData;
        
        // Override writeData to capture the data being written
        originalElectronAPI.serial.writeData = async (portPath: string, data: number[]) => {
          // Capture the data for testing
          for (const byte of data) {
            (window as any).captureWrittenData(byte);
          }
          
          // Call the original function (though it might fail since no real port is connected)
          try {
            return await originalWriteData(portPath, data);
          } catch (error) {
            // Return success for testing purposes
            return { success: true };
          }
        };
      }
    });
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

    // For testing, we'll set up a fake port directly through JavaScript
    // This avoids the complex UI interactions that can be flaky
    await this.page.evaluate(() => {
      const app = (window as any).app;
      if (app && app.settings && app.settings.portConfiguration) {
        // Create a fake port
        const fakePort = {
          path: '/dev/ttyTEST',
          manufacturer: 'Test Manufacturer',
          serialNumber: 'TEST123',
          vendorId: '1234',
          productId: '5678',
          friendlyName: 'Test Port'
        };
        
        // Set up the port configuration
        app.settings.portConfiguration.availableSerialPorts = [fakePort];
        app.settings.portConfiguration.setSelectedSerialPort(fakePort);
        
        // Set the port state to opened directly to avoid actual serial communication
        app.portState = 1; // PortState.OPENED
        app.currentPortPath = fakePort.path;
        
        // Set up the serial port info for reconnection
        app.serialPortInfo = fakePort;
      }
    });

    // Wait a moment for the state to settle
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
    // Press Escape to dismiss any tooltips
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(100);
    
    // Wait for element and click
    await this.page.waitForSelector(selector, { timeout: 5000 });
    await this.page.click(selector);
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
      (window as any).app.parseRxData(Uint8Array.from(dataToSend));
    }, textToSend);
  };

  /**
   * Sends byte data to the terminal as if it came from the serial port.
   */
  sendBytesToTerminal = async (bytesToSend: number[]) => {
    await this.page.evaluate((bytesToSend) => {
      (window as any).app.parseRxData(Uint8Array.from(bytesToSend));
    }, bytesToSend);
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

  goToGeneralSettings = async () => {
    await this.dismissTooltipsAndClick('[data-testid="settings-button"]');
    await this.page.waitForTimeout(300);
    await this.dismissTooltipsAndClick('[data-testid="general-settings-button"]');
  };

  goToTerminalView = async () => {
    await this.dismissTooltipsAndClick('[data-testid="show-terminal-button"]');
  };

  enableGraphing = async () => {
    await this.page.getByTestId('show-graphing-pane-button').click();
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