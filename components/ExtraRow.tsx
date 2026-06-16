'use client';

import { useEffect, useMemo, useState } from 'react';
import { propertyExtraSchema } from '@/lib/schemas';
import type { PropertyExtra } from '@/lib/types';
import { FieldError } from './FieldError';
// Reuses the loan/capital card styles — extra cards share the same visual layout.
import styles from './CalculationForm.module.scss';

type Props = {
  extra: PropertyExtra;
  isNew: boolean;
  onApply: (extra: PropertyExtra) => void;
  onRemove: () => void;
};

export function ExtraRow({ extra, isNew, onApply, onRemove }: Props) {
  const [draft, setDraft] = useState<PropertyExtra>(extra);
  const [editing, setEditing] = useState<boolean>(isNew);

  useEffect(() => {
    setDraft(extra);
  }, [extra]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(extra),
    [draft, extra],
  );

  const textError = useMemo(() => {
    const result = propertyExtraSchema.safeParse(draft);
    if (result.success) return undefined;
    return result.error.issues.find((issue) => issue.path[0] === 'text')?.message;
  }, [draft]);

  const isValid = !textError;

  function handleApply() {
    if (!isValid) return;
    onApply(draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(extra);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className={styles.loanCard}>
        <div className={styles.loanCardHeader}>
          <div className={styles.loanCardTitle}>
            <span className={styles.loanLabel}>{extra.text}</span>
          </div>
          <div className={styles.loanCardActions}>
            <button type="button" className="secondary" onClick={() => setEditing(true)}>
              Izmeni
            </button>
            <button
              type="button"
              className={styles.removeButton}
              onClick={onRemove}
              title="Ukloni stavku"
            >
              Ukloni
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.loanCard} ${styles.loanCardEditing}`}>
      <div className={styles.loanRow}>
        <div className={styles.field}>
          <label htmlFor={`extra-${extra.id}-text`}>Stavka</label>
          <input
            id={`extra-${extra.id}-text`}
            type="text"
            maxLength={120}
            placeholder="npr. Garažno mesto"
            value={draft.text}
            onChange={(e) => setDraft((prev) => ({ ...prev, text: e.target.value }))}
            aria-invalid={textError ? true : undefined}
          />
          <FieldError message={textError} />
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
            title="Ukloni stavku"
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
