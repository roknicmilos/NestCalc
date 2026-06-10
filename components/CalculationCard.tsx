'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatDateTime } from '@/lib/format';
import type { CalculationSummary } from '@/lib/types';
import styles from './CalculationCard.module.scss';

export function CalculationCard({ calc }: { calc: CalculationSummary }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    const ok = window.confirm(`Obrisati kalkulaciju "${calc.name}"? Ova radnja je trajna.`);
    if (!ok) return;
    setDeleting(true);
    const response = await fetch(`/api/calculations/${calc.id}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) {
      window.alert('Greška pri brisanju kalkulacije.');
      setDeleting(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className={styles.card}>
      <div>
        <Link className={styles.title} href={`/kalkulacije/${calc.id}`}>
          {calc.name}
        </Link>
        <div className={styles.meta}>Izmena: {formatDateTime(calc.updatedAt)}</div>
      </div>
      <div className={styles.actions}>
        <button type="button" className="danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Brišem…' : 'Obriši'}
        </button>
      </div>
    </div>
  );
}
