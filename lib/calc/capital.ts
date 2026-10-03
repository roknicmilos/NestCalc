import type { FurnishingCategory, FurnishingItem, PurchaseCosts } from '../types';

export function sumPurchaseCosts(costs: PurchaseCosts): number {
  return [costs.preliminaryContract, costs.principalContract].reduce(
    (acc, c) => acc + (Number.isFinite(c) ? c : 0),
    0,
  );
}

export function sumFurnishing(items: FurnishingItem[]): number {
  return items.reduce((acc, item) => acc + (Number.isFinite(item.price) ? item.price : 0), 0);
}

export function sumFurnishingByCategory(
  items: FurnishingItem[],
): Record<FurnishingCategory, number> {
  const totals: Record<FurnishingCategory, number> = { interior: 0, exterior: 0 };
  for (const item of items) {
    if (Number.isFinite(item.price)) totals[item.category] += item.price;
  }
  return totals;
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
