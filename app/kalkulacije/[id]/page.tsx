import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalculationForm } from '@/components/CalculationForm';
import { CalculationNotFoundError, readCalculation } from '@/lib/storage';
import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function CalculationPage({ params }: Props) {
  const { id } = await params;
  try {
    const calc = await readCalculation(id);
    return (
      <main className={styles.page}>
        <div className={styles.breadcrumbs}>
          <Link href="/" className={styles.backButton}>
            ← Sve kalkulacije
          </Link>
        </div>
        <CalculationForm initial={calc} />
      </main>
    );
  } catch (err) {
    if (err instanceof CalculationNotFoundError) notFound();
    throw err;
  }
}
