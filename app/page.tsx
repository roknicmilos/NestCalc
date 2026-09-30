import { notFound } from 'next/navigation';
import { CalculationForm } from '@/components/CalculationForm';
import { CALCULATION_ID } from '@/lib/config';
import { CalculationNotFoundError, readCalculation } from '@/lib/storage';
import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  try {
    const calc = await readCalculation(CALCULATION_ID);
    return (
      <main className={styles.page}>
        <CalculationForm initial={calc} />
      </main>
    );
  } catch (err) {
    if (err instanceof CalculationNotFoundError) notFound();
    throw err;
  }
}
