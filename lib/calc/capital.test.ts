import { describe, expect, it } from 'vitest';
import { allocateCapital, sumCapital, sumLoansForDownPayment } from './capital';

describe('sumCapital', () => {
  it('sums amounts', () => {
    expect(
      sumCapital([
        { id: 'a', label: 'A', amount: 17000 },
        { id: 'b', label: 'B', amount: 10000 },
        { id: 'c', label: 'C', amount: 7000 },
      ]),
    ).toBe(34000);
  });
});

describe('sumLoansForDownPayment', () => {
  it('sums loan amounts (cash + private)', () => {
    expect(
      sumLoansForDownPayment([
        {
          id: 'a',
          type: 'CASH_LOAN',
          label: 'Keš',
          amount: 19750,
          interestRatePct: 10,
          startMonth: { year: 2026, month: 7 },
          termMonths: 71,
        },
        {
          id: 'b',
          type: 'PRIVATE_LOAN',
          label: 'Pozajmica',
          amount: 7000,
          interestRatePct: 0,
          startMonth: { year: 2026, month: 7 },
          termMonths: 24,
        },
      ]),
    ).toBe(26750);
  });
});

describe('allocateCapital', () => {
  it('matches the spreadsheet 230k EUR sample with cash loan covering shortfall', () => {
    const result = allocateCapital({
      propertyPrice: 230000,
      capitalSources: [
        { id: 'a', label: 'Moje', amount: 17000 },
        { id: 'b', label: 'Poklon porodice', amount: 10000 },
      ],
      loans: [
        {
          id: 'cash',
          type: 'CASH_LOAN',
          label: 'Keš kredit',
          amount: 19750,
          interestRatePct: 10,
          startMonth: { year: 2026, month: 7 },
          termMonths: 71,
        },
        {
          id: 'friend',
          type: 'PRIVATE_LOAN',
          label: 'Pozajmica prijatelja',
          amount: 7000,
          interestRatePct: 0,
          startMonth: { year: 2026, month: 7 },
          termMonths: 24,
        },
      ],
      purchaseCostsFixed: 2000,
      ppap: 5750,
      downPaymentPct: 20,
    });
    expect(result.totalCapital).toBe(27000);
    expect(result.loansForDownPayment).toBe(26750);
    expect(result.availableForDownPayment).toBe(46000);
    expect(result.requiredDownPayment).toBe(46000);
    expect(result.mortgageAmount).toBe(184000);
    expect(result.shortfall).toBe(0);
  });

  it('reports shortfall when capital + loans do not cover the down payment', () => {
    const result = allocateCapital({
      propertyPrice: 100000,
      capitalSources: [{ id: 'a', label: 'A', amount: 5000 }],
      loans: [],
      purchaseCostsFixed: 0,
      ppap: 0,
      downPaymentPct: 20,
    });
    expect(result.shortfall).toBe(15000);
    expect(result.mortgageAmount).toBe(80000);
  });
});
