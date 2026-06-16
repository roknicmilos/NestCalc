import { describe, expect, it } from 'vitest';
import type { CalculationInputs } from '../types';
import { computeTotals } from './index';

describe('computeTotals — 230k EUR sample with cash + private loans covering down payment', () => {
  const inputs: CalculationInputs = {
    propertyPrice: 230000,
    propertyType: 'APARTMENT',
    squareMeters: 0,
    link: '',
    address: { area: '', street: '' },
    seller: 'INDIVIDUAL',
    ppapTiming: 'NOW',
    purchaseCostsFixed: 2000,
    eurToRsdRate: 117.5,
    extras: [],
    incomeSources: [],
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

describe('computeTotals — PPAP deferred to property readiness', () => {
  const base: CalculationInputs = {
    propertyPrice: 230000,
    propertyType: 'APARTMENT',
    squareMeters: 0,
    link: '',
    address: { area: '', street: '' },
    seller: 'INDIVIDUAL',
    ppapTiming: 'LATER',
    purchaseCostsFixed: 2000,
    eurToRsdRate: 117.5,
    extras: [],
    incomeSources: [],
    capitalSources: [{ id: 'a', label: 'Moje', amount: 48000 }],
    mortgage: {
      downPaymentPct: 20,
      interestRatePct: 4.5,
      termMonths: 360,
      startMonth: { year: 2027, month: 7 },
    },
    loans: [],
  };

  it('still reports the PPAP amount but keeps it out of money to prepare now', () => {
    const totals = computeTotals(base);
    expect(totals.ppap).toBeCloseTo(5750, 6);
    // 48000 capital - 2000 fixed costs, with PPAP NOT subtracted (it is deferred).
    expect(totals.availableForDownPayment).toBeCloseTo(46000, 6);
    expect(totals.requiredDownPayment).toBe(46000);
    expect(totals.shortfall).toBe(0);
  });

  it('marks the PPAP due month as the mortgage start month', () => {
    const totals = computeTotals(base);
    expect(totals.ppapTiming).toBe('LATER');
    expect(totals.ppapDueMonth).toEqual({ year: 2027, month: 7 });
  });

  it('spreads the deferred PPAP into a monthly saving from now until due', () => {
    // "Now" = July 2026, due July 2027 → 12 months to save; 5750 / 12 ≈ 479.17.
    const now = new Date(2026, 6, 1);
    const totals = computeTotals(base, now);
    expect(totals.ppapSavingMonths).toBe(12);
    expect(totals.ppapMonthlySaving).toBeCloseTo(5750 / 12, 6);
  });

  it('adds the PPAP saving as a component in the repayment phases', () => {
    const now = new Date(2026, 6, 1);
    const totals = computeTotals(base, now);
    const hasSaving = totals.phases.some((phase) =>
      phase.components.some((c) => c.loanId === 'ppap-savings'),
    );
    expect(hasSaving).toBe(true);
  });

  it('spreads the saving from the configured ppapSavingStartMonth, not "now"', () => {
    // Saving starts Jan 2027, due July 2027 → 6 months; "now" is ignored for the start.
    const now = new Date(2026, 6, 1);
    const totals = computeTotals(
      { ...base, ppapSavingStartMonth: { year: 2027, month: 1 } },
      now,
    );
    expect(totals.ppapSavingMonths).toBe(6);
    expect(totals.ppapMonthlySaving).toBeCloseTo(5750 / 6, 6);
  });

  it('has no due month or saving when PPAP is paid now', () => {
    const totals = computeTotals({ ...base, ppapTiming: 'NOW' });
    // Paying now eats into available capital: 48000 - 2000 - 5750 = 40250.
    expect(totals.availableForDownPayment).toBeCloseTo(40250, 6);
    expect(totals.ppapDueMonth).toBeNull();
    expect(totals.ppapMonthlySaving).toBeNull();
  });
});

describe('computeTotals — no loans, capital below requirement', () => {
  it('reports a shortfall without creating any derived loan', () => {
    const inputs: CalculationInputs = {
      propertyPrice: 100000,
      propertyType: 'APARTMENT',
      squareMeters: 0,
      link: '',
      address: { area: '', street: '' },
      seller: 'INVESTOR',
      ppapTiming: 'NOW',
      purchaseCostsFixed: 0,
      eurToRsdRate: 117.5,
      extras: [],
      incomeSources: [],
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
