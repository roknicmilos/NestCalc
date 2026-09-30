'use client';

import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE, LOCALES, type Locale } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/I18nProvider';
import styles from './LanguageSwitcher.module.scss';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  const t = useT();

  function select(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    router.refresh();
  }

  return (
    <div className={styles.switcher} role="group" aria-label={t.language.label}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          className={styles.option}
          aria-pressed={l === locale}
          title={t.language[l]}
          onClick={() => select(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
