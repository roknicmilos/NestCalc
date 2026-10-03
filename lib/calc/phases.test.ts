import { describe, expect, it } from 'vitest';
import type { LoanComputation } from '../types';
import { buildPhases, splitPhasesAtMonth } from './phases';

function makeComputation(
  id: string,
  label: string,
  startYear: number,
  startMonth: number,
  termMonths: number,
  pmt: number,
  type: 'CASH_LOAN' | 'PRIVATE_LOAN' = 'PRIVATE_LOAN',
): LoanComputation {
  return {
    loan: {
      id,
      type,
      label,
      amount: pmt * termMonths,
      interestRatePct: 0,
      startMonth: { year: startYear, month: startMonth },
      termMonths,
    },
    monthlyPayment: pmt,
    endMonth: { year: startYear, month: startMonth },
    totalInterest: 0,
    totalPaid: pmt * termMonths,
  };
}

describe('buildPhases', () => {
  it('returns no phases when no loans are active', () => {
    expect(buildPhases([])).toEqual([]);
  });

  it('produces the example phases from specs.md (300/1200/900)', () => {
    // Down payment loan: 300 €/mo for 24 months from Jan 2026
    // Mortgage: 900 €/mo for 360 months starting Jan 2027 (after year 1)
    const downPayment = makeComputation('dp', 'DP', 2026, 1, 24, 300);
    const mortgage = makeComputation('m', 'M', 2027, 1, 360, 900);
    const phases = buildPhases([downPayment, mortgage]);

    expect(phases).toHaveLength(3);
    expect(phases[0].monthlyTotal).toBe(300);
    expect(phases[0].durationMonths).toBe(12);
    expect(phases[1].monthlyTotal).toBe(1200);
    expect(phases[1].durationMonths).toBe(12);
    expect(phases[2].monthlyTotal).toBe(900);
    expect(phases[2].durationMonths).toBe(348);
  });

  it('handles a single loan as one phase', () => {
    const only = makeComputation('a', 'A', 2026, 6, 12, 100);
    const phases = buildPhases([only]);
    expect(phases).toHaveLength(1);
    expect(phases[0].monthlyTotal).toBe(100);
    expect(phases[0].durationMonths).toBe(12);
    expect(phases[0].startMonth).toEqual({ year: 2026, month: 6 });
    expect(phases[0].endMonth).toEqual({ year: 2027, month: 5 });
  });

  it('sums only bank debt (mortgage + keš kredit) into monthlyBankTotal', () => {
    // Mortgage (bank) + keš kredit (bank) + pozajmica (private), all overlapping.
    const mortgage = makeComputation('mortgage', 'Stambeni kredit', 2026, 1, 12, 900, 'CASH_LOAN');
    const cash = makeComputation('c', 'Keš kredit', 2026, 1, 12, 300, 'CASH_LOAN');
    const priv = makeComputation('p', 'Pozajmica', 2026, 1, 12, 200, 'PRIVATE_LOAN');
    const phases = buildPhases([mortgage, cash, priv]);

    expect(phases).toHaveLength(1);
    expect(phases[0].monthlyTotal).toBe(1400);
    expect(phases[0].monthlyBankTotal).toBe(1200);
    expect(phases[0].components.filter((c) => c.bankDebt).map((c) => c.loanId)).toEqual([
      'c',
      'mortgage',
    ]);
  });

  it('reports zero bank debt when only private loans are active', () => {
    const priv = makeComputation('p', 'Pozajmica', 2026, 1, 12, 200, 'PRIVATE_LOAN');
    const phases = buildPhases([priv]);
    expect(phases[0].monthlyTotal).toBe(200);
    expect(phases[0].monthlyBankTotal).toBe(0);
  });

  it('does not merge identical totals from different loan compositions', () => {
    // Two adjacent phases that both happen to total 500 but from different loans
    const a = makeComputation('a', 'A', 2026, 1, 12, 500);
    const b = makeComputation('b', 'B', 2027, 1, 12, 500);
    const phases = buildPhases([a, b]);
    expect(phases).toHaveLength(2);
    expect(phases[0].components.map((c) => c.loanId)).toEqual(['a']);
    expect(phases[1].components.map((c) => c.loanId)).toEqual(['b']);
  });
});

describe('splitPhasesAtMonth', () => {
  const phases = buildPhases([
    makeComputation('a', 'A', 2026, 1, 3, 100),
    makeComputation('b', 'B', 2026, 6, 6, 200),
  ]);

  it('treats a phase ending the month before as paid out', () => {
    const { paid, upcoming } = splitPhasesAtMonth(phases, { year: 2026, month: 4 });
    expect(paid).toHaveLength(1);
    expect(paid[0].endMonth).toEqual({ year: 2026, month: 3 });
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].startMonth).toEqual({ year: 2026, month: 6 });
  });

  it('keeps a phase starting in the current month as upcoming', () => {
    const { paid, upcoming } = splitPhasesAtMonth(phases, { year: 2026, month: 1 });
    expect(paid).toHaveLength(0);
    expect(upcoming).toHaveLength(2);
  });

  it('cuts a phase that spans the current month', () => {
    const { paid, upcoming } = splitPhasesAtMonth(phases, { year: 2026, month: 8 });
    expect(paid.map((p) => p.durationMonths)).toEqual([3, 2]);
    expect(paid[1].endMonth).toEqual({ year: 2026, month: 7 });
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].startMonth).toEqual({ year: 2026, month: 8 });
    expect(upcoming[0].durationMonths).toBe(4);
    expect(upcoming[0].monthlyTotal).toBe(200);
  });
});
