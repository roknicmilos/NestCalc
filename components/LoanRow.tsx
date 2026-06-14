'use client';

import { useEffect, useMemo, useState } from 'react';
import { defaultInterestRateForLoanType, defaultLoanLabel } from '@/lib/defaults';
import { computeLoan } from '@/lib/calc/loanComputation';
import { loanSchema } from '@/lib/schemas';
import type { Loan, LoanType, MonthYear } from '@/lib/types';
import { formatEur, formatMonthYear, formatMonthsAsYearsAndMonths } from '@/lib/format';
import { FieldError } from './FieldError';
import { MonthYearInput } from './MonthYearInput';
import styles from './CalculationForm.module.scss';

const LOAN_TYPE_OPTIONS: { value: LoanType; label: string }[] = [
  { value: 'CASH_LOAN', label: 'KEŠ KREDIT' },
  { value: 'PRIVATE_LOAN', label: 'POZAJMICA' },
];

const LOAN_TYPE_LABEL: Record<LoanType, string> = {
  CASH_LOAN: 'KEŠ KREDIT',
  PRIVATE_LOAN: 'POZAJMICA',
};

type Props = {
  loan: Loan;
  isNew: boolean;
  onApply: (loan: Loan) => void;
  onRemove: () => void;
};

type DraftErrors = Partial<Record<keyof Loan, string>>;

export function LoanRow({ loan, isNew, onApply, onRemove }: Props) {
  const [draft, setDraft] = useState<Loan>(loan);
  const [editing, setEditing] = useState<boolean>(isNew);

  useEffect(() => {
    setDraft(loan);
  }, [loan]);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(loan), [draft, loan]);

  const errors: DraftErrors = useMemo(() => {
    const result = loanSchema.safeParse(draft);
    if (result.success) return {};
    const errs: DraftErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof Loan | undefined;
      if (key && !errs[key]) errs[key] = issue.message;
    }
    return errs;
  }, [draft]);

  const isValid = Object.keys(errors).length === 0;

  function updateField<K extends keyof Loan>(key: K, value: Loan[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleTypeChange(newType: LoanType) {
    setDraft((prev) => {
      const next = { ...prev, type: newType };
      if (prev.interestRatePct === defaultInterestRateForLoanType(prev.type)) {
        next.interestRatePct = defaultInterestRateForLoanType(newType);
      }
      if (prev.label === defaultLoanLabel(prev.type)) {
        next.label = defaultLoanLabel(newType);
      }
      return next;
    });
  }

  function handleApply() {
    if (!isValid) return;
    onApply(draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(loan);
    setEditing(false);
  }

  if (!editing) {
    const { totalInterest } = computeLoan(loan);
    return (
      <div className={styles.loanCard}>
        <div className={styles.loanCardHeader}>
          <div className={styles.loanCardTitle}>
            <span className={styles.loanTypeBadge}>{LOAN_TYPE_LABEL[loan.type]}</span>
            <span className={styles.loanLabel}>{loan.label}</span>
          </div>
          <div className={styles.loanCardActions}>
            <button type="button" className="secondary" onClick={() => setEditing(true)}>
              Izmeni
            </button>
            <button type="button" className={styles.removeButton} onClick={onRemove}>
              Ukloni
            </button>
          </div>
        </div>
        <dl className={styles.loanCardDetails}>
          <div>
            <dt>Iznos</dt>
            <dd>{formatEur(loan.amount)}</dd>
          </div>
          <div>
            <dt>Kamatna stopa</dt>
            <dd>{loan.interestRatePct} %</dd>
          </div>
          <div>
            <dt>Početak otplate</dt>
            <dd>{formatMonthYear(loan.startMonth)}</dd>
          </div>
          <div>
            <dt>Rok otplate</dt>
            <dd>{formatMonthsAsYearsAndMonths(loan.termMonths)}</dd>
          </div>
          <div>
            <dt>Ukupna kamata</dt>
            <dd>{formatEur(totalInterest)}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div className={`${styles.loanCard} ${styles.loanCardEditing}`}>
      <div className={styles.loanRow}>
        <div className={styles.field}>
          <label htmlFor={`loan-${loan.id}-type`}>Tip</label>
          <select
            id={`loan-${loan.id}-type`}
            value={draft.type}
            onChange={(e) => handleTypeChange(e.target.value as LoanType)}
          >
            {LOAN_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor={`loan-${loan.id}-label`}>Naziv</label>
          <input
            id={`loan-${loan.id}-label`}
            type="text"
            value={draft.label}
            onChange={(e) => updateField('label', e.target.value)}
            aria-invalid={errors.label ? true : undefined}
          />
          <FieldError message={errors.label} />
        </div>

        <div className={styles.field}>
          <label htmlFor={`loan-${loan.id}-amount`}>Iznos (EUR)</label>
          <input
            id={`loan-${loan.id}-amount`}
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

        <div className={styles.field}>
          <label htmlFor={`loan-${loan.id}-rate`}>Kamatna stopa (%)</label>
          <input
            id={`loan-${loan.id}-rate`}
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            max={100}
            value={Number.isFinite(draft.interestRatePct) ? draft.interestRatePct : 0}
            onChange={(e) => updateField('interestRatePct', e.target.valueAsNumber)}
            aria-invalid={errors.interestRatePct ? true : undefined}
          />
          <FieldError message={errors.interestRatePct} />
        </div>

        <div className={styles.field}>
          <label htmlFor={`loan-${loan.id}-start`}>Početak otplate</label>
          <MonthYearInput
            id={`loan-${loan.id}-start`}
            value={draft.startMonth}
            onChange={(value: MonthYear) => updateField('startMonth', value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`loan-${loan.id}-term`}>Broj meseci otplate</label>
          <input
            id={`loan-${loan.id}-term`}
            type="number"
            inputMode="numeric"
            step="1"
            min={1}
            value={Number.isFinite(draft.termMonths) ? draft.termMonths : 0}
            onChange={(e) => updateField('termMonths', e.target.valueAsNumber)}
            aria-invalid={errors.termMonths ? true : undefined}
          />
          <FieldError message={errors.termMonths} />
        </div>
      </div>

      <div className={styles.loanEditFooter}>
        {!isValid ? <span className={styles.loanFooterHint}>Ispravite greške pre primene.</span> : null}
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
