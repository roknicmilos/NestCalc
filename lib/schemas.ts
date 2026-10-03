import { z } from 'zod';

/** Empty or non-numeric inputs parse to NaN; show a translatable message instead of Zod's English default. */
const NUMBER_ERRORS = { invalid_type_error: 'numberInvalid', required_error: 'numberInvalid' };

export const loanTypeSchema = z.enum(['CASH_LOAN', 'PRIVATE_LOAN']);

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

export const capitalSourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, 'nameRequired').max(80, 'nameTooLong'),
  amount: z.number(NUMBER_ERRORS).finite().min(0, 'amountMin0'),
});

export const incomeSourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, 'nameRequired').max(80, 'nameTooLong'),
  monthlyAmount: z.number(NUMBER_ERRORS).finite().min(0, 'amountMin0'),
  startMonth: monthYearSchema,
});

export const loanSchema = z.object({
  id: z.string().min(1),
  type: loanTypeSchema,
  label: z.string().min(1, 'nameRequired').max(80, 'nameTooLong'),
  amount: z.number(NUMBER_ERRORS).finite().min(0, 'amountMin0'),
  interestRatePct: z.number(NUMBER_ERRORS).finite().min(0, 'ratePctRange').max(100, 'ratePctRange'),
  startMonth: monthYearSchema,
  termMonths: z.number(NUMBER_ERRORS).int('termInteger').min(1, 'termMin1').max(600, 'termMax'),
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
  purchaseCostsFixed: z.number(NUMBER_ERRORS).finite().min(0, 'costsMin0'),
  /** EUR→RSD rate used for secondary RSD amounts in the UI. Optional for backward
   * compatibility with saved calculations; falls back to the default in defaults.ts. */
  eurToRsdRate: z.number(NUMBER_ERRORS).finite().min(0, 'rateMin').default(117.5),
  capitalSources: z.array(capitalSourceSchema),
  mortgage: mortgageInputsSchema,
  loans: z.array(loanSchema),
  /** Recurring monthly income (e.g. rent) that offsets the monthly burden in the
   * repayment phases. Optional for backward compatibility with saved calculations. */
  incomeSources: z.array(incomeSourceSchema).default([]),
});

export const calculationSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(80, 'nameTooLong'),
  createdAt: z.string(),
  updatedAt: z.string(),
  inputs: calculationInputsSchema,
});
