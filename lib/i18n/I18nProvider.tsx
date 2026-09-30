'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getDictionary, type Dictionary, type Locale } from './index';

type I18nValue = { locale: Locale; dictionary: Dictionary };

// Only the locale crosses the server→client boundary: dictionaries contain functions
// (plural/interpolation helpers), which React cannot serialize as props.

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, dictionary: getDictionary(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useT/useLocale must be used inside <I18nProvider>');
  return value;
}

export function useT(): Dictionary {
  return useI18n().dictionary;
}

export function useLocale(): Locale {
  return useI18n().locale;
}
