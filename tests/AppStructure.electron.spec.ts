import { test, expect } from '@playwright/test';
import { ElectronAppTestHarness } from './ElectronUtil';

let appTestHarness: ElectronAppTestHarness;

test.beforeAll(async () => {
  appTestHarness = new ElectronAppTestHarness();
  await appTestHarness.setupElectronApp();
});

test.afterAll(async () => {
  await appTestHarness.closeElectronApp();
});

test.describe('App Structure Diagnostics (Electron)', () => {

  test('should show app structure and available elements', async () => {
    // Listen for any JavaScript errors
    appTestHarness.page.on('pageerror', (error) => {
      console.error('JavaScript error:', error.message);
    });
    
    // Wait a bit longer for the app to fully load
    await appTestHarness.page.waitForTimeout(5000);
    
    // Wait for the app instance to be available
    await appTestHarness.page.waitForFunction(() => {
      return typeof (window as any).app !== 'undefined';
    }, { timeout: 10000 });
    
    // Take a screenshot to see what's actually displayed
    await appTestHarness.page.screenshot({ path: 'test-results/app-structure.png', fullPage: true });
    
    // Get the page title
    const title = await appTestHarness.page.title();
    console.log('Page title:', title);
    
    // Get all elements with test IDs
    const testIds = await appTestHarness.page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid]');
      return Array.from(elements).map(el => ({
        testId: el.getAttribute('data-testid'),
        tagName: el.tagName,
        text: el.textContent?.slice(0, 50) || '',
        visible: el.offsetWidth > 0 && el.offsetHeight > 0
      }));
    });
    
    console.log('Available test IDs:', JSON.stringify(testIds, null, 2));
    
    // Check if we have any buttons
    const buttons = await appTestHarness.page.locator('button').count();
    console.log('Number of buttons found:', buttons);
    
    // Check if we have the main app container
    const hasApp = await appTestHarness.page.locator('#root').isVisible().catch(() => false);
    console.log('Has #root element:', hasApp);
    
    // Check body content
    const bodyText = await appTestHarness.page.locator('body').textContent();
    console.log('Body text (first 200 chars):', bodyText?.slice(0, 200));
    
    // List all clickable elements
    const clickableElements = await appTestHarness.page.evaluate(() => {
      const clickable = document.querySelectorAll('button, [role="button"], [onclick], a, input[type="button"], input[type="submit"]');
      return Array.from(clickable).map(el => ({
        tagName: el.tagName,
        text: el.textContent?.slice(0, 30) || '',
        className: el.className,
        id: el.id,
        testId: el.getAttribute('data-testid'),
        visible: el.offsetWidth > 0 && el.offsetHeight > 0
      }));
    });
    
    console.log('Clickable elements:', JSON.stringify(clickableElements, null, 2));
    
    // This test always passes - it's just for diagnostics
    expect(true).toBe(true);
  });

  test('should have electron APIs available', async () => {
    // Check that the electron APIs are exposed
    const hasElectronAPI = await appTestHarness.page.evaluate(() => {
      return typeof (window as any).electronAPI !== 'undefined';
    });
    
    expect(hasElectronAPI).toBe(true);
    
    // Check what APIs are available
    const availableAPIs = await appTestHarness.page.evaluate(() => {
      const electronAPI = (window as any).electronAPI;
      if (!electronAPI) return {};
      
      return {
        hasSerial: typeof electronAPI.serial !== 'undefined',
        hasFs: typeof electronAPI.fs !== 'undefined',
        serialMethods: electronAPI.serial ? Object.keys(electronAPI.serial) : [],
        fsMethods: electronAPI.fs ? Object.keys(electronAPI.fs) : []
      };
    });
    
    console.log('Available Electron APIs:', JSON.stringify(availableAPIs, null, 2));
    
    expect(availableAPIs.hasSerial).toBe(true);
    expect(availableAPIs.hasFs).toBe(true);
  });

});