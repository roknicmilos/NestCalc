import type { Loan, LoanComputation } from '../types';
import { indexToMonthYear, monthYearToIndex } from './monthIndex';
import { monthlyPayment } from './pmt';

export function computeLoan(loan: Loan): LoanComputation {
  const pmt = monthlyPayment(loan.interestRatePct, loan.termMonths, loan.amount);
  const totalPaid = pmt * loan.termMonths;
  const totalInterest = Math.max(0, totalPaid - loan.amount);
  const startIdx = monthYearToIndex(loan.startMonth);
  const endIdx = startIdx + loan.termMonths - 1;
  return {
    loan,
    monthlyPayment: pmt,
    endMonth: indexToMonthYear(endIdx),
    totalInterest,
    totalPaid,
  };
}
