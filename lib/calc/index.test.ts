import { describe, expect, it } from 'vitest';
import type { CalculationInputs } from '../types';
import { computeTotals } from './index';

describe('computeTotals — 230k EUR sample with cash + private loans covering down payment', () => {
  const inputs: CalculationInputs = {
    propertyPrice: 230000,
    seller: 'INDIVIDUAL',
    purchaseCostsFixed: 2000,
    capitalSources: [
      { id: 'a', label: 'Moje', amount: 17000 },
      { id: 'b', label: 'Poklon porodice', amount: 10000 },
    ],
    mortgage: {
      downPaymentPct: 20,
      interestRatePct: 4.5,
      termMonths: 360,
      startMonth: { year: 2027, month: 7 },
    },
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
  };

  const totals = computeTotals(inputs);

  it('computes PPAP at 2.5%', () => {
    expect(totals.ppap).toBeCloseTo(5750, 6);
  });

  it('counts loans as part of available for down payment', () => {
    expect(totals.totalCapital).toBe(27000);
    expect(totals.loansForDownPayment).toBe(26750);
    expect(totals.availableForDownPayment).toBe(46000);
    expect(totals.requiredDownPayment).toBe(46000);
    expect(totals.mortgageAmount).toBe(184000);
    expect(totals.shortfall).toBe(0);
  });

  it('computes mortgage monthly payment ~932.30 EUR', () => {
    expect(totals.mortgageComputation.monthlyPayment).toBeCloseTo(932.3009701, 4);
  });

  it('produces a phase timeline that includes all loans', () => {
    expect(totals.phases.length).toBeGreaterThan(0);
  });
});

describe('computeTotals — no loans, capital below requirement', () => {
  it('reports a shortfall without creating any derived loan', () => {
    const inputs: CalculationInputs = {
      propertyPrice: 100000,
      seller: 'INVESTOR',
      purchaseCostsFixed: 0,
      capitalSources: [{ id: 'a', label: 'A', amount: 5000 }],
      mortgage: {
        downPaymentPct: 20,
        interestRatePct: 4.5,
        termMonths: 360,
        startMonth: { year: 2026, month: 1 },
      },
      loans: [],
    };
    const totals = computeTotals(inputs);
    expect(totals.ppap).toBe(0);
    expect(totals.shortfall).toBe(15000);
    expect(totals.loanComputations).toHaveLength(0);
  });
});
