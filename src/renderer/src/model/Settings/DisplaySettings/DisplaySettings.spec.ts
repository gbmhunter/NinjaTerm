import { expect, test, describe, beforeEach } from 'vitest';

import { App } from 'src/model/App';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';
import DisplaySettings, { TERMINAL_FONT_FALLBACK_STACK, TerminalFont } from './DisplaySettings';

describe('display settings', () => {
  let displaySettings: DisplaySettings;
  beforeEach(async () => {
    window.localStorage.clear();
    displaySettings = new DisplaySettings(new AppDataManager(new App()));
  });

  //================================================================================
  // Row padding
  //================================================================================
  test('a vertical row padding of zero is allowed', () => {
    // Reported on issue #411. The bundled DOS fonts need exactly zero to render
    // box-drawing frames without gaps between rows, but the field rejected
    // anything below 1, so it was impossible to set.
    displaySettings.verticalRowPaddingPx.setDispValue('0');
    displaySettings.verticalRowPaddingPx.apply();

    expect(displaySettings.verticalRowPaddingPx.appliedValue).toBe(0);
  });

  test('a negative vertical row padding is still rejected', () => {
    // Rows would overlap and clip. Zero already makes the DOS fonts exact,
    // because their glyphs are precisely one em tall.
    displaySettings.verticalRowPaddingPx.setDispValue('-2');
    displaySettings.verticalRowPaddingPx.apply();

    expect(displaySettings.verticalRowPaddingPx.appliedValue).not.toBe(-2);
  });

  //================================================================================
  // Terminal font
  //================================================================================
  describe('terminal font family', () => {
    test('defaults to the bundled NinjaTerm font', () => {
      expect(displaySettings.terminalFont).toBe(TerminalFont.NINJATERM);
      // NinjaTerm is already the head of the fallback stack, so it is not
      // repeated.
      expect(displaySettings.terminalFontFamily).toBe(TERMINAL_FONT_FALLBACK_STACK);
    });

    test('the chosen font goes in front of the fallback stack', () => {
      displaySettings.setTerminalFont(TerminalFont.IBM_VGA);

      expect(displaySettings.terminalFontFamily).toBe(`WebPlusIBMVGA, ${TERMINAL_FONT_FALLBACK_STACK}`);
    });

    test('the system monospace option does not list a family twice', () => {
      // The system families have to precede NinjaTerm to win for ASCII, and they
      // also appear in the fallback stack, so this option builds its own stack.
      displaySettings.setTerminalFont(TerminalFont.SYSTEM_MONOSPACE);

      const fontFamily = displaySettings.terminalFontFamily;

      expect(fontFamily).toBe('Consolas, Menlo, "DejaVu Sans Mono", NinjaTerm, monospace');
      // No family should appear more than once in the stack.
      const families = fontFamily.split(',').map((family) => family.trim());
      expect(families.length).toBe(new Set(families).size);
    });

    test('each bundled font maps to its @font-face family name', () => {
      // These have to match the font-family names declared by the @font-face
      // rules in SingleTerminalView.module.css.
      displaySettings.setTerminalFont(TerminalFont.PERFECT_DOS_VGA);
      expect(displaySettings.terminalFontFamily).toBe(`PerfectDOSVGA437, ${TERMINAL_FONT_FALLBACK_STACK}`);

      displaySettings.setTerminalFont(TerminalFont.IBM_VGA);
      expect(displaySettings.terminalFontFamily).toBe(`WebPlusIBMVGA, ${TERMINAL_FONT_FALLBACK_STACK}`);
    });

    test('every option keeps NinjaTerm reachable for the private-use glyphs', () => {
      // The control-glyph (U+E000+) and hex-glyph (U+E100+) characters only
      // exist in the NinjaTerm font, so it must never drop out of the stack.
      for (const terminalFont of Object.values(TerminalFont)) {
        displaySettings.setTerminalFont(terminalFont);
        displaySettings.terminalFontCustomName.setDispValue('Perfect DOS VGA 437');
        displaySettings.terminalFontCustomName.apply();

        expect(displaySettings.terminalFontFamily).toContain('NinjaTerm');
        // ...and a generic monospace family stays last, so characters no font
        // covers still render at a fixed width.
        expect(displaySettings.terminalFontFamily.endsWith('monospace')).toBe(true);
      }
    });

    test('a custom font name is quoted so names with spaces stay valid CSS', () => {
      displaySettings.setTerminalFont(TerminalFont.CUSTOM);
      displaySettings.terminalFontCustomName.setDispValue('Perfect DOS VGA 437');
      displaySettings.terminalFontCustomName.apply();

      expect(displaySettings.terminalFontFamily).toBe(
        `"Perfect DOS VGA 437", ${TERMINAL_FONT_FALLBACK_STACK}`
      );
    });

    test('an empty custom font name falls back to the default stack', () => {
      // A blank name would otherwise produce a leading comma and invalidate the
      // whole font-family declaration.
      displaySettings.setTerminalFont(TerminalFont.CUSTOM);
      displaySettings.terminalFontCustomName.setDispValue('   ');
      displaySettings.terminalFontCustomName.apply();

      expect(displaySettings.terminalFontFamily).toBe(TERMINAL_FONT_FALLBACK_STACK);
    });

    test('double quotes are stripped from a custom font name', () => {
      // Otherwise a name containing a quote could break out of the quoted
      // family and inject extra CSS into the declaration.
      displaySettings.setTerminalFont(TerminalFont.CUSTOM);
      displaySettings.terminalFontCustomName.setDispValue('Ac437", monospace; color: red');
      displaySettings.terminalFontCustomName.apply();

      expect(displaySettings.terminalFontFamily).toBe(
        `"Ac437, monospace; color: red", ${TERMINAL_FONT_FALLBACK_STACK}`
      );
    });

    test('the terminal font survives a reload of the settings', () => {
      displaySettings.setTerminalFont(TerminalFont.CUSTOM);
      displaySettings.terminalFontCustomName.setDispValue('Perfect DOS VGA 437');
      displaySettings.terminalFontCustomName.apply();

      const reloaded = new DisplaySettings(new AppDataManager(new App()));

      expect(reloaded.terminalFont).toBe(TerminalFont.CUSTOM);
      expect(reloaded.terminalFontCustomName.appliedValue).toBe('Perfect DOS VGA 437');
    });
  });
});
