'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
  type Control,
} from 'react-hook-form';
import { computeTotals } from '@/lib/calc';
import {
  createDefaultIncomeSource,
  createDefaultLoan,
  currentMonthYear,
  DEFAULT_EUR_TO_RSD_RATE,
} from '@/lib/defaults';
import { calculationInputsSchema } from '@/lib/schemas';
import { formatEur, formatMonthYear, formatMonthsAsYearsAndMonths } from '@/lib/format';
import type {
  Calculation,
  CalculationInputs,
  CapitalSource,
  ComputedTotals,
  IncomeSource,
  Loan,
  PropertyExtra,
} from '@/lib/types';
import { z } from 'zod';
import { ComputedSummary } from './ComputedSummary';
import { ExportPdfButton } from './ExportPdfButton';
import { FieldError } from './FieldError';
import { CapitalSourceRow } from './CapitalSourceRow';
import { ExtraRow } from './ExtraRow';
import { IncomeSourceRow } from './IncomeSourceRow';
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

/** Turn a calculation name into a safe PDF file name. */
function toFileName(name: string): string {
  const slug = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'kalkulacija';
}

/** Shared edit/save plumbing handed to every section. `onSave` persists the whole
 * calculation and resolves to whether it succeeded; `onCancel` reverts to last saved. */
type SectionProps = {
  saving: boolean;
  onSave: () => Promise<boolean>;
  onCancel: () => void;
};

export function CalculationForm({ initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const methods = useForm<CalculationFormValues>({
    defaultValues: { name: initial.name, inputs: initial.inputs },
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });
  const { control, reset } = methods;
  const exportRef = useRef<HTMLDivElement>(null);

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

  const saveCalculation = async (): Promise<boolean> => {
    const valid = await methods.trigger();
    if (!valid) return false;
    const values = methods.getValues();
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
        return false;
      }
      const stored: Calculation = await response.json();
      reset({ name: stored.name, inputs: stored.inputs });
      router.refresh();
      return true;
    } catch {
      setSaveError('Greška u komunikaciji sa serverom.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  function revert() {
    reset();
    setSaveError(null);
  }

  const section: SectionProps = { saving, onSave: saveCalculation, onCancel: revert };

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()} noValidate>
        <div className={styles.toolbar} data-export-ignore="true">
          <ExportPdfButton
            targetRef={exportRef}
            fileName={toFileName(watched?.name ?? initial.name)}
          />
        </div>

        <div ref={exportRef}>
          <NameSection {...section} />

          {saveError ? (
            <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-4)' }}>
              {saveError}
            </p>
          ) : null}

          <div className={styles.layout}>
            <div className={styles.formColumn}>
              <BasicsFieldset {...section} />
              <ExtrasFieldset {...section} />
              <CapitalSourcesFieldset {...section} />
              <MortgageFieldset {...section} />
              <ManualLoansFieldset {...section} />
              <IncomeSourcesFieldset {...section} />
            </div>
            <div className={styles.summaryColumn}>
              <ComputedSummary totals={totals} />
              <PhasesTimeline totals={totals} />
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

/** Izmeni → Otkaži/Sačuvaj toggle. Rendered outside the disabled fieldset so it stays
 * interactive while the section's fields are locked. */
function SectionControls({
  editing,
  setEditing,
  saving,
  onSave,
  onCancel,
}: SectionProps & {
  editing: boolean;
  setEditing: (value: boolean) => void;
}) {
  async function handleSave() {
    const ok = await onSave();
    if (ok) setEditing(false);
  }
  function handleCancel() {
    onCancel();
    setEditing(false);
  }

  if (!editing) {
    return (
      <button type="button" className="secondary" onClick={() => setEditing(true)}>
        Izmeni
      </button>
    );
  }
  return (
    <div className={styles.sectionControls}>
      <button type="button" className="secondary" onClick={handleCancel} disabled={saving}>
        Otkaži
      </button>
      <button type="button" onClick={handleSave} disabled={saving}>
        {saving ? 'Čuvam…' : 'Sačuvaj'}
      </button>
    </div>
  );
}

/** A card section with its own edit/save controls. Children get the current `editing`
 * flag so they can render editable inputs or a read-only, card-like presentation. */
function SectionFieldset({
  title,
  accentClass,
  saving,
  onSave,
  onCancel,
  children,
}: SectionProps & {
  title: string;
  accentClass: string;
  children: (editing: boolean) => ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className={`${styles.section} ${accentClass}`} data-pdf-block="true">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <SectionControls
          editing={editing}
          setEditing={setEditing}
          saving={saving}
          onSave={onSave}
          onCancel={onCancel}
        />
      </div>
      <fieldset className={styles.sectionBody} disabled={!editing}>
        {children(editing)}
      </fieldset>
    </div>
  );
}

/** A read-only label/value pair, matching the look of the loan/capital detail cards. */
function ViewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function NameSection({ saving, onSave, onCancel }: SectionProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContextTyped();
  const [editing, setEditing] = useState(false);
  const name = useWatch({ control, name: 'name' });
  return (
    <div className={styles.headerBar} data-pdf-block="true">
      <div className={styles.headerName}>
        <label htmlFor="calc-name">Naziv kalkulacije</label>
        {editing ? (
          <input id="calc-name" type="text" maxLength={80} {...register('name')} />
        ) : (
          <span className={styles.nameValue}>{name}</span>
        )}
        <FieldError message={errors.name?.message} />
      </div>
      <div className={styles.headerActions}>
        <SectionControls
          editing={editing}
          setEditing={setEditing}
          saving={saving}
          onSave={onSave}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

function BasicsFieldset(props: SectionProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContextTyped();

  const propertyType = useWatch({ control, name: 'inputs.propertyType' });
  const seller = useWatch({ control, name: 'inputs.seller' });
  const ppapTiming = useWatch({ control, name: 'inputs.ppapTiming' });
  const ppapSavingStartMonth = useWatch({ control, name: 'inputs.ppapSavingStartMonth' });
  const propertyPrice = useWatch({ control, name: 'inputs.propertyPrice' });
  const squareMeters = useWatch({ control, name: 'inputs.squareMeters' });
  const purchaseCostsFixed = useWatch({ control, name: 'inputs.purchaseCostsFixed' });
  const area = useWatch({ control, name: 'inputs.address.area' });
  const street = useWatch({ control, name: 'inputs.address.street' });
  const link = useWatch({ control, name: 'inputs.link' });
  const pricePerSqm =
    Number.isFinite(propertyPrice) && Number.isFinite(squareMeters) && squareMeters > 0
      ? propertyPrice / squareMeters
      : null;

  return (
    <SectionFieldset title="Osnovni podaci o kupovini" accentClass={styles.fieldsetBasics} {...props}>
      {(editing) =>
        editing ? (
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="property-type">Tip nekretnine</label>
              <Controller
                control={control as Control<CalculationFormValues>}
                name="inputs.propertyType"
                render={({ field }) => (
                  <select
                    id="property-type"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    <option value="APARTMENT">STAN</option>
                    <option value="HOUSE">KUĆA</option>
                  </select>
                )}
              />
              <FieldError message={errors.inputs?.propertyType?.message} />
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

            {seller === 'INDIVIDUAL' ? (
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label htmlFor="ppap-timing">Kada se plaća porez na prenos (PPAP)</label>
                <Controller
                  control={control as Control<CalculationFormValues>}
                  name="inputs.ppapTiming"
                  render={({ field }) => (
                    <select
                      id="ppap-timing"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    >
                      <option value="NOW">Sada (pripremam novac uz učešće)</option>
                      <option value="LATER">
                        Kasnije (kada je nekretnina gotova, uz stambeni kredit)
                      </option>
                    </select>
                  )}
                />
                <span className={styles.fieldHint}>
                  „Kasnije“ znači da porez ne ulazi u novac koji pripremate sada, već dospeva kada
                  nekretnina bude gotova i odobren stambeni kredit.
                </span>
                <FieldError message={errors.inputs?.ppapTiming?.message} />
              </div>
            ) : null}

            {seller === 'INDIVIDUAL' && ppapTiming === 'LATER' ? (
              <div className={styles.field}>
                <label htmlFor="ppap-saving-start">Početak štednje za PPAP</label>
                <Controller
                  control={control as Control<CalculationFormValues>}
                  name="inputs.ppapSavingStartMonth"
                  render={({ field }) => (
                    <MonthYearInput
                      id="ppap-saving-start"
                      value={field.value ?? currentMonthYear()}
                      onChange={field.onChange}
                    />
                  )}
                />
                <span className={styles.fieldHint}>
                  Mesec od kog počinjete da odvajate novac za PPAP.
                </span>
              </div>
            ) : null}

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
              <label htmlFor="square-meters">Kvadratura</label>
              <div className={styles.fieldWithSuffix}>
                <input
                  id="square-meters"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  {...register('inputs.squareMeters', { valueAsNumber: true })}
                />
                <span className={styles.suffix}>m²</span>
              </div>
              <FieldError message={errors.inputs?.squareMeters?.message} />
            </div>

            <div className={styles.field}>
              <label htmlFor="price-per-sqm">Cena po m²</label>
              <div className={styles.fieldWithSuffix}>
                <input
                  id="price-per-sqm"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={pricePerSqm === null ? '—' : formatEur(pricePerSqm)}
                />
                <span className={styles.suffix}>/ m²</span>
              </div>
              <span className={styles.fieldHint}>Automatski izračunato iz cene i kvadrature.</span>
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

            <div className={styles.field}>
              <label htmlFor="address-area">Deo grada</label>
              <input
                id="address-area"
                type="text"
                placeholder="npr. Sremska Kamenica"
                {...register('inputs.address.area')}
              />
              <FieldError message={errors.inputs?.address?.area?.message} />
            </div>

            <div className={styles.field}>
              <label htmlFor="address-street">Ulica i broj</label>
              <input
                id="address-street"
                type="text"
                placeholder="npr. Jablanova 12"
                {...register('inputs.address.street')}
              />
              <FieldError message={errors.inputs?.address?.street?.message} />
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label htmlFor="property-link">Link ka detaljima</label>
              <input
                id="property-link"
                type="url"
                inputMode="url"
                placeholder="https://…"
                {...register('inputs.link')}
              />
              <FieldError message={errors.inputs?.link?.message} />
            </div>
          </div>
        ) : (
          <>
            <dl className={styles.viewList}>
              <ViewRow label="Tip nekretnine" value={propertyType === 'HOUSE' ? 'KUĆA' : 'STAN'} />
              <ViewRow
                label="Prodavac"
                value={seller === 'INDIVIDUAL' ? 'Fizičko lice' : 'Investitor'}
              />
              {seller === 'INDIVIDUAL' ? (
                <ViewRow
                  label="Plaćanje poreza na prenos (PPAP)"
                  value={
                    ppapTiming === 'LATER'
                      ? 'Kasnije (kada je nekretnina gotova)'
                      : 'Sada (uz učešće)'
                  }
                />
              ) : null}
              {seller === 'INDIVIDUAL' && ppapTiming === 'LATER' ? (
                <ViewRow
                  label="Početak štednje za PPAP"
                  value={formatMonthYear(ppapSavingStartMonth ?? currentMonthYear())}
                />
              ) : null}
              <ViewRow label="Ukupna cena nekretnine" value={formatEur(propertyPrice)} />
              <ViewRow
                label="Kvadratura"
                value={Number.isFinite(squareMeters) ? `${squareMeters} m²` : '—'}
              />
              <ViewRow label="Fiksni troškovi kupovine" value={formatEur(purchaseCostsFixed)} />
              <ViewRow label="Deo grada" value={area || '—'} />
            </dl>
            <details className={styles.collapsible}>
              <summary className={styles.collapsibleSummary}>Više detalja o nekretnini</summary>
              <dl className={`${styles.viewList} ${styles.collapsibleContent}`}>
                <ViewRow
                  label="Cena po m²"
                  value={pricePerSqm === null ? '—' : formatEur(pricePerSqm)}
                />
                <ViewRow label="Ulica i broj" value={street || '—'} />
                <ViewRow
                  label="Link ka detaljima"
                  value={
                    link ? (
                      <a
                        className={styles.linkValue}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link}
                      >
                        {link.length > 20 ? `${link.slice(0, 20)}...` : link}
                      </a>
                    ) : (
                      '—'
                    )
                  }
                />
              </dl>
            </details>
          </>
        )
      }
    </SectionFieldset>
  );
}

/** Free-text list of perks bundled with the property (garage, parking, pantry…).
 * Purely descriptive — no amounts, no effect on the calculation. Like capital sources,
 * there's no section-level edit/save: each card manages its own edit/remove, and applying
 * or removing a card persists the calculation. */
function ExtrasFieldset({ saving, onSave }: SectionProps) {
  const { control, setValue } = useFormContextTyped();
  const extras = (useWatch({ control, name: 'inputs.extras' }) ?? []) as PropertyExtra[];
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  function handleAdd() {
    const newExtra: PropertyExtra = { id: nanoid(8), text: '' };
    setValue('inputs.extras', [...extras, newExtra], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setNewIds((prev) => {
      const next = new Set(prev);
      next.add(newExtra.id);
      return next;
    });
  }

  function handleApply(index: number, updated: PropertyExtra) {
    const next = extras.map((x, i) => (i === index ? updated : x));
    setValue('inputs.extras', next, { shouldDirty: true, shouldValidate: true });
    setNewIds((prev) => {
      const ns = new Set(prev);
      ns.delete(updated.id);
      return ns;
    });
    void onSave();
  }

  function handleRemove(index: number) {
    const removed = extras[index];
    const next = extras.filter((_, i) => i !== index);
    setValue('inputs.extras', next, { shouldDirty: true, shouldValidate: true });
    setNewIds((prev) => {
      const ns = new Set(prev);
      ns.delete(removed.id);
      return ns;
    });
    // A brand-new card that was never applied has nothing persisted yet — skip the save.
    if (!newIds.has(removed.id)) void onSave();
  }

  return (
    <div className={`${styles.section} ${styles.fieldsetExtras}`} data-pdf-block="true">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Uključeno uz nekretninu</h3>
      </div>
      <p className={styles.fieldsetHint}>
        Sve što ide uz nekretninu (npr. garaža, parking, ostava, kuhinja…). Dodajte koliko god
        stavki želite.
      </p>
      {extras.length === 0 ? (
        <p className={styles.fieldsetEmpty}>Nema dodatnih stavki uz nekretninu.</p>
      ) : (
        <div className={styles.loanList}>
          {extras.map((extra, index) => (
            <ExtraRow
              key={extra.id}
              extra={extra}
              isNew={newIds.has(extra.id)}
              onApply={(updated) => handleApply(index, updated)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
      )}
      <div className={styles.repeaterControls}>
        <button type="button" className="secondary" onClick={handleAdd} disabled={saving}>
          Dodaj stavku
        </button>
      </div>
    </div>
  );
}

/** Like loans, capital sources have no section-level edit/save: each card manages its
 * own edit/remove, and applying or removing a card persists the calculation. */
function CapitalSourcesFieldset({ saving, onSave }: SectionProps) {
  const { control, setValue } = useFormContextTyped();
  const sources = (useWatch({ control, name: 'inputs.capitalSources' }) ?? []) as CapitalSource[];
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  function handleAdd() {
    const newSource: CapitalSource = { id: nanoid(8), label: 'Novi izvor', amount: 0 };
    setValue('inputs.capitalSources', [...sources, newSource], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setNewIds((prev) => {
      const next = new Set(prev);
      next.add(newSource.id);
      return next;
    });
  }

  function handleApply(index: number, updated: CapitalSource) {
    const next = sources.map((s, i) => (i === index ? updated : s));
    setValue('inputs.capitalSources', next, { shouldDirty: true, shouldValidate: true });
    setNewIds((prev) => {
      const ns = new Set(prev);
      ns.delete(updated.id);
      return ns;
    });
    void onSave();
  }

  function handleRemove(index: number) {
    const removed = sources[index];
    const next = sources.filter((_, i) => i !== index);
    setValue('inputs.capitalSources', next, { shouldDirty: true, shouldValidate: true });
    setNewIds((prev) => {
      const ns = new Set(prev);
      ns.delete(removed.id);
      return ns;
    });
    // A brand-new card that was never applied has nothing persisted yet — skip the save.
    if (!newIds.has(removed.id)) void onSave();
  }

  return (
    <div className={`${styles.section} ${styles.fieldsetCapital}`} data-pdf-block="true">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Početni kapital</h3>
      </div>
      <div className={styles.loanList}>
        {sources.map((source, index) => (
          <CapitalSourceRow
            key={source.id}
            source={source}
            isNew={newIds.has(source.id)}
            canRemove={sources.length > 1}
            onApply={(updated) => handleApply(index, updated)}
            onRemove={() => handleRemove(index)}
          />
        ))}
      </div>
      <div className={styles.repeaterControls}>
        <button type="button" className="secondary" onClick={handleAdd} disabled={saving}>
          Dodaj izvor
        </button>
      </div>
    </div>
  );
}

function MortgageFieldset(props: SectionProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContextTyped();
  const mortgageErrors = errors.inputs?.mortgage;

  const downPaymentPct = useWatch({ control, name: 'inputs.mortgage.downPaymentPct' });
  const interestRatePct = useWatch({ control, name: 'inputs.mortgage.interestRatePct' });
  const termMonths = useWatch({ control, name: 'inputs.mortgage.termMonths' });
  const startMonth = useWatch({ control, name: 'inputs.mortgage.startMonth' });

  return (
    <SectionFieldset title="Stambeni kredit" accentClass={styles.fieldsetMortgage} {...props}>
      {(editing) =>
        editing ? (
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
        ) : (
          <dl className={styles.viewList}>
            <ViewRow label="Procenat učešća" value={`${downPaymentPct} %`} />
            <ViewRow label="Kamatna stopa (NKS)" value={`${interestRatePct} %`} />
            <ViewRow
              label="Rok otplate"
              value={
                Number.isFinite(termMonths) ? formatMonthsAsYearsAndMonths(termMonths) : '—'
              }
            />
            <ViewRow label="Početak otplate" value={formatMonthYear(startMonth)} />
          </dl>
        )
      }
    </SectionFieldset>
  );
}

/** Unlike the other sections, loans have no section-level edit/save: each card manages
 * its own edit/remove, and applying or removing a card persists the calculation. */
function ManualLoansFieldset({ saving, onSave }: SectionProps) {
  const { control, getValues, setValue } = useFormContextTyped();
  const loans = (useWatch({ control, name: 'inputs.loans' }) ?? []) as Loan[];
  const eurToRsdRate = (useWatch({ control, name: 'inputs.eurToRsdRate' }) ??
    DEFAULT_EUR_TO_RSD_RATE) as number;
  const [newLoanIds, setNewLoanIds] = useState<Set<string>>(new Set());

  const hasCashLoan = loans.some((l) => l.type === 'CASH_LOAN');

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
    void onSave();
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
    // A brand-new card that was never applied has nothing persisted yet — skip the save.
    if (!newLoanIds.has(removed.id)) void onSave();
  }

  return (
    <div className={`${styles.section} ${styles.fieldsetLoans}`} data-pdf-block="true">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Dodatne pozajmice</h3>
      </div>
      <p className={styles.fieldsetHint}>
        Sve dodate pozajmice (keš kredit ili pozajmica) ulaze u učešće. Svaka stavka ima svoje
        dugmad za izmenu i uklanjanje; izmene se čuvaju kada kliknete na <strong>Primeni</strong>.
      </p>
      {hasCashLoan ? (
        <EurToRsdRateField rate={eurToRsdRate} saving={saving} onSave={onSave} />
      ) : null}
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
              eurToRsdRate={eurToRsdRate}
              onApply={(updated) => handleApply(index, updated)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
      )}
      <div className={styles.repeaterControls}>
        <button type="button" className="secondary" onClick={handleAdd} disabled={saving}>
          Dodaj pozajmicu
        </button>
      </div>
    </div>
  );
}

/** Recurring monthly income (e.g. rent) that offsets the monthly burden in the repayment
 * phases. Like loans and capital sources, each card manages its own edit/remove and
 * applying or removing a card persists the calculation. */
function IncomeSourcesFieldset({ saving, onSave }: SectionProps) {
  const { control, setValue } = useFormContextTyped();
  const sources = (useWatch({ control, name: 'inputs.incomeSources' }) ?? []) as IncomeSource[];
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  function handleAdd() {
    const newSource = createDefaultIncomeSource();
    setValue('inputs.incomeSources', [...sources, newSource], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setNewIds((prev) => {
      const next = new Set(prev);
      next.add(newSource.id);
      return next;
    });
  }

  function handleApply(index: number, updated: IncomeSource) {
    const next = sources.map((s, i) => (i === index ? updated : s));
    setValue('inputs.incomeSources', next, { shouldDirty: true, shouldValidate: true });
    setNewIds((prev) => {
      const ns = new Set(prev);
      ns.delete(updated.id);
      return ns;
    });
    void onSave();
  }

  function handleRemove(index: number) {
    const removed = sources[index];
    const next = sources.filter((_, i) => i !== index);
    setValue('inputs.incomeSources', next, { shouldDirty: true, shouldValidate: true });
    setNewIds((prev) => {
      const ns = new Set(prev);
      ns.delete(removed.id);
      return ns;
    });
    // A brand-new card that was never applied has nothing persisted yet — skip the save.
    if (!newIds.has(removed.id)) void onSave();
  }

  return (
    <div className={`${styles.section} ${styles.fieldsetIncome}`} data-pdf-block="true">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Dodatni mesečni prihodi</h3>
      </div>
      <p className={styles.fieldsetHint}>
        Redovni mesečni prihodi (npr. kirija od stana) koji umanjuju mesečno opterećenje u
        fazama otplate, počev od izabranog meseca.
      </p>
      {sources.length === 0 ? (
        <p className={styles.fieldsetEmpty}>Nema dodatnih mesečnih prihoda.</p>
      ) : (
        <div className={styles.loanList}>
          {sources.map((source, index) => (
            <IncomeSourceRow
              key={source.id}
              source={source}
              isNew={newIds.has(source.id)}
              onApply={(updated) => handleApply(index, updated)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
      )}
      <div className={styles.repeaterControls}>
        <button type="button" className="secondary" onClick={handleAdd} disabled={saving}>
          Dodaj prihod
        </button>
      </div>
    </div>
  );
}

/** EUR→RSD rate: read-only by default with its own Izmeni toggle, matching the rest of
 * the page. Edits stay in a local draft until Sačuvaj persists them. */
function EurToRsdRateField({
  rate,
  saving,
  onSave,
}: {
  rate: number;
  saving: boolean;
  onSave: () => Promise<boolean>;
}) {
  const { setValue } = useFormContextTyped();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rate);

  useEffect(() => {
    setDraft(rate);
  }, [rate]);

  async function handleSave() {
    setValue('inputs.eurToRsdRate', draft, { shouldDirty: true, shouldValidate: true });
    const ok = await onSave();
    if (ok) setEditing(false);
  }

  function handleCancel() {
    setDraft(rate);
    setEditing(false);
  }

  return (
    <div className={`${styles.field} ${styles.rateField}`}>
      <label htmlFor="eur-to-rsd-rate">Kurs EUR → RSD (za prikaz keš kredita u dinarima)</label>
      {editing ? (
        <>
          <input
            id="eur-to-rsd-rate"
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            value={Number.isFinite(draft) ? draft : 0}
            onChange={(e) => setDraft(e.target.valueAsNumber)}
          />
          <div className={styles.sectionControls}>
            <button type="button" className="secondary" onClick={handleCancel} disabled={saving}>
              Otkaži
            </button>
            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Čuvam…' : 'Sačuvaj'}
            </button>
          </div>
        </>
      ) : (
        <div className={styles.readonlyField}>
          <span>{Number.isFinite(rate) ? rate : DEFAULT_EUR_TO_RSD_RATE}</span>
          <button type="button" className="secondary" onClick={() => setEditing(true)}>
            Izmeni
          </button>
        </div>
      )}
    </div>
  );
}

function useFormContextTyped() {
  return useFormContext<CalculationFormValues>();
}
