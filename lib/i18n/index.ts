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

/** Looks up a schema validation message key; unknown messages are shown as-is. */
export function translateMessage(t: Dictionary, message: string): string {
  return (t.validation as Record<string, string>)[message] ?? message;
}

/** Display name of a computed phase component: the synthetic mortgage and PPAP
 * savings rows are translated, user-defined loans keep their stored label. */
export function componentLabel(c: { loanId: string; label: string }, t: Dictionary): string {
  if (c.loanId === 'mortgage') return t.computed.mortgage;
  if (c.loanId === 'ppap-savings') return t.computed.ppapSavings;
  return c.label;
}
