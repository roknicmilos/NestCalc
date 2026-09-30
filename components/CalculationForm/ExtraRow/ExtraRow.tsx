'use client';

import { useT } from '@/lib/i18n/I18nProvider';
import { useEffect, useMemo, useState } from 'react';
import { propertyExtraSchema } from '@/lib/schemas';
import type { PropertyExtra } from '@/lib/types';
import { FieldError } from '@/components/FieldError';
// Reuses the loan/capital card styles — extra cards share the same visual layout.
import styles from '../CalculationForm.module.scss';

type Props = {
  extra: PropertyExtra;
  isNew: boolean;
  onApply: (extra: PropertyExtra) => void;
  onRemove: () => void;
};

export function ExtraRow({ extra, isNew, onApply, onRemove }: Props) {
  const t = useT();
  const [draft, setDraft] = useState<PropertyExtra>(extra);
  const [editing, setEditing] = useState<boolean>(isNew);

  useEffect(() => {
    setDraft(extra);
  }, [extra]);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(extra), [draft, extra]);

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
              {t.common.edit}
            </button>
            <button
              type="button"
              className={styles.removeButton}
              onClick={onRemove}
              title={t.extraRow.removeItem}
            >
              {t.common.remove}
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
          <label htmlFor={`extra-${extra.id}-text`}>{t.extraRow.item}</label>
          <input
            id={`extra-${extra.id}-text`}
            type="text"
            maxLength={120}
            placeholder={t.extraRow.placeholder}
            value={draft.text}
            onChange={(e) => setDraft((prev) => ({ ...prev, text: e.target.value }))}
            aria-invalid={textError ? true : undefined}
          />
          <FieldError message={textError} />
        </div>
      </div>

      <div className={styles.loanEditFooter}>
        {!isValid ? <span className={styles.loanFooterHint}>{t.common.fixErrors}</span> : null}
        {isValid && isDirty ? (
          <span className={styles.loanFooterHint}>{t.common.unapplied}</span>
        ) : null}
        <div className={styles.loanFooterActions}>
          {!isNew ? (
            <button type="button" className="secondary" onClick={handleCancel}>
              {t.common.cancelChanges}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.removeButton}
            onClick={onRemove}
            title={t.extraRow.removeItem}
          >
            {t.common.remove}
          </button>
          <button type="button" onClick={handleApply} disabled={!isValid || !isDirty}>
            {t.common.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
