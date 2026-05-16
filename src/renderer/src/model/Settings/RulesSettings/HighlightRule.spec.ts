import { describe, expect, test } from 'vitest';

import { HighlightRule } from './HighlightRule';
import { HighlightRuleSound } from 'src/model/AppDataManager/DataClasses/HighlightRuleData';

describe('HighlightRule', () => {
  test('empty pattern → compiledRegex null, no error', () => {
    const rule = new HighlightRule();
    expect(rule.compiledRegex).toBeNull();
    expect(rule.errorMsg).toBe('');
  });

  test('valid pattern compiles with case-insensitive default', () => {
    const rule = new HighlightRule();
    rule.setPattern('error');
    const re = rule.compiledRegex;
    expect(re).not.toBeNull();
    expect(re!.flags).toContain('g');
    expect(re!.flags).toContain('i');
    expect(rule.errorMsg).toBe('');
  });

  test('case-sensitive toggle drops the i flag', () => {
    const rule = new HighlightRule();
    rule.setPattern('error');
    rule.setCaseSensitive(true);
    expect(rule.compiledRegex!.flags).not.toContain('i');
  });

  test('invalid pattern sets errorMsg and compiledRegex stays null', () => {
    const rule = new HighlightRule();
    rule.setPattern('[unclosed');
    expect(rule.compiledRegex).toBeNull();
    expect(rule.errorMsg).not.toBe('');
  });

  test('changing pattern back to valid clears errorMsg', () => {
    const rule = new HighlightRule();
    rule.setPattern('[bad');
    expect(rule.errorMsg).not.toBe('');
    rule.setPattern('good');
    expect(rule.compiledRegex).not.toBeNull();
    expect(rule.errorMsg).toBe('');
  });

  test('setters fire onChange callback for persistence', () => {
    let calls = 0;
    const rule = new HighlightRule(() => {
      calls += 1;
    });
    rule.setName('n');
    rule.setEnabled(false);
    rule.setPattern('p');
    rule.setCaseSensitive(true);
    rule.setBackgroundColor('#abcdef');
    rule.setSound(HighlightRuleSound.BUZZER);
    expect(calls).toBe(6);
  });

  test('toConfig round-trips through loadConfig', () => {
    const original = new HighlightRule();
    original.setName('errs');
    original.setPattern('ERR\\d+');
    original.setCaseSensitive(true);
    original.setBackgroundColor('#ff0000');
    original.setSound(HighlightRuleSound.BUZZER);
    original.setEnabled(false);

    const cfg = original.toConfig();
    const restored = new HighlightRule();
    restored.loadConfig(cfg);

    expect(restored.name).toBe('errs');
    expect(restored.pattern).toBe('ERR\\d+');
    expect(restored.caseSensitive).toBe(true);
    expect(restored.backgroundColor).toBe('#ff0000');
    expect(restored.sound).toBe(HighlightRuleSound.BUZZER);
    expect(restored.enabled).toBe(false);
  });
});
