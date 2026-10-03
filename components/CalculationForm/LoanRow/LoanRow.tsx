'use client';

import { useLocale, useT } from '@/lib/i18n/I18nProvider';
import { useEffect, useMemo, useState } from 'react';
import {
  defaultInterestRateForLoanType,
  defaultLoanLabel,
  isDefaultLoanLabel,
} from '@/lib/defaults';
import { computeLoan } from '@/lib/calc/loanComputation';
import { loanSchema } from '@/lib/schemas';
import type { Loan, LoanType, MonthYear } from '@/lib/types';
import { formatEur, formatMonthYear, formatMonthsAsYearsAndMonths, formatRsd } from '@/lib/format';
import { FieldError } from '@/components/FieldError';
import { MonthYearInput } from '../MonthYearInput';
import styles from '../CalculationForm.module.scss';
import { IconButton } from '@/components/IconButton';

const LOAN_TYPES: LoanType[] = ['CASH_LOAN', 'PRIVATE_LOAN'];

type Props = {
  loan: Loan;
  isNew: boolean;
  /** EUR→RSD rate; used to show secondary RSD amounts for keš kredit. */
  eurToRsdRate: number;
  onApply: (loan: Loan) => void;
  onRemove: () => void;
};

type DraftErrors = Partial<Record<keyof Loan, string>>;

export function LoanRow({ loan, isNew, eurToRsdRate, onApply, onRemove }: Props) {
  const locale = useLocale();
  const t = useT();
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
      if (isDefaultLoanLabel(prev.label, prev.type)) {
        next.label = defaultLoanLabel(newType, t);
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
    const { monthlyPayment, totalInterest } = computeLoan(loan);
    const showRsd = loan.type === 'CASH_LOAN';
    return (
      <div className={styles.loanCard}>
        <div className={styles.loanCardHeader}>
          <div className={styles.loanCardTitle}>
            <span className={styles.loanTypeBadge}>{t.loanType[loan.type]}</span>
            <span className={styles.loanLabel}>{loan.label}</span>
          </div>
          <div className={styles.loanCardActions}>
            <IconButton icon="edit" label={t.common.edit} onClick={() => setEditing(true)} />
            <IconButton icon="remove" label={t.common.remove} onClick={onRemove} />
          </div>
        </div>
        <dl className={styles.loanCardDetails}>
          <div>
            <dt>{t.loanRow.amount}</dt>
            <dd>
              {formatEur(locale, loan.amount)}
              {showRsd ? (
                <span className={styles.rsdAmount}>
                  {formatRsd(locale, loan.amount, eurToRsdRate)}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>{t.loanRow.interestRate}</dt>
            <dd>{loan.interestRatePct} %</dd>
          </div>
          <div>
            <dt>{t.loanRow.repaymentStart}</dt>
            <dd>{formatMonthYear(locale, loan.startMonth)}</dd>
          </div>
          <div>
            <dt>{t.loanRow.repaymentTerm}</dt>
            <dd>{formatMonthsAsYearsAndMonths(locale, loan.termMonths)}</dd>
          </div>
          <div>
            <dt>{t.loanRow.monthlyPayment}</dt>
            <dd>
              {formatEur(locale, monthlyPayment)}
              {showRsd ? (
                <span className={styles.rsdAmount}>
                  {formatRsd(locale, monthlyPayment, eurToRsdRate)}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>{t.loanRow.totalInterest}</dt>
            <dd>
              {formatEur(locale, totalInterest)}
              {showRsd ? (
                <span className={styles.rsdAmount}>
                  {formatRsd(locale, totalInterest, eurToRsdRate)}
                </span>
              ) : null}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div className={`${styles.loanCard} ${styles.loanCardEditing}`}>
      <div className={styles.loanRow}>
        <div className={styles.field}>
          <label htmlFor={`loan-${loan.id}-type`}>{t.loanRow.type}</label>
          <select
            id={`loan-${loan.id}-type`}
            value={draft.type}
            onChange={(e) => handleTypeChange(e.target.value as LoanType)}
          >
            {LOAN_TYPES.map((type) => (
              <option key={type} value={type}>
                {t.loanType[type]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor={`loan-${loan.id}-label`}>{t.loanRow.name}</label>
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
          <label htmlFor={`loan-${loan.id}-amount`}>{t.loanRow.amountEur}</label>
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
          <label htmlFor={`loan-${loan.id}-rate`}>{t.loanRow.interestRatePct}</label>
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
          <label htmlFor={`loan-${loan.id}-start`}>{t.loanRow.repaymentStart}</label>
          <MonthYearInput
            id={`loan-${loan.id}-start`}
            value={draft.startMonth}
            onChange={(value: MonthYear) => updateField('startMonth', value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`loan-${loan.id}-term`}>{t.loanRow.termMonths}</label>
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
