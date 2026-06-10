'use client';

import type { ChangeEvent } from 'react';
import { inputValueToMonthYear, monthYearToInputValue } from '@/lib/format';
import type { MonthYear } from '@/lib/types';

type Props = {
  id?: string;
  value: MonthYear;
  onChange: (value: MonthYear) => void;
  disabled?: boolean;
  ariaInvalid?: boolean;
};

export function MonthYearInput({ id, value, onChange, disabled, ariaInvalid }: Props) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const parsed = inputValueToMonthYear(event.target.value);
    if (parsed) onChange(parsed);
  }
  return (
    <input
      id={id}
      type="month"
      value={monthYearToInputValue(value)}
      onChange={handleChange}
      disabled={disabled}
      aria-invalid={ariaInvalid || undefined}
    />
  );
}
