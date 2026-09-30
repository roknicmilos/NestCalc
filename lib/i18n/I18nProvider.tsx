'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Dictionary, Locale } from './index';

type I18nValue = { locale: Locale; dictionary: Dictionary };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: I18nValue & { children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, dictionary }}>{children}</I18nContext.Provider>;
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
