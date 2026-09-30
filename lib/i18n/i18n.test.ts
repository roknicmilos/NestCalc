import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, getDictionary, isLocale, LOCALES } from './index';

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => flattenKeys(v, prefix ? `${prefix}.${k}` : k));
}

function flattenValues(obj: unknown): string[] {
  if (typeof obj === 'function') return [String(obj)];
  if (typeof obj !== 'object' || obj === null) return [String(obj)];
  return Object.values(obj).flatMap(flattenValues);
}

describe('i18n', () => {
  it('recognises only supported locales', () => {
    expect(isLocale('sr')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('defaults to Serbian', () => {
    expect(DEFAULT_LOCALE).toBe('sr');
  });

  it('has identical key sets in every dictionary', () => {
    const base = flattenKeys(getDictionary('sr')).sort();
    for (const locale of LOCALES) {
      expect(flattenKeys(getDictionary(locale)).sort()).toEqual(base);
    }
  });

  it('has no Serbian diacritics in English strings (untranslated leftovers)', () => {
    const offenders = flattenValues(getDictionary('en')).filter((v) => /[šđčćžŠĐČĆŽ]/.test(v));
    expect(offenders).toEqual([]);
  });
});
