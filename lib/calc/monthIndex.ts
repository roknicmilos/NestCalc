import type { MonthYear } from '../types';

export function monthYearToIndex(my: MonthYear): number {
  return my.year * 12 + (my.month - 1);
}

export function indexToMonthYear(index: number): MonthYear {
  const safeIndex = Math.trunc(index);
  const year = Math.floor(safeIndex / 12);
  const month = (((safeIndex % 12) + 12) % 12) + 1;
  return { year, month };
}
