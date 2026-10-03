import { describe, expect, it } from 'vitest';
import {
  computeDownPayment,
  sumFurnishing,
  sumFurnishingByCategory,
  sumPurchaseCosts,
} from './capital';

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

describe('sumFurnishing', () => {
  it('sums item prices, ignoring non-finite ones', () => {
    expect(
      sumFurnishing([
        { id: 'a', label: 'Kitchen', price: 8000, category: 'interior', description: '' },
        { id: 'b', label: 'Sofa', price: 1500.5, category: 'interior', description: '' },
        { id: 'c', label: 'Bad', price: NaN, category: 'interior', description: '' },
      ]),
    ).toBe(9500.5);
  });

  it('is 0 for no items', () => {
    expect(sumFurnishing([])).toBe(0);
  });
});

describe('sumFurnishingByCategory', () => {
  it('splits item prices by category', () => {
    expect(
      sumFurnishingByCategory([
        { id: 'a', label: 'Kitchen', price: 8000, category: 'interior', description: '' },
        { id: 'b', label: 'Sofa', price: 1000, category: 'interior', description: '' },
        { id: 'c', label: 'Grill', price: 500, category: 'exterior', description: '' },
      ]),
    ).toEqual({ interior: 9000, exterior: 500 });
  });

  it('is zero for both categories with no items', () => {
    expect(sumFurnishingByCategory([])).toEqual({ interior: 0, exterior: 0 });
  });
});
