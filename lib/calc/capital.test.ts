import { describe, expect, it } from 'vitest';
import { computeDownPayment, sumPurchaseCosts } from './capital';

describe('sumPurchaseCosts', () => {
  it('sums the preliminary and principal contract costs', () => {
    expect(sumPurchaseCosts({ preliminaryContract: 238, principalContract: 300 })).toBe(538);
  });

  it('treats non-finite values as zero', () => {
    expect(sumPurchaseCosts({ preliminaryContract: NaN, principalContract: 300 })).toBe(300);
  });
});

describe('computeDownPayment', () => {
  it('splits the price into the required down payment and the mortgage amount', () => {
    expect(computeDownPayment(230000, 20)).toEqual({
      requiredDownPayment: 46000,
      mortgageAmount: 184000,
    });
  });
});
