import type { DebtPhase, DebtPhaseComponent, LoanComputation } from '../types';
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
      }))
      .sort((a, b) => a.loanId.localeCompare(b.loanId));
    const monthlyTotal = components.reduce((acc, c) => acc + c.amount, 0);
    const componentKey = components.map((c) => c.loanId).join('|');
    intervals.push({
      startIdx: left,
      endIdx: right - 1,
      monthlyTotal,
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
    components: iv.components,
  }));
}
