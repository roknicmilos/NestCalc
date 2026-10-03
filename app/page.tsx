import { notFound } from 'next/navigation';
import { CalculationForm } from '@/components/CalculationForm';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getDictionary } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';
import { CalculationNotFoundError, readCalculation } from '@/lib/storage';
import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const t = getDictionary(await getLocale());
  try {
    const calc = await readCalculation();
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t.app.title}</h1>
          <LanguageSwitcher />
        </header>
        <CalculationForm initial={calc} />
      </main>
    );
  } catch (err) {
    if (err instanceof CalculationNotFoundError) notFound();
    throw err;
  }
}
