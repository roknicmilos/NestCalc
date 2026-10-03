'use client';

import { useLocale, useT } from '@/lib/i18n/I18nProvider';
import { useEffect, useMemo, useState } from 'react';
import { incomeSourceSchema } from '@/lib/schemas';
import type { IncomeSource, MonthYear } from '@/lib/types';
import { formatEur, formatMonthYear } from '@/lib/format';
import { FieldError } from '@/components/FieldError';
import { MonthYearInput } from '../MonthYearInput';
// Reuses the loan/capital card styles — income cards share the same visual layout.
import styles from '../CalculationForm.module.scss';
import { IconButton } from '@/components/IconButton';

type Props = {
  source: IncomeSource;
  isNew: boolean;
  onApply: (source: IncomeSource) => void;
  onRemove: () => void;
};

type DraftErrors = Partial<Record<keyof IncomeSource, string>>;

export function IncomeSourceRow({ source, isNew, onApply, onRemove }: Props) {
  const t = useT();
  const locale = useLocale();
  const [draft, setDraft] = useState<IncomeSource>(source);
  const [editing, setEditing] = useState<boolean>(isNew);

  useEffect(() => {
    setDraft(source);
  }, [source]);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(source), [draft, source]);

  const errors: DraftErrors = useMemo(() => {
    const result = incomeSourceSchema.safeParse(draft);
    if (result.success) return {};
    const errs: DraftErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof IncomeSource | undefined;
      if (key && !errs[key]) errs[key] = issue.message;
    }
    return errs;
  }, [draft]);

  const isValid = Object.keys(errors).length === 0;

  function updateField<K extends keyof IncomeSource>(key: K, value: IncomeSource[K]) {
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
            <IconButton icon="edit" label={t.common.edit} onClick={() => setEditing(true)} />
            <IconButton icon="remove" label={t.incomeRow.removeSource} onClick={onRemove} />
          </div>
        </div>
        <dl className={styles.loanCardDetails}>
          <div>
            <dt>{t.incomeRow.monthlyAmount}</dt>
            <dd>{formatEur(locale, source.monthlyAmount)}</dd>
          </div>
          <div>
            <dt>{t.incomeRow.start}</dt>
            <dd>{formatMonthYear(locale, source.startMonth)}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div className={`${styles.loanCard} ${styles.loanCardEditing}`}>
      <div className={styles.loanRow}>
        <div className={styles.field}>
          <label htmlFor={`income-${source.id}-label`}>{t.incomeRow.name}</label>
          <input
            id={`income-${source.id}-label`}
            type="text"
            value={draft.label}
            onChange={(e) => updateField('label', e.target.value)}
            aria-invalid={errors.label ? true : undefined}
          />
          <FieldError message={errors.label} />
        </div>

        <div className={styles.field}>
          <label htmlFor={`income-${source.id}-amount`}>{t.incomeRow.monthlyAmountEur}</label>
          <input
            id={`income-${source.id}-amount`}
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            value={Number.isFinite(draft.monthlyAmount) ? draft.monthlyAmount : 0}
            onChange={(e) => updateField('monthlyAmount', e.target.valueAsNumber)}
            aria-invalid={errors.monthlyAmount ? true : undefined}
          />
          <FieldError message={errors.monthlyAmount} />
        </div>

        <div className={styles.field}>
          <label htmlFor={`income-${source.id}-start`}>{t.incomeRow.start}</label>
          <MonthYearInput
            id={`income-${source.id}-start`}
            value={draft.startMonth}
            onChange={(value: MonthYear) => updateField('startMonth', value)}
          />
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
          <IconButton icon="remove" label={t.incomeRow.removeSource} onClick={onRemove} />
          <button type="button" onClick={handleApply} disabled={!isValid || !isDirty}>
            {t.common.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
