'use client';

import { useEffect, useMemo, useState } from 'react';
import { capitalSourceSchema } from '@/lib/schemas';
import type { CapitalSource } from '@/lib/types';
import { formatEur } from '@/lib/format';
import { FieldError } from './FieldError';
// Reuses the loan card styles — capital source cards share the same visual layout.
import styles from './CalculationForm.module.scss';

type Props = {
  source: CapitalSource;
  isNew: boolean;
  canRemove: boolean;
  onApply: (source: CapitalSource) => void;
  onRemove: () => void;
};

type DraftErrors = Partial<Record<keyof CapitalSource, string>>;

export function CapitalSourceRow({ source, isNew, canRemove, onApply, onRemove }: Props) {
  const [draft, setDraft] = useState<CapitalSource>(source);
  const [editing, setEditing] = useState<boolean>(isNew);

  useEffect(() => {
    setDraft(source);
  }, [source]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(source),
    [draft, source],
  );

  const errors: DraftErrors = useMemo(() => {
    const result = capitalSourceSchema.safeParse(draft);
    if (result.success) return {};
    const errs: DraftErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof CapitalSource | undefined;
      if (key && !errs[key]) errs[key] = issue.message;
    }
    return errs;
  }, [draft]);

  const isValid = Object.keys(errors).length === 0;
  const removeDisabled = !canRemove && !isNew;
  const removeTitle = removeDisabled ? 'Mora postojati barem jedan izvor.' : 'Ukloni izvor';

  function updateField<K extends keyof CapitalSource>(key: K, value: CapitalSource[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleApply() {
    if (!isValid) return;
    onApply(draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(source);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className={styles.loanCard}>
        <div className={styles.loanCardHeader}>
          <div className={styles.loanCardTitle}>
            <span className={styles.loanLabel}>{source.label}</span>
          </div>
          <div className={styles.loanCardActions}>
            <button type="button" className="secondary" onClick={() => setEditing(true)}>
              Izmeni
            </button>
            <button
              type="button"
              className={styles.removeButton}
              onClick={onRemove}
              disabled={!canRemove}
              title={!canRemove ? 'Mora postojati barem jedan izvor.' : 'Ukloni izvor'}
            >
              Ukloni
            </button>
          </div>
        </div>
        <dl className={styles.loanCardDetails}>
          <div>
            <dt>Iznos</dt>
            <dd>{formatEur(source.amount)}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div className={`${styles.loanCard} ${styles.loanCardEditing}`}>
      <div className={styles.loanRow}>
        <div className={styles.field}>
          <label htmlFor={`cap-${source.id}-label`}>Izvor</label>
          <input
            id={`cap-${source.id}-label`}
            type="text"
            value={draft.label}
            onChange={(e) => updateField('label', e.target.value)}
            aria-invalid={errors.label ? true : undefined}
          />
          <FieldError message={errors.label} />
        </div>

        <div className={styles.field}>
          <label htmlFor={`cap-${source.id}-amount`}>Iznos (EUR)</label>
          <input
            id={`cap-${source.id}-amount`}
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            value={Number.isFinite(draft.amount) ? draft.amount : 0}
            onChange={(e) => updateField('amount', e.target.valueAsNumber)}
            aria-invalid={errors.amount ? true : undefined}
          />
          <FieldError message={errors.amount} />
        </div>
      </div>

      <div className={styles.loanEditFooter}>
        {!isValid ? (
          <span className={styles.loanFooterHint}>Ispravite greške pre primene.</span>
        ) : null}
        {isValid && isDirty ? (
          <span className={styles.loanFooterHint}>Izmene još nisu primenjene.</span>
        ) : null}
        <div className={styles.loanFooterActions}>
          {!isNew ? (
            <button type="button" className="secondary" onClick={handleCancel}>
              Otkaži izmene
            </button>
          ) : null}
          <button
            type="button"
            className={styles.removeButton}
            onClick={onRemove}
            disabled={removeDisabled}
            title={removeTitle}
          >
            Ukloni
          </button>
          <button type="button" onClick={handleApply} disabled={!isValid || !isDirty}>
            Primeni
          </button>
        </div>
      </div>
    </div>
  );
}
