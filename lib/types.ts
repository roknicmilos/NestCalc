import type { z } from 'zod';
import type {
  calculationInputsSchema,
  calculationSchema,
  calculationSummarySchema,
  capitalSourceSchema,
  loanSchema,
  loanTypeSchema,
  monthYearSchema,
  mortgageInputsSchema,
  sellerSchema,
} from './schemas';

export type LoanType = z.infer<typeof loanTypeSchema>;
export type Seller = z.infer<typeof sellerSchema>;
export type MonthYear = z.infer<typeof monthYearSchema>;
export type CapitalSource = z.infer<typeof capitalSourceSchema>;
export type Loan = z.infer<typeof loanSchema>;
export type MortgageInputs = z.infer<typeof mortgageInputsSchema>;
export type CalculationInputs = z.infer<typeof calculationInputsSchema>;
export type Calculation = z.infer<typeof calculationSchema>;
export type CalculationSummary = z.infer<typeof calculationSummarySchema>;

export type LoanComputation = {
  loan: Loan;
  monthlyPayment: number;
  endMonth: MonthYear;
  totalInterest: number;
  totalPaid: number;
};

export type DebtPhaseComponent = {
  loanId: string;
  label: string;
  amount: number;
};

export type DebtPhase = {
  startMonth: MonthYear;
  endMonth: MonthYear;
  durationMonths: number;
  monthlyTotal: number;
  components: DebtPhaseComponent[];
};

export type ComputedTotals = {
  ppap: number;
  totalCapital: number;
  loansForDownPayment: number;
  availableForDownPayment: number;
  requiredDownPayment: number;
  mortgageAmount: number;
  shortfall: number;
  mortgageComputation: LoanComputation;
  loanComputations: LoanComputation[];
  phases: DebtPhase[];
};
