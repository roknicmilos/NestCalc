import { CalculationCard } from '@/components/CalculationCard';
import { NewCalculationForm } from '@/components/NewCalculationForm';
import { listCalculations } from '@/lib/storage';
import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const calculations = await listCalculations();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>NestCalc</h1>
        <p className={styles.subtitle}>
          Kalkulator stvarnih troškova i mesečnih rata pri kupovini nekretnine.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Nova kalkulacija</h2>
        <NewCalculationForm />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Postojeće kalkulacije</h2>
        {calculations.length === 0 ? (
          <p className={styles.empty}>Još nemate sačuvanih kalkulacija.</p>
        ) : (
          <ul className={styles.list}>
            {calculations.map((calc) => (
              <li key={calc.id}>
                <CalculationCard calc={calc} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
