'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
  type Control,
  type SubmitHandler,
} from 'react-hook-form';
import { computeTotals } from '@/lib/calc';
import { createDefaultLoan } from '@/lib/defaults';
import { calculationInputsSchema } from '@/lib/schemas';
import type { Calculation, CalculationInputs, ComputedTotals, Loan } from '@/lib/types';
import { z } from 'zod';
import { ComputedSummary } from './ComputedSummary';
import { FieldError } from './FieldError';
import { LoanRow } from './LoanRow';
import { MonthYearInput } from './MonthYearInput';
import { PhasesTimeline } from './PhasesTimeline';
import type { CalculationFormValues } from './calculation-form-types';
import { nanoid } from 'nanoid';
import styles from './CalculationForm.module.scss';

const formSchema = z.object({
  name: z.string().trim().min(1, 'Naziv je obavezan.').max(80, 'Naziv je predugačak.'),
  inputs: calculationInputsSchema,
});

type Props = { initial: Calculation };

export function CalculationForm({ initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const methods = useForm<CalculationFormValues>({
    defaultValues: { name: initial.name, inputs: initial.inputs },
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = methods;

  const watched = useWatch({ control });

  const totals: ComputedTotals | null = useMemo(() => {
    const parsed = calculationInputsSchema.safeParse(watched?.inputs);
    if (!parsed.success) return null;
    try {
      return computeTotals(parsed.data as CalculationInputs);
    } catch {
      return null;
    }
  }, [watched]);

  const onSubmit: SubmitHandler<CalculationFormValues> = async (values) => {
    setSaveError(null);
    setSaving(true);
    const payload: Calculation = {
      id: initial.id,
      name: values.name.trim(),
      createdAt: initial.createdAt,
      updatedAt: new Date().toISOString(),
      inputs: values.inputs,
    };
    try {
      const response = await fetch(`/api/calculations/${initial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setSaveError(body.error ?? 'Greška pri čuvanju kalkulacije.');
        setSaving(false);
        return;
      }
      const stored: Calculation = await response.json();
      reset({ name: stored.name, inputs: stored.inputs });
      router.refresh();
    } catch {
      setSaveError('Greška u komunikaciji sa serverom.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.headerBar}>
          <div className={styles.headerName}>
            <label htmlFor="calc-name">Naziv kalkulacije</label>
            <input id="calc-name" type="text" maxLength={80} {...register('name')} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className={styles.headerActions}>
            {isDirty ? (
              <span className={styles.dirtyIndicator}>Imate nesačuvane izmene</span>
            ) : (
              <span className={styles.cleanIndicator}>Sve izmene su sačuvane</span>
            )}
            <button type="submit" disabled={!isDirty || !isValid || saving}>
              {saving ? 'Čuvam…' : 'Sačuvaj'}
            </button>
          </div>
        </div>

        {saveError ? (
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-4)' }}>
            {saveError}
          </p>
        ) : null}

        <div className={styles.layout}>
          <div className={styles.formColumn}>
            <BasicsFieldset />
            <CapitalSourcesFieldset />
            <MortgageFieldset />
            <ManualLoansFieldset />
          </div>
          <div className={styles.summaryColumn}>
            <ComputedSummary totals={totals} />
            <PhasesTimeline totals={totals} />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

function BasicsFieldset() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContextTyped();
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Osnovni podaci</legend>
      <div className={styles.grid2}>
        <div className={styles.field}>
          <label htmlFor="property-price">Ukupna cena nekretnine</label>
          <div className={styles.fieldWithSuffix}>
            <input
              id="property-price"
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              {...register('inputs.propertyPrice', { valueAsNumber: true })}
            />
            <span className={styles.suffix}>EUR</span>
          </div>
          <FieldError message={errors.inputs?.propertyPrice?.message} />
        </div>

        <div className={styles.field}>
          <label htmlFor="seller">Prodavac</label>
          <Controller
            control={control as Control<CalculationFormValues>}
            name="inputs.seller"
            render={({ field }) => (
              <select
                id="seller"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              >
                <option value="INDIVIDUAL">Fizičko lice</option>
                <option value="INVESTOR">Investitor</option>
              </select>
            )}
          />
          <FieldError message={errors.inputs?.seller?.message} />
        </div>

        <div className={styles.field}>
          <label htmlFor="purchase-costs">Fiksni troškovi kupovine (notar, advokat…)</label>
          <div className={styles.fieldWithSuffix}>
            <input
              id="purchase-costs"
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              {...register('inputs.purchaseCostsFixed', { valueAsNumber: true })}
            />
            <span className={styles.suffix}>EUR</span>
          </div>
          <FieldError message={errors.inputs?.purchaseCostsFixed?.message} />
        </div>
      </div>
    </fieldset>
  );
}

function CapitalSourcesFieldset() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContextTyped();
  const { fields, append, remove } = useFieldArray({ control, name: 'inputs.capitalSources' });

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Početni kapital</legend>
      <div className={styles.repeaterList}>
        {fields.map((field, index) => {
          const rowErrors = errors.inputs?.capitalSources?.[index];
          return (
            <div key={field.id} className={styles.repeaterRow}>
              <div className={styles.field}>
                <label htmlFor={`cap-${index}-label`}>Izvor</label>
                <input
                  id={`cap-${index}-label`}
                  type="text"
                  defaultValue={field.label}
                  {...register(`inputs.capitalSources.${index}.label`)}
                />
                <FieldError message={rowErrors?.label?.message} />
              </div>
              <div className={styles.field}>
                <label htmlFor={`cap-${index}-amount`}>Iznos</label>
                <div className={styles.fieldWithSuffix}>
                  <input
                    id={`cap-${index}-amount`}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={0}
                    defaultValue={field.amount}
                    {...register(`inputs.capitalSources.${index}.amount`, {
                      valueAsNumber: true,
                    })}
                  />
                  <span className={styles.suffix}>EUR</span>
                </div>
                <FieldError message={rowErrors?.amount?.message} />
              </div>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                title={
                  fields.length === 1 ? 'Mora postojati barem jedan izvor.' : 'Ukloni izvor'
                }
              >
                Ukloni
              </button>
            </div>
          );
        })}
      </div>
      <div className={styles.repeaterControls}>
        <button
          type="button"
          className="secondary"
          onClick={() => append({ id: nanoid(8), label: 'Novi izvor', amount: 0 })}
        >
          Dodaj izvor
        </button>
      </div>
    </fieldset>
  );
}

function MortgageFieldset() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContextTyped();
  const mortgageErrors = errors.inputs?.mortgage;

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Stambeni kredit</legend>
      <div className={styles.grid3}>
        <div className={styles.field}>
          <label htmlFor="mortgage-downpayment">Procenat učešća</label>
          <div className={styles.fieldWithSuffix}>
            <input
              id="mortgage-downpayment"
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              max={100}
              {...register('inputs.mortgage.downPaymentPct', { valueAsNumber: true })}
            />
            <span className={styles.suffix}>%</span>
          </div>
          <FieldError message={mortgageErrors?.downPaymentPct?.message} />
        </div>
        <div className={styles.field}>
          <label htmlFor="mortgage-rate">Kamatna stopa (NKS)</label>
          <div className={styles.fieldWithSuffix}>
            <input
              id="mortgage-rate"
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              max={100}
              {...register('inputs.mortgage.interestRatePct', { valueAsNumber: true })}
            />
            <span className={styles.suffix}>%</span>
          </div>
          <FieldError message={mortgageErrors?.interestRatePct?.message} />
        </div>
        <div className={styles.field}>
          <label htmlFor="mortgage-term">Rok otplate</label>
          <div className={styles.fieldWithSuffix}>
            <input
              id="mortgage-term"
              type="number"
              inputMode="numeric"
              step="1"
              min={1}
              {...register('inputs.mortgage.termMonths', { valueAsNumber: true })}
            />
            <span className={styles.suffix}>mes.</span>
          </div>
          <FieldError message={mortgageErrors?.termMonths?.message} />
        </div>
        <div className={styles.field}>
          <label htmlFor="mortgage-start">Početak otplate</label>
          <Controller
            control={control as Control<CalculationFormValues>}
            name="inputs.mortgage.startMonth"
            render={({ field }) => (
              <MonthYearInput
                id="mortgage-start"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>
    </fieldset>
  );
}

function ManualLoansFieldset() {
  const { control, getValues, setValue } = useFormContextTyped();
  const loans = (useWatch({ control, name: 'inputs.loans' }) ?? []) as Loan[];
  const [newLoanIds, setNewLoanIds] = useState<Set<string>>(new Set());

  function handleAdd() {
    const mortgageStart = getValues('inputs.mortgage.startMonth');
    const newLoan = createDefaultLoan('CASH_LOAN');
    newLoan.startMonth = mortgageStart;
    setValue('inputs.loans', [...loans, newLoan], { shouldDirty: true, shouldValidate: true });
    setNewLoanIds((prev) => {
      const next = new Set(prev);
      next.add(newLoan.id);
      return next;
    });
  }

  function handleApply(index: number, updated: Loan) {
    const next = loans.map((l, i) => (i === index ? updated : l));
    setValue('inputs.loans', next, { shouldDirty: true, shouldValidate: true });
    setNewLoanIds((prev) => {
      const ns = new Set(prev);
      ns.delete(updated.id);
      return ns;
    });
  }

  function handleRemove(index: number) {
    const removed = loans[index];
    const next = loans.filter((_, i) => i !== index);
    setValue('inputs.loans', next, { shouldDirty: true, shouldValidate: true });
    setNewLoanIds((prev) => {
      const ns = new Set(prev);
      ns.delete(removed.id);
      return ns;
    });
  }

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Dodatne pozajmice</legend>
      <p className={styles.fieldsetHint}>
        Sve dodate pozajmice (keš kredit ili pozajmica) ulaze u učešće. Izmene se primenjuju na
        „Pregled” i „Faze otplate” tek kada kliknete na <strong>Primeni</strong>.
      </p>
      {loans.length === 0 ? (
        <p className={styles.fieldsetEmpty}>
          Nema dodatnih pozajmica. Dodajte keš kredit ili pozajmicu od prijatelja/porodice.
        </p>
      ) : (
        <div className={styles.loanList}>
          {loans.map((loan, index) => (
            <LoanRow
              key={loan.id}
              loan={loan}
              isNew={newLoanIds.has(loan.id)}
              onApply={(updated) => handleApply(index, updated)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
      )}
      <div className={styles.repeaterControls}>
        <button type="button" className="secondary" onClick={handleAdd}>
          Dodaj pozajmicu
        </button>
      </div>
    </fieldset>
  );
}

function useFormContextTyped() {
  return useFormContext<CalculationFormValues>();
}
