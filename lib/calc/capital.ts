import type { CapitalSource, Loan, PurchaseCosts } from '../types';

export function sumCapital(sources: CapitalSource[]): number {
  return sources.reduce((acc, s) => acc + (Number.isFinite(s.amount) ? s.amount : 0), 0);
}

export function sumLoansForDownPayment(loans: Loan[]): number {
  return loans.reduce((acc, l) => acc + (Number.isFinite(l.amount) ? l.amount : 0), 0);
}

export function sumPurchaseCosts(costs: PurchaseCosts): number {
  return [costs.preliminaryContract, costs.principalContract].reduce(
    (acc, c) => acc + (Number.isFinite(c) ? c : 0),
    0,
  );
}

export type CapitalAllocation = {
  totalCapital: number;
  loansForDownPayment: number;
  availableForDownPayment: number;
  requiredDownPayment: number;
  mortgageAmount: number;
  shortfall: number;
};

export function allocateCapital(params: {
  propertyPrice: number;
  capitalSources: CapitalSource[];
  loans: Loan[];
  purchaseCosts: number;
  ppap: number;
  downPaymentPct: number;
}): CapitalAllocation {
  const { propertyPrice, capitalSources, loans, purchaseCosts, ppap, downPaymentPct } = params;
  const totalCapital = sumCapital(capitalSources);
  const loansForDownPayment = sumLoansForDownPayment(loans);
  const availableForDownPayment = totalCapital + loansForDownPayment - purchaseCosts - ppap;
  const requiredDownPayment = (propertyPrice * downPaymentPct) / 100;
  const mortgageAmount = Math.max(0, propertyPrice - requiredDownPayment);
  const shortfall = Math.max(0, requiredDownPayment - availableForDownPayment);
  return {
    totalCapital,
    loansForDownPayment,
    availableForDownPayment,
    requiredDownPayment,
    mortgageAmount,
    shortfall,
  };
}
