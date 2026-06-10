import type { CapitalSource, Loan } from '../types';

export function sumCapital(sources: CapitalSource[]): number {
  return sources.reduce((acc, s) => acc + (Number.isFinite(s.amount) ? s.amount : 0), 0);
}

export function sumLoansForDownPayment(loans: Loan[]): number {
  return loans.reduce((acc, l) => acc + (Number.isFinite(l.amount) ? l.amount : 0), 0);
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
  purchaseCostsFixed: number;
  ppap: number;
  downPaymentPct: number;
}): CapitalAllocation {
  const { propertyPrice, capitalSources, loans, purchaseCostsFixed, ppap, downPaymentPct } =
    params;
  const totalCapital = sumCapital(capitalSources);
  const loansForDownPayment = sumLoansForDownPayment(loans);
  const availableForDownPayment =
    totalCapital + loansForDownPayment - purchaseCostsFixed - ppap;
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
