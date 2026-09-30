export const sr = {
  meta: {
    title: 'NestCalc — kalkulator kupovine nekretnine',
    description: 'Izračunajte stvarne troškove i mesečne rate pri kupovini nekretnine.',
  },
  app: {
    title: 'NestCalc',
  },
  pending: 'čeka ispravnu vrednost',
  summary: {
    title: 'Pregled',
    downPaymentSection: 'Učešće',
    totalCapital: 'Ukupan kapital',
    loansForDownPayment: 'Pozajmice za učešće',
    availableForDownPayment: 'Raspoloživo za učešće',
    requiredDownPayment: 'Potrebno učešće',
    shortfall: 'Nedostaje za učešće',
    afterDownPaymentSection: 'Nakon učešća',
    ppap: 'Porez na prenos (PPAP)',
    leftover: 'Preostalo za ostalo',
    futureSection: 'Buduća obaveza',
    ppapLater: 'Porez na prenos (PPAP) — kasnije',
    ppapMonthlySaving: 'Mesečna štednja za PPAP',
    ppapDeferredNote: (due: string | null, saving: { amount: string; months: number } | null) =>
      `Ne pripremate sada — dospeva kada nekretnina bude gotova${due ? ` (oko ${due})` : ''}, uz stambeni kredit.` +
      (saving
        ? ` Da bi bio spreman na vreme, odvajajte ${saving.amount} mesečno tokom ${saving.months} ${saving.months === 1 ? 'meseca' : 'meseci'}.`
        : ''),
    mortgageSection: 'Stambeni kredit',
    mortgageAmount: 'Iznos stambenog kredita',
    mortgageMonthly: 'Mesečna rata stambenog kredita',
    mortgageInterest: 'Ukupna kamata stambenog kredita',
    mortgageTotal: 'Ukupno za vraćanje stambenog kredita',
  },
  timeline: {
    title: 'Faze otplate',
    empty: 'Nema aktivnih dugova za prikaz.',
    perMonth: (amount: string) => `${amount} / mes.`,
    bankDebt: 'Dug banci (stambeni + keš)',
  },
  validation: {
    nameRequired: 'Naziv je obavezan.',
    nameTooLong: 'Naziv je predugačak.',
    areaTooLong: 'Deo grada je predugačak.',
    streetTooLong: 'Adresa je predugačka.',
    extraRequired: 'Unesite opis pogodnosti.',
    extraTooLong: 'Opis je predugačak.',
    amountMin0: 'Iznos mora biti 0 ili veći.',
    ratePctRange: 'Kamatna stopa mora biti između 0 i 100.',
    downPaymentPctRange: 'Procenat učešća mora biti između 0 i 100.',
    termInteger: 'Broj meseci mora biti ceo broj.',
    termMin1: 'Broj meseci mora biti najmanje 1.',
    termMax: 'Broj meseci je previsok.',
    priceMin0: 'Cena mora biti 0 ili veća.',
    areaMin0: 'Kvadratura mora biti 0 ili veća.',
    linkInvalid: 'Unesite ispravan link.',
    costsMin0: 'Troškovi moraju biti 0 ili veći.',
    rateMin: 'Kurs mora biti veći od 0.',
  },
  defaults: {
    cashLoan: 'Keš kredit',
    privateLoan: 'Pozajmica',
    rent: 'Kirija od stana',
  },
  computed: {
    mortgage: 'Stambeni kredit',
    ppapSavings: 'Štednja za PPAP',
  },
  language: {
    label: 'Jezik',
    sr: 'Srpski',
    en: 'English',
  },
};

export type Dictionary = typeof sr;
