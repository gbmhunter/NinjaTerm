/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from '@playwright/test';

import { ElectronAppTestHarness, ExpectedTerminalChar } from './ElectronUtil';
import './types';

/**
 * End-to-end tests for displaying DOS-style text-mode graphics (issue #411):
 * the character encoding setting that turns received bytes into box-drawing
 * characters, and the terminal font setting that gives them glyphs to draw with.
 *
 * The unit tests cover the decoding itself. What can only be checked with a real
 * renderer is here: that the characters reach the DOM, that the bundled fonts
 * actually load, and that box-drawing characters occupy the same cell width as
 * ASCII (i.e. the character grid holds, which is the whole point of the feature).
 */

// Mirrors START_OF_HEX_GLYPHS in SingleTerminal.ts. Not imported, to keep this
// spec free of app-source imports.
const START_OF_HEX_GLYPHS = 0xe100;

// CP437 box-drawing bytes used to draw the test frames.
const CP437 = {
  TOP_LEFT: 0xda, // ┌
  TOP_RIGHT: 0xbf, // ┐
  BOTTOM_LEFT: 0xc0, // └
  BOTTOM_RIGHT: 0xd9, // ┘
  HORIZONTAL: 0xc4, // ─
  VERTICAL: 0xb3, // │
  FULL_BLOCK: 0xdb, // █
};

let appTestHarness: ElectronAppTestHarness;

test.beforeEach(async () => {
  appTestHarness = new ElectronAppTestHarness();
  await appTestHarness.setupElectronApp();
});

test.afterEach(async () => {
  await appTestHarness.closeElectronApp();
});

/** Converts a string of ASCII to the bytes a device would put on the wire. */
const ascii = (text: string) => Array.from(text, (char) => char.charCodeAt(0));

/**
 * Selects a character encoding using the real radio buttons in RX settings, then
 * returns to the terminal view.
 *
 * @param label The radio label, exactly as it appears in the UI.
 */
const selectCharacterEncoding = async (label: string) => {
  await appTestHarness.goToRxSettings();
  await appTestHarness.page.waitForTimeout(300);
  await appTestHarness.page.getByLabel(label, { exact: true }).click();
  await appTestHarness.page.waitForTimeout(200);
  await appTestHarness.goToTerminalView();
  await appTestHarness.page.waitForSelector('[data-testid="tx-rx-terminal-view"]');
};

/**
 * Selects a terminal font using the real dropdown in display settings, then
 * returns to the terminal view.
 *
 * @param optionName The dropdown option, exactly as it appears in the UI.
 */
const selectTerminalFont = async (optionName: string) => {
  await appTestHarness.goToDisplaySettings();
  await appTestHarness.page.waitForTimeout(500);
  await appTestHarness.page.getByTestId('terminal-font-select').click();
  await appTestHarness.page.getByRole('option', { name: optionName, exact: true }).click();
  await appTestHarness.page.waitForTimeout(200);
  await appTestHarness.goToTerminalView();
  await appTestHarness.page.waitForSelector('[data-testid="tx-rx-terminal-view"]');
};

/**
 * Measures, in the renderer, how wide ten ASCII characters and ten box-drawing
 * characters are when drawn with the font the terminal rows actually resolved to.
 *
 * Uses a canvas rather than the DOM so the two runs are measured under identical
 * conditions; canvas applies the same per-glyph font fallback the DOM does, so a
 * box-drawing character falling back to a different font shows up as a different
 * width.
 */
const measureGlyphWidths = async () =>
  appTestHarness.page.evaluate(async () => {
    await document.fonts.ready;
    const span = document.querySelector('[data-testid="tx-rx-terminal-view"] .terminal-row span');
    if (span === null) {
      throw new Error('Could not find a rendered terminal row span to measure.');
    }
    const computedStyle = window.getComputedStyle(span);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context === null) {
      throw new Error('Could not get a 2d canvas context.');
    }
    context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
    return {
      fontFamily: computedStyle.fontFamily,
      asciiWidth: context.measureText('MMMMMMMMMM').width,
      boxDrawingWidth: context.measureText('──────────').width,
    };
  });

test.describe('text-mode graphics (Electron)', () => {
  test('CP437 bytes are rendered as box-drawing characters', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await selectCharacterEncoding('CP437 (DOS)');

    // The top edge of a DOS frame, as three single bytes on the wire.
    await appTestHarness.sendBytesToTerminal([CP437.TOP_LEFT, CP437.HORIZONTAL, CP437.TOP_RIGHT]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '┌' }),
        new ExpectedTerminalChar({ char: '─' }),
        new ExpectedTerminalChar({ char: '┐' }),
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('with the default encoding the same bytes are rendered as hex glyphs', async () => {
    // Locks in the default: NinjaTerm does not guess an encoding, so a high byte
    // is shown as its value. Existing users see no change.
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.sendBytesToTerminal([CP437.TOP_LEFT]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: String.fromCharCode(START_OF_HEX_GLYPHS + CP437.TOP_LEFT) }),
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('a CP437 frame drawn with cursor positioning lands in the right cells', async () => {
    // The scenario from issue #411 end to end: a device draws a framed box with
    // raw CP437 bytes, then uses CUP (ESC[row;colH) to repaint a field inside it
    // without redrawing the frame.
    await appTestHarness.openPortAndGoToTerminalView();
    await selectCharacterEncoding('CP437 (DOS)');

    // No ESC[2J first: erase-in-display deliberately pads the terminal out with
    // a full screen of blank rows, which shifts the frame away from row 0 and
    // would only make the row indices below harder to read. ED has its own
    // coverage; this test is about where CUP puts the characters.
    await appTestHarness.sendBytesToTerminal([
      ...ascii('\x1B[1;1H'),
      CP437.TOP_LEFT, CP437.HORIZONTAL, CP437.HORIZONTAL, CP437.HORIZONTAL, CP437.TOP_RIGHT,
      ...ascii('\n'),
      CP437.VERTICAL, ...ascii(' hi '), CP437.VERTICAL,
      ...ascii('\n'),
      CP437.BOTTOM_LEFT, CP437.HORIZONTAL, CP437.HORIZONTAL, CP437.HORIZONTAL, CP437.BOTTOM_RIGHT,
      // Jump back inside the frame and overwrite the 'h'.
      ...ascii('\x1B[2;3H'), CP437.FULL_BLOCK,
    ]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '┌' }),
        new ExpectedTerminalChar({ char: '─' }),
        new ExpectedTerminalChar({ char: '─' }),
        new ExpectedTerminalChar({ char: '─' }),
        new ExpectedTerminalChar({ char: '┐' }),
      ],
      [
        new ExpectedTerminalChar({ char: '│' }),
        new ExpectedTerminalChar({ char: ' ' }),
        new ExpectedTerminalChar({ char: '█' }),
        new ExpectedTerminalChar({ char: 'i' }),
        new ExpectedTerminalChar({ char: ' ' }),
        new ExpectedTerminalChar({ char: '│' }),
      ],
      [
        new ExpectedTerminalChar({ char: '└' }),
        new ExpectedTerminalChar({ char: '─' }),
        new ExpectedTerminalChar({ char: '─' }),
        new ExpectedTerminalChar({ char: '─' }),
        new ExpectedTerminalChar({ char: '┘' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('UTF-8 mode decodes multi-byte box-drawing characters', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await selectCharacterEncoding('UTF-8');

    // Each of these is three bytes on the wire.
    await appTestHarness.sendBytesToTerminal(Array.from(new TextEncoder().encode('┌─┐')));

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '┌' }),
        new ExpectedTerminalChar({ char: '─' }),
        new ExpectedTerminalChar({ char: '┐' }),
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('a UTF-8 character split across two reads from the port is still decoded', async () => {
    // Serial data arrives in arbitrary chunks, so a multi-byte character can be
    // split across two reads. Each send here is a separate read.
    await appTestHarness.openPortAndGoToTerminalView();
    await selectCharacterEncoding('UTF-8');

    const bytes = Array.from(new TextEncoder().encode('┌'));
    await appTestHarness.sendBytesToTerminal(bytes.slice(0, 1));
    await appTestHarness.sendBytesToTerminal(bytes.slice(1));

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [new ExpectedTerminalChar({ char: '┌' }), new ExpectedTerminalChar({ char: ' ' })],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('the bundled fonts are available to the renderer', async () => {
    // Guards the @font-face URLs surviving the bundler: if an asset path breaks,
    // the family matches no font face and the terminal silently falls back.
    await appTestHarness.openPortAndGoToTerminalView();

    const numFontFacesPerFamily = await appTestHarness.page.evaluate(async () => {
      const results: { [family: string]: number } = {};
      const families = ['NinjaTerm', 'WebPlusIBMVGA', 'PerfectDOSVGA437', 'AFamilyThatDoesNotExist'];
      for (const family of families) {
        // load() resolves to the font faces that matched the family, so an empty
        // result means no @font-face rule declares it. check() is no use here —
        // it returns true for a missing family because fallback fonts are ready.
        const fontFaces = await document.fonts.load(`16px "${family}"`, 'A─');
        results[family] = fontFaces.length;
      }
      return results;
    });

    expect(numFontFacesPerFamily['NinjaTerm']).toBeGreaterThan(0);
    expect(numFontFacesPerFamily['WebPlusIBMVGA']).toBeGreaterThan(0);
    expect(numFontFacesPerFamily['PerfectDOSVGA437']).toBeGreaterThan(0);
    // Control: proves the check above can actually fail.
    expect(numFontFacesPerFamily['AFamilyThatDoesNotExist']).toBe(0);
  });

  test('selecting a terminal font applies it to the rendered rows', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('hello');
    await selectTerminalFont('IBM VGA (DOS/CP437)');

    const { fontFamily } = await measureGlyphWidths();

    // The chosen font wins, but NinjaTerm stays in the stack (it is the only
    // source of the private-use control and hex glyphs) and a generic monospace
    // family stays last.
    expect(fontFamily).toContain('WebPlusIBMVGA');
    expect(fontFamily).toContain('NinjaTerm');
    expect(fontFamily.indexOf('WebPlusIBMVGA')).toBeLessThan(fontFamily.indexOf('NinjaTerm'));
    expect(fontFamily.endsWith('monospace')).toBe(true);
  });

  for (const fontOption of ['IBM VGA (DOS/CP437)', 'Perfect DOS VGA 437']) {
    test(`box-drawing characters are the same cell width as ASCII with "${fontOption}"`, async () => {
      // The character grid only holds if box-drawing characters are drawn at the
      // same advance width as ASCII. Both fonts cover the CP437 box-drawing
      // range, so the two measurements must come from the same font and match.
      await appTestHarness.openPortAndGoToTerminalView();
      await appTestHarness.sendTextToTerminal('hello');
      await selectTerminalFont(fontOption);

      const { asciiWidth, boxDrawingWidth } = await measureGlyphWidths();

      expect(asciiWidth).toBeGreaterThan(0);
      expect(boxDrawingWidth).toBeCloseTo(asciiWidth, 1);
    });
  }
});
