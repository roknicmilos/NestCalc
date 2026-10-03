'use client';

import { useLocale, useT } from '@/lib/i18n/I18nProvider';
import { useEffect, useMemo, useState } from 'react';
import { furnishingItemSchema } from '@/lib/schemas';
import type { FurnishingCategory, FurnishingItem } from '@/lib/types';
import { formatEur } from '@/lib/format';
import { FieldError } from '@/components/FieldError';
import styles from '../CalculationForm.module.scss';
import { IconButton } from '@/components/IconButton';

const CATEGORIES: FurnishingCategory[] = ['interior', 'exterior'];

type Props = {
  item: FurnishingItem;
  isNew: boolean;
  onApply: (item: FurnishingItem) => void;
  onRemove: () => void;
};

type DraftErrors = Partial<Record<keyof FurnishingItem, string>>;

export function FurnishingRow({ item, isNew, onApply, onRemove }: Props) {
  const locale = useLocale();
  const t = useT();
  const [draft, setDraft] = useState<FurnishingItem>(item);
  const [editing, setEditing] = useState<boolean>(isNew);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(item), [draft, item]);

  const errors: DraftErrors = useMemo(() => {
    const result = furnishingItemSchema.safeParse(draft);
    if (result.success) return {};
    const errs: DraftErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof FurnishingItem | undefined;
      if (key && !errs[key]) errs[key] = issue.message;
    }
    return errs;
  }, [draft]);

  const isValid = Object.keys(errors).length === 0;

  function updateField<K extends keyof FurnishingItem>(key: K, value: FurnishingItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleApply() {
    if (!isValid) return;
    onApply(draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(item);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className={styles.loanCard}>
        <div className={styles.loanCardHeader}>
          <div className={styles.loanCardTitle}>
            <span className={styles.loanTypeBadge}>{t.furnishingCategory[item.category]}</span>
            <span className={styles.loanLabel}>{item.label}</span>
          </div>
          <div className={styles.loanCardActions}>
            <IconButton icon="edit" label={t.common.edit} onClick={() => setEditing(true)} />
            <IconButton icon="remove" label={t.common.remove} onClick={onRemove} />
          </div>
        </div>
        <dl className={styles.loanCardDetails}>
          <div>
            <dt>{t.furnishing.price}</dt>
            <dd>{formatEur(locale, item.price)}</dd>
          </div>
          {item.description ? (
            <div>
              <dt>{t.furnishing.description}</dt>
              <dd>{item.description}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    );
  }

  return (
    <div className={`${styles.loanCard} ${styles.loanCardEditing}`}>
      <div className={styles.loanRow}>
        <div className={styles.field}>
          <label htmlFor={`furnishing-${item.id}-category`}>{t.furnishing.category}</label>
          <select
            id={`furnishing-${item.id}-category`}
            value={draft.category}
            onChange={(e) => updateField('category', e.target.value as FurnishingCategory)}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t.furnishingCategory[category]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor={`furnishing-${item.id}-label`}>{t.furnishing.name}</label>
          <input
            id={`furnishing-${item.id}-label`}
            type="text"
            placeholder={t.furnishing.namePlaceholder}
            value={draft.label}
            onChange={(e) => updateField('label', e.target.value)}
            aria-invalid={errors.label ? true : undefined}
          />
          <FieldError message={errors.label} />
        </div>

        <div className={styles.field}>
          <label htmlFor={`furnishing-${item.id}-price`}>{t.furnishing.priceEur}</label>
          <input
            id={`furnishing-${item.id}-price`}
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            value={Number.isFinite(draft.price) ? draft.price : 0}
            onChange={(e) => updateField('price', e.target.valueAsNumber)}
            aria-invalid={errors.price ? true : undefined}
          />
          <FieldError message={errors.price} />
        </div>

        <div className={styles.field}>
          <label htmlFor={`furnishing-${item.id}-description`}>{t.furnishing.description}</label>
          <input
            id={`furnishing-${item.id}-description`}
            type="text"
            placeholder={t.furnishing.descriptionPlaceholder}
            value={draft.description}
            onChange={(e) => updateField('description', e.target.value)}
            aria-invalid={errors.description ? true : undefined}
          />
          <FieldError message={errors.description} />
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
          <IconButton icon="remove" label={t.common.remove} onClick={onRemove} />
          <button type="button" onClick={handleApply} disabled={!isValid || !isDirty}>
            {t.common.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
