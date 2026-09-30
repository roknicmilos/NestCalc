import type { Locale } from './i18n';
import type { MonthYear } from './types';

const INTL_LOCALE: Record<Locale, string> = { sr: 'sr-Latn-RS', en: 'en-GB' };

const eurFormatters = new Map<Locale, Intl.NumberFormat>();
const rsdFormatters = new Map<Locale, Intl.NumberFormat>();
const monthYearFormatters = new Map<Locale, Intl.DateTimeFormat>();

function cached<T>(cache: Map<Locale, T>, locale: Locale, create: () => T): T {
  let value = cache.get(locale);
  if (!value) {
    value = create();
    cache.set(locale, value);
  }
  return value;
}

export function formatEur(locale: Locale, value: number): string {
  if (!Number.isFinite(value)) return '—';
  return cached(
    eurFormatters,
    locale,
    () =>
      new Intl.NumberFormat(INTL_LOCALE[locale], {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }),
  ).format(value);
}

/** Format an EUR amount as its RSD equivalent using the given EUR→RSD rate. */
export function formatRsd(locale: Locale, eurValue: number, eurToRsdRate: number): string {
  if (!Number.isFinite(eurValue) || !Number.isFinite(eurToRsdRate)) return '—';
  return cached(
    rsdFormatters,
    locale,
    () =>
      new Intl.NumberFormat(INTL_LOCALE[locale], {
        style: 'currency',
        currency: 'RSD',
        maximumFractionDigits: 0,
      }),
  ).format(eurValue * eurToRsdRate);
}

export function formatMonthYear(locale: Locale, my: MonthYear): string {
  const d = new Date(Date.UTC(my.year, my.month - 1, 1));
  return cached(
    monthYearFormatters,
    locale,
    () => new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: 'long', year: 'numeric' }),
  ).format(d);
}

export function formatMonthsAsYearsAndMonths(locale: Locale, months: number): string {
  if (months < 12) return `${months} ${monthsWord(locale, months)}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} ${yearsWord(locale, years)}`;
  return `${years} ${yearsWord(locale, years)} ${rem} ${monthsWord(locale, rem)}`;
}

/** Serbian plural forms: one / few (2-4, not 12-14) / many. */
function serbianForm(n: number): 'one' | 'few' | 'many' {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'one';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'few';
  return 'many';
}

const YEAR_WORDS = { one: 'godina', few: 'godine', many: 'godina' } as const;
const MONTH_WORDS = { one: 'mesec', few: 'meseca', many: 'meseci' } as const;

function yearsWord(locale: Locale, n: number): string {
  if (locale === 'en') return n === 1 ? 'year' : 'years';
  return YEAR_WORDS[serbianForm(n)];
}

function monthsWord(locale: Locale, n: number): string {
  if (locale === 'en') return n === 1 ? 'month' : 'months';
  return MONTH_WORDS[serbianForm(n)];
}

/** Convert a MonthYear to an `<input type="month">` value, "YYYY-MM". */
export function monthYearToInputValue(my: MonthYear): string {
  const mm = String(my.month).padStart(2, '0');
  return `${my.year}-${mm}`;
}

/** Parse an `<input type="month">` value back to MonthYear. Returns null when malformed. */
export function inputValueToMonthYear(value: string): MonthYear | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}
