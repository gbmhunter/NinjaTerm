import { expect, test, describe } from 'vitest';

import { TerminalFilter } from './TerminalFilter';

describe('TerminalFilter.matches', () => {
  test('empty pattern never matches', () => {
    const filter = new TerminalFilter();
    expect(filter.matches('anything')).toBe(false);
    expect(filter.matches('')).toBe(false);
  });

  test('substring match is case-insensitive by default', () => {
    const filter = new TerminalFilter();
    filter.setPattern('temp');
    expect(filter.matches('SENSOR TEMP=21')).toBe(true);
    expect(filter.matches('temperature')).toBe(true);
    expect(filter.matches('humidity')).toBe(false);
  });

  test('substring match respects case-sensitivity when enabled', () => {
    const filter = new TerminalFilter();
    filter.setPattern('TEMP');
    filter.setCaseSensitive(true);
    expect(filter.matches('SENSOR TEMP=21')).toBe(true);
    expect(filter.matches('sensor temp=21')).toBe(false);
  });

  test('regex match works and is case-insensitive by default', () => {
    const filter = new TerminalFilter();
    filter.setPattern('err\\d+');
    filter.setUseRegex(true);
    expect(filter.isValid).toBe(true);
    expect(filter.matches('ERR42 occurred')).toBe(true);
    expect(filter.matches('error without number')).toBe(false);
  });

  test('regex match respects case-sensitivity when enabled', () => {
    const filter = new TerminalFilter();
    filter.setPattern('ERR\\d+');
    filter.setUseRegex(true);
    filter.setCaseSensitive(true);
    expect(filter.matches('ERR42')).toBe(true);
    expect(filter.matches('err42')).toBe(false);
  });

  test('invalid regex is reported and never matches', () => {
    const filter = new TerminalFilter();
    filter.setPattern('([unclosed');
    filter.setUseRegex(true);
    expect(filter.isValid).toBe(false);
    expect(filter.errorMsg).not.toBe('');
    expect(filter.matches('([unclosed group')).toBe(false);
  });

  test('a pattern with regex metacharacters is treated literally in substring mode', () => {
    const filter = new TerminalFilter();
    filter.setPattern('a.b');
    // Substring mode: '.' is literal, so 'axb' must NOT match.
    expect(filter.matches('axb')).toBe(false);
    expect(filter.matches('a.b')).toBe(true);
  });

  test('toggling regex off clears a previous compile error', () => {
    const filter = new TerminalFilter();
    filter.setPattern('([bad');
    filter.setUseRegex(true);
    expect(filter.errorMsg).not.toBe('');
    filter.setUseRegex(false);
    expect(filter.errorMsg).toBe('');
    expect(filter.isValid).toBe(true);
  });

  test('toConfig / loadConfig round-trips the fields', () => {
    const filter = new TerminalFilter();
    filter.setPattern('foo');
    filter.setUseRegex(true);
    filter.setCaseSensitive(true);
    filter.setEnabled(false);

    const cfg = filter.toConfig();
    expect(cfg.pattern).toBe('foo');
    expect(cfg.useRegex).toBe(true);
    expect(cfg.caseSensitive).toBe(true);
    expect(cfg.enabled).toBe(false);

    const loaded = new TerminalFilter();
    loaded.loadConfig(cfg);
    expect(loaded.pattern).toBe('foo');
    expect(loaded.useRegex).toBe(true);
    expect(loaded.caseSensitive).toBe(true);
    expect(loaded.enabled).toBe(false);
  });
});
