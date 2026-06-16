import { z } from 'zod';

export const loanTypeSchema = z.enum(['CASH_LOAN', 'PRIVATE_LOAN']);

export const sellerSchema = z.enum(['INDIVIDUAL', 'INVESTOR']);

export const propertyTypeSchema = z.enum(['HOUSE', 'APARTMENT']);

export const ppapTimingSchema = z.enum(['NOW', 'LATER']);

export const addressSchema = z.object({
  area: z.string().trim().max(120, 'Deo grada je predugačak.').default(''),
  street: z.string().trim().max(120, 'Adresa je predugačka.').default(''),
});

export const monthYearSchema = z.object({
  year: z.number().int().min(1970).max(3000),
  month: z.number().int().min(1).max(12),
});

export const propertyExtraSchema = z.object({
  id: z.string().min(1),
  text: z
    .string()
    .trim()
    .min(1, 'Unesite opis pogodnosti.')
    .max(120, 'Opis je predugačak.'),
});

export const capitalSourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, 'Naziv je obavezan.').max(80),
  amount: z.number().finite().min(0, 'Iznos mora biti 0 ili veći.'),
});

export const incomeSourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, 'Naziv je obavezan.').max(80),
  monthlyAmount: z.number().finite().min(0, 'Iznos mora biti 0 ili veći.'),
  startMonth: monthYearSchema,
});

export const loanSchema = z.object({
  id: z.string().min(1),
  type: loanTypeSchema,
  label: z.string().min(1, 'Naziv je obavezan.').max(80),
  amount: z.number().finite().min(0, 'Iznos mora biti 0 ili veći.'),
  interestRatePct: z
    .number()
    .finite()
    .min(0, 'Kamatna stopa mora biti između 0 i 100.')
    .max(100, 'Kamatna stopa mora biti između 0 i 100.'),
  startMonth: monthYearSchema,
  termMonths: z
    .number()
    .int('Broj meseci mora biti ceo broj.')
    .min(1, 'Broj meseci mora biti najmanje 1.')
    .max(600, 'Broj meseci je previsok.'),
});

export const mortgageInputsSchema = z.object({
  downPaymentPct: z
    .number()
    .finite()
    .min(0, 'Procenat učešća mora biti između 0 i 100.')
    .max(100, 'Procenat učešća mora biti između 0 i 100.'),
  interestRatePct: z
    .number()
    .finite()
    .min(0, 'Kamatna stopa mora biti između 0 i 100.')
    .max(100, 'Kamatna stopa mora biti između 0 i 100.'),
  termMonths: z
    .number()
    .int('Broj meseci mora biti ceo broj.')
    .min(1, 'Broj meseci mora biti najmanje 1.')
    .max(600, 'Broj meseci je previsok.'),
  startMonth: monthYearSchema,
});

export const calculationInputsSchema = z.object({
  propertyPrice: z.number().finite().min(0, 'Cena mora biti 0 ili veća.'),
  propertyType: propertyTypeSchema.default('APARTMENT'),
  squareMeters: z.number().finite().min(0, 'Kvadratura mora biti 0 ili veća.').default(0),
  link: z
    .union([z.literal(''), z.string().trim().url('Unesite ispravan link.')])
    .default(''),
  address: addressSchema.default({}),
  seller: sellerSchema,
  ppapTiming: ppapTimingSchema.default('NOW'),
  /** Month from which the deferred PPAP saving is spread. Optional for backward
   * compatibility with saved calculations; falls back to the current month. */
  ppapSavingStartMonth: monthYearSchema.optional(),
  purchaseCostsFixed: z.number().finite().min(0, 'Troškovi moraju biti 0 ili veći.'),
  /** EUR→RSD rate used for secondary RSD amounts in the UI. Optional for backward
   * compatibility with saved calculations; falls back to the default in defaults.ts. */
  eurToRsdRate: z
    .number()
    .finite()
    .min(0, 'Kurs mora biti veći od 0.')
    .default(117.5),
  extras: z.array(propertyExtraSchema).default([]),
  capitalSources: z.array(capitalSourceSchema),
  mortgage: mortgageInputsSchema,
  loans: z.array(loanSchema),
  /** Recurring monthly income (e.g. rent) that offsets the monthly burden in the
   * repayment phases. Optional for backward compatibility with saved calculations. */
  incomeSources: z.array(incomeSourceSchema).default([]),
});

export const calculationSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Naziv je obavezan.').max(80, 'Naziv je predugačak.'),
  createdAt: z.string(),
  updatedAt: z.string(),
  inputs: calculationInputsSchema,
});

export const calculationSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  updatedAt: z.string(),
});

export const createCalculationBodySchema = z.object({
  name: z.string().trim().min(1, 'Naziv je obavezan.').max(80),
});
