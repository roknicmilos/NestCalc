import { describe, expect, it } from 'vitest';
import type { IncomeSource, LoanComputation } from '../types';
import { buildPhases } from './phases';

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

  it('offsets the monthly total with income active for the whole phase', () => {
    const only = makeComputation('a', 'A', 2026, 1, 12, 500);
    const income: IncomeSource = {
      id: 'rent',
      label: 'Kirija od stana',
      monthlyAmount: 300,
      startMonth: { year: 2026, month: 1 },
    };
    const phases = buildPhases([only], [income]);
    expect(phases).toHaveLength(1);
    expect(phases[0].monthlyTotal).toBe(200);
    // Bank total is unaffected by income.
    expect(phases[0].monthlyBankTotal).toBe(0);
    const incomeComponent = phases[0].components.find((c) => c.income);
    expect(incomeComponent).toMatchObject({ loanId: 'rent', amount: -300, bankDebt: false });
  });

  it('splits a phase when income starts mid-way', () => {
    // Loan runs Jan–Dec 2026; rent starts Jul 2026.
    const loan = makeComputation('a', 'A', 2026, 1, 12, 500);
    const income: IncomeSource = {
      id: 'rent',
      label: 'Kirija',
      monthlyAmount: 200,
      startMonth: { year: 2026, month: 7 },
    };
    const phases = buildPhases([loan], [income]);
    expect(phases).toHaveLength(2);
    expect(phases[0].durationMonths).toBe(6);
    expect(phases[0].monthlyTotal).toBe(500);
    expect(phases[1].durationMonths).toBe(6);
    expect(phases[1].monthlyTotal).toBe(300);
  });

  it('ignores income that starts after the last loan is paid off', () => {
    const loan = makeComputation('a', 'A', 2026, 1, 12, 500);
    const income: IncomeSource = {
      id: 'rent',
      label: 'Kirija',
      monthlyAmount: 200,
      startMonth: { year: 2030, month: 1 },
    };
    const phases = buildPhases([loan], [income]);
    expect(phases).toHaveLength(1);
    expect(phases[0].monthlyTotal).toBe(500);
    expect(phases[0].components.some((c) => c.income)).toBe(false);
  });

  it('never produces a phase from income alone', () => {
    const income: IncomeSource = {
      id: 'rent',
      label: 'Kirija',
      monthlyAmount: 200,
      startMonth: { year: 2026, month: 1 },
    };
    expect(buildPhases([], [income])).toEqual([]);
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
