import { nanoid } from 'nanoid';
import type {
  Calculation,
  CalculationInputs,
  Loan,
  LoanType,
  MonthYear,
} from './types';

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

export function createDefaultCalculationInputs(now: Date = new Date()): CalculationInputs {
  const mortgageStart = addMonthsToMonthYear(currentMonthYear(now), 12);
  return {
    propertyPrice: 0,
    seller: 'INDIVIDUAL',
    purchaseCostsFixed: 0,
    capitalSources: [{ id: nanoid(8), label: 'Ušteđevina', amount: 0 }],
    mortgage: {
      downPaymentPct: 20,
      interestRatePct: 4.5,
      termMonths: 360,
      startMonth: mortgageStart,
    },
    loans: [],
  };
}

export function createDefaultCalculation(name: string, now: Date = new Date()): Calculation {
  const iso = now.toISOString();
  return {
    id: nanoid(10),
    name: name.trim(),
    createdAt: iso,
    updatedAt: iso,
    inputs: createDefaultCalculationInputs(now),
  };
}
