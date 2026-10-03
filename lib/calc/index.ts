import type { CalculationInputs, ComputedTotals, Loan } from '../types';
import { currentMonthYear } from '../defaults';
import { computeDownPayment, sumPurchaseCosts } from './capital';
import { computeLoan } from './loanComputation';
import { monthYearToIndex } from './monthIndex';
import { buildPhases } from './phases';
import { computePpap } from './ppap';

export { monthlyPayment } from './pmt';
export { computePpap, PPAP_RATE } from './ppap';
export { computeDownPayment, sumPurchaseCosts } from './capital';
export { computeLoan } from './loanComputation';
export { buildPhases, splitPhasesAtMonth } from './phases';
export { indexToMonthYear, monthYearToIndex } from './monthIndex';

export function computeTotals(inputs: CalculationInputs, now: Date = new Date()): ComputedTotals {
  const ppap = computePpap(inputs.propertyPrice, inputs.seller);

  const ppapDueMonth =
    inputs.ppapTiming === 'LATER' && ppap > 0 ? inputs.mortgage.startMonth : null;

  const purchaseCosts = sumPurchaseCosts(inputs.purchaseCosts);
  const downPayment = computeDownPayment(inputs.propertyPrice, inputs.mortgage.downPaymentPct);

  const mortgageLoan: Loan = {
    id: 'mortgage',
    type: 'CASH_LOAN',
    label: 'Stambeni kredit',
    amount: downPayment.mortgageAmount,
    interestRatePct: inputs.mortgage.interestRatePct,
    startMonth: inputs.mortgage.startMonth,
    termMonths: inputs.mortgage.termMonths,
  };
  const mortgageComputation = computeLoan(mortgageLoan);

  const loanComputations = inputs.loans.map(computeLoan);

  // Deferred PPAP becomes a monthly savings target: spread the amount evenly over
  // the months from now until it comes due, so it appears in the repayment timeline
  // like any other monthly obligation. A 0% loan amortizes to amount / term per month.
  let ppapMonthlySaving: number | null = null;
  let ppapSavingMonths: number | null = null;
  const ppapSavingComputations = [];
  if (ppapDueMonth && ppap > 0) {
    const startMonth = inputs.ppapSavingStartMonth ?? currentMonthYear(now);
    const monthsUntilDue = monthYearToIndex(ppapDueMonth) - monthYearToIndex(startMonth);
    const termMonths = Math.max(1, monthsUntilDue);
    const savingLoan: Loan = {
      id: 'ppap-savings',
      type: 'PRIVATE_LOAN',
      label: 'Štednja za PPAP',
      amount: ppap,
      interestRatePct: 0,
      startMonth,
      termMonths,
    };
    const savingComputation = computeLoan(savingLoan);
    ppapMonthlySaving = savingComputation.monthlyPayment;
    ppapSavingMonths = termMonths;
    ppapSavingComputations.push(savingComputation);
  }

  const allComputations = [mortgageComputation, ...loanComputations, ...ppapSavingComputations];
  const phases = buildPhases(allComputations);

  return {
    ppap,
    ppapTiming: inputs.ppapTiming,
    ppapDueMonth,
    ppapMonthlySaving,
    ppapSavingMonths,
    purchaseCosts,
    requiredDownPayment: downPayment.requiredDownPayment,
    mortgageAmount: downPayment.mortgageAmount,
    mortgageComputation,
    loanComputations,
    phases,
  };
}
