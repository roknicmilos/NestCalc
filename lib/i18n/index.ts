import { en } from './en';
import { sr, type Dictionary } from './sr';

export type { Dictionary };
export type Locale = 'sr' | 'en';

export const LOCALES: readonly Locale[] = ['sr', 'en'];
export const DEFAULT_LOCALE: Locale = 'sr';
export const LOCALE_COOKIE = 'lang';

const dictionaries: Record<Locale, Dictionary> = { sr, en };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
