import { nanoid } from 'nanoid';
import { getDictionary, LOCALES, type Dictionary } from './i18n';
import type { Loan, LoanType, MonthYear } from './types';

/** Default EUR→RSD rate; overridable per calculation in the UI. */
export const DEFAULT_EUR_TO_RSD_RATE = 117.5;

export function currentMonthYear(now: Date = new Date()): MonthYear {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function addMonthsToMonthYear(my: MonthYear, months: number): MonthYear {
  const index = my.year * 12 + (my.month - 1) + months;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function defaultInterestRateForLoanType(type: LoanType): number {
  switch (type) {
    case 'CASH_LOAN':
      return 10;
    case 'PRIVATE_LOAN':
      return 0;
  }
}

export function defaultLoanLabel(type: LoanType, t: Dictionary): string {
  switch (type) {
    case 'CASH_LOAN':
      return t.defaults.cashLoan;
    case 'PRIVATE_LOAN':
      return t.defaults.privateLoan;
  }
}

/** True when `label` is the untouched default label for `type` in any locale. */
export function isDefaultLoanLabel(label: string, type: LoanType): boolean {
  return LOCALES.some((l) => defaultLoanLabel(type, getDictionary(l)) === label);
}

export function createDefaultLoan(
  t: Dictionary,
  type: LoanType = 'PRIVATE_LOAN',
  now: Date = new Date(),
): Loan {
  return {
    id: nanoid(8),
    type,
    label: defaultLoanLabel(type, t),
    amount: 0,
    interestRatePct: defaultInterestRateForLoanType(type),
    startMonth: currentMonthYear(now),
    termMonths: 24,
  };
}
