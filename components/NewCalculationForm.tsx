'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { Calculation } from '@/lib/types';
import styles from './NewCalculationForm.module.scss';

export function NewCalculationForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('Naziv je obavezan.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? 'Greška pri kreiranju kalkulacije.');
        setSubmitting(false);
        return;
      }
      const calc: Calculation = await response.json();
      router.push(`/kalkulacije/${calc.id}`);
    } catch {
      setError('Greška u komunikaciji sa serverom.');
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="new-calc-name">
        Naziv nove kalkulacije
      </label>
      <div className={styles.row}>
        <input
          id="new-calc-name"
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="npr. Stan u Novom Sadu"
          aria-invalid={error ? true : undefined}
          disabled={submitting}
          maxLength={80}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Kreiram…' : 'Kreiraj'}
        </button>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </form>
  );
}
