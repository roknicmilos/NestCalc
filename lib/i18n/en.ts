import type { Dictionary } from './sr';

export const en: Dictionary = {
  meta: {
    title: 'NestCalc — property purchase calculator',
    description: 'Calculate the real costs and monthly payments of buying a property.',
  },
  app: {
    title: 'NestCalc',
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
