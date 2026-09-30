import { describe, expect, it } from 'vitest';
import {
  formatEur,
  formatMonthsAsYearsAndMonths,
  formatMonthYear,
  inputValueToMonthYear,
  monthYearToInputValue,
} from './format';

describe('formatMonthsAsYearsAndMonths', () => {
  it.each([
    [1, '1 mesec'],
    [2, '2 meseca'],
    [5, '5 meseci'],
    [11, '11 meseci'],
    [12, '1 godina'],
    [13, '1 godina 1 mesec'],
    [25, '2 godine 1 mesec'],
  ])('sr %i months', (n, expected) => {
    expect(formatMonthsAsYearsAndMonths('sr', n)).toBe(expected);
  });

  it.each([
    [1, '1 month'],
    [2, '2 months'],
    [12, '1 year'],
    [13, '1 year 1 month'],
    [25, '2 years 1 month'],
  ])('en %i months', (n, expected) => {
    expect(formatMonthsAsYearsAndMonths('en', n)).toBe(expected);
  });
});

describe('formatEur', () => {
  it('returns a dash for non-finite values in every locale', () => {
    expect(formatEur('en', NaN)).toBe('—');
    expect(formatEur('sr', Infinity)).toBe('—');
  });
});

describe('formatMonthYear', () => {
  it('uses the English month name for en', () => {
    const out = formatMonthYear('en', { year: 2027, month: 3 });
    expect(out).toContain('March');
    expect(out).toContain('2027');
  });
});

describe('month input helpers', () => {
  it('round-trips', () => {
    const my = { year: 2027, month: 3 };
    expect(inputValueToMonthYear(monthYearToInputValue(my))).toEqual(my);
    expect(inputValueToMonthYear('2027-13')).toBeNull();
  });
});
