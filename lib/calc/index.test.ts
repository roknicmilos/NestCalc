import { describe, expect, it } from 'vitest';
import type { CalculationInputs } from '../types';
import { computeTotals } from './index';

describe('computeTotals — 230k EUR sample with cash + private loans covering down payment', () => {
  const inputs: CalculationInputs = {
    propertyPrice: 230000,
    propertyType: 'Apartment',
    squareMeters: 0,
    link: '',
    address: { area: '', street: '' },
    seller: 'INDIVIDUAL',
    ppapTiming: 'NOW',
    purchaseCosts: { preliminaryContract: 1000, principalContract: 1000 },
    eurToRsdRate: 117.5,
    furnishing: [],
    mortgage: {
      downPaymentPct: 20,
      dayCount: 'STANDARD',
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

  it('computes purchase costs, the required down payment and the mortgage amount', () => {
    expect(totals.purchaseCosts).toBe(2000);
    expect(totals.requiredDownPayment).toBe(46000);
    expect(totals.mortgageAmount).toBe(184000);
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
    propertyType: 'Apartment',
    squareMeters: 0,
    link: '',
    address: { area: '', street: '' },
    seller: 'INDIVIDUAL',
    ppapTiming: 'LATER',
    purchaseCosts: { preliminaryContract: 1000, principalContract: 1000 },
    eurToRsdRate: 117.5,
    furnishing: [],
    mortgage: {
      downPaymentPct: 20,
      dayCount: 'STANDARD',
      interestRatePct: 4.5,
      termMonths: 360,
      startMonth: { year: 2027, month: 7 },
    },
    loans: [],
  };

  it('still reports the PPAP amount', () => {
    const totals = computeTotals(base);
    expect(totals.ppap).toBeCloseTo(5750, 6);
    expect(totals.requiredDownPayment).toBe(46000);
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
    const totals = computeTotals({ ...base, ppapSavingStartMonth: { year: 2027, month: 1 } }, now);
    expect(totals.ppapSavingMonths).toBe(6);
    expect(totals.ppapMonthlySaving).toBeCloseTo(5750 / 6, 6);
  });

  it('has no due month or saving when PPAP is paid now', () => {
    const totals = computeTotals({ ...base, ppapTiming: 'NOW' });
    expect(totals.ppapDueMonth).toBeNull();
    expect(totals.ppapMonthlySaving).toBeNull();
  });
});

describe('computeTotals — no loans', () => {
  it('creates no loan computations', () => {
    const inputs: CalculationInputs = {
      propertyPrice: 100000,
      propertyType: 'Apartment',
      squareMeters: 0,
      link: '',
      address: { area: '', street: '' },
      seller: 'INVESTOR',
      ppapTiming: 'NOW',
      purchaseCosts: { preliminaryContract: 0, principalContract: 0 },
      eurToRsdRate: 117.5,
      furnishing: [],
      mortgage: {
        downPaymentPct: 20,
        dayCount: 'STANDARD',
        interestRatePct: 4.5,
        termMonths: 360,
        startMonth: { year: 2026, month: 1 },
      },
      loans: [],
    };
    const totals = computeTotals(inputs);
    expect(totals.ppap).toBe(0);
    expect(totals.mortgageAmount).toBe(80000);
    expect(totals.loanComputations).toHaveLength(0);
  });
});

describe('computeTotals — total cost and total debt', () => {
  const inputs: CalculationInputs = {
    propertyPrice: 100000,
    propertyType: 'Apartment',
    squareMeters: 0,
    link: '',
    address: { area: '', street: '' },
    seller: 'INVESTOR',
    ppapTiming: 'NOW',
    purchaseCosts: { preliminaryContract: 500, principalContract: 500 },
    eurToRsdRate: 117.5,
    furnishing: [],
    mortgage: {
      downPaymentPct: 20,
      dayCount: 'STANDARD',
      interestRatePct: 0,
      termMonths: 100,
      startMonth: { year: 2026, month: 6 },
    },
    loans: [
      {
        id: 'friend',
        type: 'PRIVATE_LOAN',
        label: 'Friend',
        amount: 5000,
        interestRatePct: 0,
        startMonth: { year: 2026, month: 1 },
        termMonths: 10,
      },
    ],
  };

  it('sums down payment, purchase costs and the total mortgage repayment', () => {
    expect(computeTotals(inputs).totalCost).toBe(20000 + 1000 + 80000);
  });

  it('adds furnishing to the total cost but not to the total debt', () => {
    const withFurnishing: CalculationInputs = {
      ...inputs,
      furnishing: [
        { id: 'kitchen', label: 'Kitchen', price: 8000, category: 'interior', description: '' },
        { id: 'sofa', label: 'Sofa', price: 1200, category: 'interior', description: '' },
      ],
    };
    const totals = computeTotals(withFurnishing);
    expect(totals.furnishing).toBe(9200);
    expect(totals.totalCost).toBe(20000 + 1000 + 80000 + 9200);
    expect(totals.totalDebt).toBeCloseTo(80000 + 5000, 6);
  });

  it('sums the mortgage and additional loans repayment as total debt', () => {
    expect(computeTotals(inputs).totalDebt).toBeCloseTo(80000 + 5000, 6);
  });
});
