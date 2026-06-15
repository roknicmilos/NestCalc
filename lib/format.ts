import type { MonthYear } from './types';

const eurFormatter = new Intl.NumberFormat('sr-Latn-RS', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

const rsdFormatter = new Intl.NumberFormat('sr-Latn-RS', {
  style: 'currency',
  currency: 'RSD',
  maximumFractionDigits: 0,
});

const monthYearFormatter = new Intl.DateTimeFormat('sr-Latn-RS', {
  month: 'long',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('sr-Latn-RS', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatEur(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return eurFormatter.format(value);
}

/** Format an EUR amount as its RSD equivalent using the given EUR→RSD rate. */
export function formatRsd(eurValue: number, eurToRsdRate: number): string {
  if (!Number.isFinite(eurValue) || !Number.isFinite(eurToRsdRate)) return '—';
  return rsdFormatter.format(eurValue * eurToRsdRate);
}

export function formatMonthYear(my: MonthYear): string {
  const d = new Date(Date.UTC(my.year, my.month - 1, 1));
  return monthYearFormatter.format(d);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return dateTimeFormatter.format(d);
}

export function formatMonthsAsYearsAndMonths(months: number): string {
  if (months < 12) return `${months} ${monthsWord(months)}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} ${yearsWord(years)}`;
  return `${years} ${yearsWord(years)} ${rem} ${monthsWord(rem)}`;
}

function yearsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'godina';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'godine';
  return 'godina';
}

function monthsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'mesec';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'meseca';
  return 'meseci';
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
