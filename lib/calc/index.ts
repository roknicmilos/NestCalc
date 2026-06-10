import type { CalculationInputs, ComputedTotals, Loan } from '../types';
import { allocateCapital } from './capital';
import { computeLoan } from './loanComputation';
import { buildPhases } from './phases';
import { computePpap } from './ppap';

export { monthlyPayment } from './pmt';
export { computePpap, PPAP_RATE } from './ppap';
export { allocateCapital, sumCapital, sumLoansForDownPayment } from './capital';
export { computeLoan } from './loanComputation';
export { buildPhases } from './phases';
export { indexToMonthYear, monthYearToIndex } from './monthIndex';

export function computeTotals(inputs: CalculationInputs): ComputedTotals {
  const ppap = computePpap(inputs.propertyPrice, inputs.seller);

  const allocation = allocateCapital({
    propertyPrice: inputs.propertyPrice,
    capitalSources: inputs.capitalSources,
    loans: inputs.loans,
    purchaseCostsFixed: inputs.purchaseCostsFixed,
    ppap,
    downPaymentPct: inputs.mortgage.downPaymentPct,
  });

  const mortgageLoan: Loan = {
    id: 'mortgage',
    type: 'CASH_LOAN',
    label: 'Stambeni kredit',
    amount: allocation.mortgageAmount,
    interestRatePct: inputs.mortgage.interestRatePct,
    startMonth: inputs.mortgage.startMonth,
    termMonths: inputs.mortgage.termMonths,
  };
  const mortgageComputation = computeLoan(mortgageLoan);

  const loanComputations = inputs.loans.map(computeLoan);
  const allComputations = [mortgageComputation, ...loanComputations];
  const phases = buildPhases(allComputations);

  return {
    ppap,
    totalCapital: allocation.totalCapital,
    loansForDownPayment: allocation.loansForDownPayment,
    availableForDownPayment: allocation.availableForDownPayment,
    requiredDownPayment: allocation.requiredDownPayment,
    mortgageAmount: allocation.mortgageAmount,
    shortfall: allocation.shortfall,
    mortgageComputation,
    loanComputations,
    phases,
  };
}
