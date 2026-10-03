import type { DebtPhase, DebtPhaseComponent, LoanComputation, MonthYear } from '../types';
import { indexToMonthYear, monthYearToIndex } from './monthIndex';

type Active = {
  computation: LoanComputation;
  startIdx: number;
  endIdx: number;
};

export function buildPhases(loanComputations: LoanComputation[]): DebtPhase[] {
  const actives: Active[] = loanComputations
    .filter((c) => c.loan.termMonths > 0 && c.monthlyPayment > 0)
    .map((c) => {
      const startIdx = monthYearToIndex(c.loan.startMonth);
      const endIdx = startIdx + c.loan.termMonths - 1;
      return { computation: c, startIdx, endIdx };
    });

  if (actives.length === 0) return [];

  const boundarySet = new Set<number>();
  for (const a of actives) {
    boundarySet.add(a.startIdx);
    boundarySet.add(a.endIdx + 1);
  }
  const boundaries = [...boundarySet].sort((a, b) => a - b);

  type Interval = {
    startIdx: number;
    endIdx: number;
    monthlyTotal: number;
    monthlyBankTotal: number;
    components: DebtPhaseComponent[];
    componentKey: string;
  };

  const intervals: Interval[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const left = boundaries[i];
    const right = boundaries[i + 1];
    if (right <= left) continue;
    const activeHere = actives.filter((a) => a.startIdx <= left && a.endIdx >= left);
    if (activeHere.length === 0) continue;
    const components: DebtPhaseComponent[] = activeHere
      .map((a) => ({
        loanId: a.computation.loan.id,
        label: a.computation.loan.label,
        amount: a.computation.monthlyPayment,
        bankDebt: a.computation.loan.type === 'CASH_LOAN',
      }))
      .sort((a, b) => a.loanId.localeCompare(b.loanId));
    const monthlyTotal = components.reduce((acc, c) => acc + c.amount, 0);
    const monthlyBankTotal = components.reduce((acc, c) => acc + (c.bankDebt ? c.amount : 0), 0);
    const componentKey = components.map((c) => c.loanId).join('|');
    intervals.push({
      startIdx: left,
      endIdx: right - 1,
      monthlyTotal,
      monthlyBankTotal,
      components,
      componentKey,
    });
  }

  const merged: Interval[] = [];
  for (const iv of intervals) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      prev.endIdx + 1 === iv.startIdx &&
      prev.componentKey === iv.componentKey &&
      Math.abs(prev.monthlyTotal - iv.monthlyTotal) < 1e-6
    ) {
      prev.endIdx = iv.endIdx;
    } else {
      merged.push({ ...iv });
    }
  }

  return merged.map((iv) => ({
    startMonth: indexToMonthYear(iv.startIdx),
    endMonth: indexToMonthYear(iv.endIdx),
    durationMonths: iv.endIdx - iv.startIdx + 1,
    monthlyTotal: iv.monthlyTotal,
    monthlyBankTotal: iv.monthlyBankTotal,
    components: iv.components,
  }));
}

/**
 * Splits phases at the first day of `currentMonth`: a month's debt counts as paid out as
 * soon as the next month begins, so everything before `currentMonth` is paid out and
 * everything from `currentMonth` on is upcoming. A phase spanning the boundary is cut in two.
 */
export function splitPhasesAtMonth(
  phases: DebtPhase[],
  currentMonth: MonthYear,
): { paid: DebtPhase[]; upcoming: DebtPhase[] } {
  const boundary = monthYearToIndex(currentMonth);
  const paid: DebtPhase[] = [];
  const upcoming: DebtPhase[] = [];
  for (const phase of phases) {
    const startIdx = monthYearToIndex(phase.startMonth);
    const endIdx = monthYearToIndex(phase.endMonth);
    if (endIdx < boundary) {
      paid.push(phase);
    } else if (startIdx >= boundary) {
      upcoming.push(phase);
    } else {
      paid.push({
        ...phase,
        endMonth: indexToMonthYear(boundary - 1),
        durationMonths: boundary - startIdx,
      });
      upcoming.push({
        ...phase,
        startMonth: currentMonth,
        durationMonths: endIdx - boundary + 1,
      });
    }
  }
  return { paid, upcoming };
}
