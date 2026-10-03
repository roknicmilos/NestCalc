import type { PurchaseCosts } from '../types';

export function sumPurchaseCosts(costs: PurchaseCosts): number {
  return [costs.preliminaryContract, costs.principalContract].reduce(
    (acc, c) => acc + (Number.isFinite(c) ? c : 0),
    0,
  );
}

export type DownPayment = {
  requiredDownPayment: number;
  mortgageAmount: number;
};

export function computeDownPayment(propertyPrice: number, downPaymentPct: number): DownPayment {
  const requiredDownPayment = (propertyPrice * downPaymentPct) / 100;
  const mortgageAmount = Math.max(0, propertyPrice - requiredDownPayment);
  return { requiredDownPayment, mortgageAmount };
}
