import { describe, expect, it } from 'vitest';
import { monthlyPayment } from './pmt';

describe('monthlyPayment', () => {
  it('returns 0 when principal is 0', () => {
    expect(monthlyPayment(5, 12, 0)).toBe(0);
  });

  it('returns 0 when term is 0', () => {
    expect(monthlyPayment(5, 0, 1000)).toBe(0);
  });

  it('does simple division when interest rate is 0', () => {
    expect(monthlyPayment(0, 10, 1000)).toBeCloseTo(100, 6);
  });

  it('matches Excel PMT for mortgage 184000 EUR, 4.5%, 360 months', () => {
    // From Kalkulacije.xlsx C34 cached value: 932.3009701
    expect(monthlyPayment(4.5, 360, 184000)).toBeCloseTo(932.3009701, 4);
  });

  it('matches Excel PMT for cash loan 19750 EUR, 10%, 71 months', () => {
    // From Kalkulacije.xlsx C38 cached value: 369.6529858
    expect(monthlyPayment(10, 71, 19750)).toBeCloseTo(369.6529858, 4);
  });
});
