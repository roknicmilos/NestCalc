import { z } from 'zod';

/** Empty or non-numeric inputs parse to NaN; show a translatable message instead of Zod's English default. */
const NUMBER_ERRORS = { invalid_type_error: 'numberInvalid', required_error: 'numberInvalid' };

export const loanTypeSchema = z.enum(['CASH_LOAN', 'PRIVATE_LOAN']);

/** STANDARD: rate/12 per month. ACTUAL_365_360: bank-style actual/360 accrual, i.e. the
 * nominal rate scaled by 365/360. */
export const dayCountSchema = z.enum(['STANDARD', 'ACTUAL_365_360']);

export const sellerSchema = z.enum(['INDIVIDUAL', 'INVESTOR']);

export const ppapTimingSchema = z.enum(['NOW', 'LATER']);

export const addressSchema = z.object({
  area: z.string().trim().max(120, 'areaTooLong').default(''),
  street: z.string().trim().max(120, 'streetTooLong').default(''),
});

export const monthYearSchema = z.object({
  year: z.number(NUMBER_ERRORS).int().min(1970).max(3000),
  month: z.number(NUMBER_ERRORS).int().min(1).max(12),
});

export const loanSchema = z.object({
  id: z.string().min(1),
  type: loanTypeSchema,
  label: z.string().min(1, 'nameRequired').max(80, 'nameTooLong'),
  amount: z.number(NUMBER_ERRORS).finite().min(0, 'amountMin0'),
  interestRatePct: z.number(NUMBER_ERRORS).finite().min(0, 'ratePctRange').max(100, 'ratePctRange'),
  startMonth: monthYearSchema,
  termMonths: z.number(NUMBER_ERRORS).int('termInteger').min(1, 'termMin1').max(600, 'termMax'),
  dayCount: dayCountSchema.optional(),
});

export const mortgageInputsSchema = z.object({
  downPaymentPct: z
    .number(NUMBER_ERRORS)
    .finite()
    .min(0, 'downPaymentPctRange')
    .max(100, 'downPaymentPctRange'),
  interestRatePct: z.number(NUMBER_ERRORS).finite().min(0, 'ratePctRange').max(100, 'ratePctRange'),
  termMonths: z.number(NUMBER_ERRORS).int('termInteger').min(1, 'termMin1').max(600, 'termMax'),
  startMonth: monthYearSchema,
  /** Optional for backward compatibility with saved calculations. */
  dayCount: dayCountSchema.default('STANDARD'),
});

export const DEFAULT_CONTRACT_COST = 238;

export const purchaseCostsSchema = z.object({
  preliminaryContract: z.number(NUMBER_ERRORS).finite().min(0, 'costsMin0'),
  principalContract: z.number(NUMBER_ERRORS).finite().min(0, 'costsMin0'),
});

export const calculationInputsSchema = z.object({
  propertyPrice: z.number(NUMBER_ERRORS).finite().min(0, 'priceMin0'),
  propertyType: z.string().trim().max(120, 'propertyTypeTooLong').default(''),
  squareMeters: z.number(NUMBER_ERRORS).finite().min(0, 'areaMin0').default(0),
  link: z.union([z.literal(''), z.string().trim().url('linkInvalid')]).default(''),
  address: addressSchema.default({}),
  seller: sellerSchema,
  ppapTiming: ppapTimingSchema.default('NOW'),
  /** Month from which the deferred PPAP saving is spread. Optional for backward
   * compatibility with saved calculations; falls back to the current month. */
  ppapSavingStartMonth: monthYearSchema.optional(),
  /** Itemised purchase costs. Optional for backward compatibility with saved calculations
   * that predate the breakdown (they fall back to the defaults). */
  purchaseCosts: purchaseCostsSchema.default({
    preliminaryContract: DEFAULT_CONTRACT_COST,
    principalContract: DEFAULT_CONTRACT_COST,
  }),
  /** EUR→RSD rate used for secondary RSD amounts in the UI. Optional for backward
   * compatibility with saved calculations; falls back to the default in defaults.ts. */
  eurToRsdRate: z.number(NUMBER_ERRORS).finite().min(0, 'rateMin').default(117.5),
  mortgage: mortgageInputsSchema,
  loans: z.array(loanSchema),
});

export const calculationSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(80, 'nameTooLong'),
  createdAt: z.string(),
  updatedAt: z.string(),
  inputs: calculationInputsSchema,
});
