import { nanoid } from 'nanoid';
import type {
  Calculation,
  CalculationInputs,
  IncomeSource,
  Loan,
  LoanType,
  MonthYear,
} from './types';

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

export function defaultLoanLabel(type: LoanType): string {
  switch (type) {
    case 'CASH_LOAN':
      return 'Keš kredit';
    case 'PRIVATE_LOAN':
      return 'Pozajmica';
  }
}

export function createDefaultLoan(type: LoanType = 'PRIVATE_LOAN', now: Date = new Date()): Loan {
  return {
    id: nanoid(8),
    type,
    label: defaultLoanLabel(type),
    amount: 0,
    interestRatePct: defaultInterestRateForLoanType(type),
    startMonth: currentMonthYear(now),
    termMonths: 24,
  };
}

export function createDefaultIncomeSource(now: Date = new Date()): IncomeSource {
  return {
    id: nanoid(8),
    label: 'Kirija od stana',
    monthlyAmount: 0,
    startMonth: currentMonthYear(now),
  };
}
