import { describe, expect, it } from 'vitest';
import { defaultLoanLabel, isDefaultLoanLabel } from '../defaults';
import {
  calculationInputsSchema,
  calculationSchema,
  capitalSourceSchema,
  loanSchema,
  mortgageInputsSchema,
  purchaseCostsSchema,
} from '../schemas';
import { componentLabel, getDictionary, LOCALES, translateMessage } from './index';

function messages(...results: { success: boolean; error?: { issues: { message: string }[] } }[]) {
  return results.flatMap((r) => (r.success ? [] : r.error!.issues.map((i) => i.message)));
}

const shape = calculationInputsSchema.shape;
const badMessages = messages(
  calculationSchema.shape.name.safeParse(''),
  calculationSchema.shape.name.safeParse('x'.repeat(81)),
  shape.address.safeParse({ area: 'x'.repeat(121), street: 'x'.repeat(121) }),
  shape.propertyPrice.safeParse(-1),
  shape.propertyPrice.safeParse(NaN),
  loanSchema.shape.termMonths.safeParse(NaN),
  shape.squareMeters.safeParse(-1),
  shape.link.safeParse('not a url'),
  purchaseCostsSchema.safeParse({ preliminaryContract: -1, principalContract: 238 }),
  shape.eurToRsdRate.safeParse(-1),
  capitalSourceSchema.safeParse({ id: 'a', label: '', amount: -1 }),
  capitalSourceSchema.safeParse({ id: 'a', label: 'x'.repeat(81), amount: 1 }),
  loanSchema.safeParse({
    id: 'a',
    type: 'CASH_LOAN',
    label: 'x',
    amount: 1,
    interestRatePct: 101,
    startMonth: { year: 2027, month: 1 },
    termMonths: 1.5,
  }),
  loanSchema.safeParse({
    id: 'a',
    type: 'CASH_LOAN',
    label: 'x',
    amount: 1,
    interestRatePct: -1,
    startMonth: { year: 2027, month: 1 },
    termMonths: 0,
  }),
  loanSchema.safeParse({
    id: 'a',
    type: 'CASH_LOAN',
    label: 'x',
    amount: 1,
    interestRatePct: 1,
    startMonth: { year: 2027, month: 1 },
    termMonths: 601,
  }),
  mortgageInputsSchema.safeParse({
    downPaymentPct: 101,
    interestRatePct: 101,
    termMonths: 0,
    startMonth: { year: 2027, month: 1 },
  }),
  mortgageInputsSchema.safeParse({
    downPaymentPct: -1,
    interestRatePct: -1,
    termMonths: 601,
    startMonth: { year: 2027, month: 1 },
  }),
);

describe('validation messages', () => {
  it('produces messages for every invalid input', () => {
    expect(badMessages.length).toBeGreaterThan(15);
  });

  it.each(LOCALES)('every schema message is a %s dictionary key', (locale) => {
    const keys = Object.keys(getDictionary(locale).validation);
    for (const m of badMessages) expect(keys, m).toContain(m);
  });

  it('translateMessage falls back to the raw message for unknown keys', () => {
    expect(translateMessage(getDictionary('en'), 'nonexistent')).toBe('nonexistent');
    expect(translateMessage(getDictionary('en'), 'nameRequired')).toBe(
      getDictionary('en').validation.nameRequired,
    );
  });
});

describe('computed loan labels', () => {
  it('translates the mortgage and PPAP savings rows, keeps user labels', () => {
    const en = getDictionary('en');
    expect(componentLabel({ loanId: 'mortgage', label: 'Stambeni kredit' }, en)).toBe(
      en.computed.mortgage,
    );
    expect(componentLabel({ loanId: 'ppap-savings', label: 'Štednja za PPAP' }, en)).toBe(
      en.computed.ppapSavings,
    );
    expect(componentLabel({ loanId: 'abc', label: 'Moj kredit' }, en)).toBe('Moj kredit');
  });
});

describe('default loan labels', () => {
  it('recognises a default label from any locale', () => {
    const sr = getDictionary('sr');
    const en = getDictionary('en');
    expect(defaultLoanLabel('CASH_LOAN', en)).toBe(en.defaults.cashLoan);
    expect(isDefaultLoanLabel(sr.defaults.cashLoan, 'CASH_LOAN')).toBe(true);
    expect(isDefaultLoanLabel(en.defaults.cashLoan, 'CASH_LOAN')).toBe(true);
    expect(isDefaultLoanLabel('Custom', 'CASH_LOAN')).toBe(false);
  });
});
