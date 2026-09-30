import type { Dictionary } from './sr';

export const en: Dictionary = {
  meta: {
    title: 'NestCalc — property purchase calculator',
    description: 'Calculate the real costs and monthly payments of buying a property.',
  },
  app: {
    title: 'NestCalc',
  },
  pending: 'waiting for a valid value',
  summary: {
    title: 'Overview',
    downPaymentSection: 'Down payment',
    totalCapital: 'Total capital',
    loansForDownPayment: 'Loans for the down payment',
    availableForDownPayment: 'Available for the down payment',
    requiredDownPayment: 'Required down payment',
    shortfall: 'Down payment shortfall',
    afterDownPaymentSection: 'After the down payment',
    ppap: 'Property transfer tax (PPAP)',
    leftover: 'Left over for other costs',
    futureSection: 'Future obligation',
    ppapLater: 'Property transfer tax (PPAP) — later',
    ppapMonthlySaving: 'Monthly savings for PPAP',
    ppapDeferredNote: (due: string | null, saving: { amount: string; months: number } | null) =>
      `You don't need to prepare it now — it falls due when the property is ready${due ? ` (around ${due})` : ''}, together with the mortgage.` +
      (saving
        ? ` To be ready on time, set aside ${saving.amount} per month for ${saving.months} ${saving.months === 1 ? 'month' : 'months'}.`
        : ''),
    mortgageSection: 'Mortgage',
    mortgageAmount: 'Mortgage amount',
    mortgageMonthly: 'Monthly mortgage payment',
    mortgageInterest: 'Total mortgage interest',
    mortgageTotal: 'Total mortgage repayment',
  },
  timeline: {
    title: 'Repayment phases',
    empty: 'No active debts to show.',
    perMonth: (amount: string) => `${amount} / mo.`,
    bankDebt: 'Bank debt (mortgage + cash loan)',
  },
  validation: {
    nameRequired: 'Name is required.',
    nameTooLong: 'Name is too long.',
    areaTooLong: 'Neighbourhood is too long.',
    streetTooLong: 'Address is too long.',
    extraRequired: 'Enter a description of the feature.',
    extraTooLong: 'Description is too long.',
    amountMin0: 'Amount must be 0 or greater.',
    ratePctRange: 'Interest rate must be between 0 and 100.',
    downPaymentPctRange: 'Down payment percentage must be between 0 and 100.',
    termInteger: 'Number of months must be a whole number.',
    termMin1: 'Number of months must be at least 1.',
    termMax: 'Number of months is too high.',
    priceMin0: 'Price must be 0 or greater.',
    areaMin0: 'Floor area must be 0 or greater.',
    linkInvalid: 'Enter a valid link.',
    costsMin0: 'Costs must be 0 or greater.',
    rateMin: 'Exchange rate must be greater than 0.',
  },
  defaults: {
    cashLoan: 'Cash loan',
    privateLoan: 'Private loan',
    rent: 'Rent from the apartment',
  },
  computed: {
    mortgage: 'Mortgage',
    ppapSavings: 'PPAP savings',
  },
  language: {
    label: 'Language',
    sr: 'Srpski',
    en: 'English',
  },
};
