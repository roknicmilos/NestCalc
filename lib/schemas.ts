import { z } from 'zod';

export const loanTypeSchema = z.enum(['CASH_LOAN', 'PRIVATE_LOAN']);

export const sellerSchema = z.enum(['INDIVIDUAL', 'INVESTOR']);

export const monthYearSchema = z.object({
  year: z.number().int().min(1970).max(3000),
  month: z.number().int().min(1).max(12),
});

export const capitalSourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, 'Naziv je obavezan.').max(80),
  amount: z.number().finite().min(0, 'Iznos mora biti 0 ili veći.'),
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
  seller: sellerSchema,
  purchaseCostsFixed: z.number().finite().min(0, 'Troškovi moraju biti 0 ili veći.'),
  capitalSources: z.array(capitalSourceSchema),
  mortgage: mortgageInputsSchema,
  loans: z.array(loanSchema),
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
