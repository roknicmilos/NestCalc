import type { DayCount } from '../types';

const DAY_COUNT_FACTOR: Record<DayCount, number> = {
  STANDARD: 1,
  ACTUAL_365_360: 365 / 360,
};

export function monthlyPayment(
  annualRatePct: number,
  termMonths: number,
  principal: number,
  dayCount: DayCount = 'STANDARD',
): number {
  if (termMonths <= 0) return 0;
  if (principal <= 0) return 0;
  if (annualRatePct === 0) return principal / termMonths;
  const r = (annualRatePct / 100 / 12) * DAY_COUNT_FACTOR[dayCount];
  return (principal * r) / (1 - Math.pow(1 + r, -termMonths));
}
