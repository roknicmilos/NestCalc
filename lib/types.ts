import type { z } from 'zod';
import type {
  addressSchema,
  calculationInputsSchema,
  calculationSchema,
  calculationSummarySchema,
  capitalSourceSchema,
  loanSchema,
  loanTypeSchema,
  monthYearSchema,
  mortgageInputsSchema,
  ppapTimingSchema,
  propertyExtraSchema,
  propertyTypeSchema,
  sellerSchema,
} from './schemas';

export type LoanType = z.infer<typeof loanTypeSchema>;
export type Seller = z.infer<typeof sellerSchema>;
export type PpapTiming = z.infer<typeof ppapTimingSchema>;
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export type PropertyExtra = z.infer<typeof propertyExtraSchema>;
export type Address = z.infer<typeof addressSchema>;
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
  /** True for debt owed to a bank (stambeni kredit / keš kredit), false for
   * private loans (pozajmica) and PPAP savings. */
  bankDebt: boolean;
};

export type DebtPhase = {
  startMonth: MonthYear;
  endMonth: MonthYear;
  durationMonths: number;
  monthlyTotal: number;
  /** Monthly total of only the bank debt components (stambeni + keš kredit). */
  monthlyBankTotal: number;
  components: DebtPhaseComponent[];
};

export type ComputedTotals = {
  ppap: number;
  ppapTiming: PpapTiming;
  /** When PPAP is deferred (timing === 'LATER'), the month it comes due — the
   * mortgage start month, since the property must be ready for the mortgage to begin.
   * `null` when there is no PPAP or it is paid now. */
  ppapDueMonth: MonthYear | null;
  /** Amount to set aside each month so the deferred PPAP is covered by its due month,
   * spread evenly from the saving start month (inputs.ppapSavingStartMonth, defaulting to
   * the current month). `null` unless PPAP is deferred. */
  ppapMonthlySaving: number | null;
  /** Number of months over which the deferred PPAP saving is spread. `null` unless deferred. */
  ppapSavingMonths: number | null;
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
