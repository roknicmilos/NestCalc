import { formatEur, formatMonthYear } from '@/lib/format';
import type { ComputedTotals } from '@/lib/types';
import { PendingValue } from './PendingValue';
import styles from './ComputedSummary.module.scss';

type Props = { totals: ComputedTotals | null };

export function ComputedSummary({ totals }: Props) {
  const leftoverAfterDownPayment = totals
    ? totals.availableForDownPayment - totals.requiredDownPayment
    : 0;
  // PPAP applies only for individual sellers; when pending we still show it.
  const showPpap = !totals || totals.ppap > 0;
  const showShortfall = !!totals && totals.shortfall > 0;
  const showLeftover = !!totals && leftoverAfterDownPayment > 0;
  // When PPAP is deferred it is not money to prepare now — show it on its own as a
  // future obligation due once the property is ready (the mortgage start month).
  const ppapDeferred = !!totals && totals.ppap > 0 && totals.ppapTiming === 'LATER';

  return (
    <div className={styles.card} data-pdf-block="true">
      <h3 className={styles.title}>Pregled</h3>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Učešće</h4>
        <dl className={styles.list}>
          <Row
            label="Ukupan kapital"
            value={totals ? formatEur(totals.totalCapital) : null}
            variant="capital"
          />
          <Row
            label="Pozajmice za učešće"
            value={totals ? formatEur(totals.loansForDownPayment) : null}
            variant="debt"
          />
          <Row
            label="Raspoloživo za učešće"
            value={totals ? formatEur(totals.availableForDownPayment) : null}
            variant="capital"
          />
          <Row
            label="Potrebno učešće"
            value={totals ? formatEur(totals.requiredDownPayment) : null}
          />
          {showShortfall ? (
            <Row label="Nedostaje za učešće" value={formatEur(totals.shortfall)} variant="warn" />
          ) : null}
        </dl>
      </section>

      {(showPpap && !ppapDeferred) || showLeftover ? (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Nakon učešća</h4>
          <dl className={styles.list}>
            {showPpap && !ppapDeferred ? (
              <Row
                label="Porez na prenos (PPAP)"
                value={totals ? formatEur(totals.ppap) : null}
              />
            ) : null}
            {showLeftover ? (
              <Row
                label="Preostalo za ostalo"
                value={formatEur(leftoverAfterDownPayment)}
                variant="capital"
              />
            ) : null}
          </dl>
        </section>
      ) : null}

      {ppapDeferred ? (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Buduća obaveza</h4>
          <dl className={styles.list}>
            <Row
              label="Porez na prenos (PPAP) — kasnije"
              value={formatEur(totals.ppap)}
            />
            {totals.ppapMonthlySaving !== null ? (
              <Row
                label="Mesečna štednja za PPAP"
                value={formatEur(totals.ppapMonthlySaving)}
                variant="debt"
              />
            ) : null}
          </dl>
          <p className={styles.note}>
            Ne pripremate sada — dospeva kada nekretnina bude gotova
            {totals.ppapDueMonth ? ` (oko ${formatMonthYear(totals.ppapDueMonth)})` : ''}, uz
            stambeni kredit.
            {totals.ppapMonthlySaving !== null && totals.ppapSavingMonths !== null
              ? ` Da bi bio spreman na vreme, odvajajte ${formatEur(
                  totals.ppapMonthlySaving,
                )} mesečno tokom ${totals.ppapSavingMonths} ${
                  totals.ppapSavingMonths === 1 ? 'meseca' : 'meseci'
                }.`
              : ''}
          </p>
        </section>
      ) : null}

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Stambeni kredit</h4>
        <dl className={styles.list}>
          <Row
            label="Iznos stambenog kredita"
            value={totals ? formatEur(totals.mortgageAmount) : null}
            variant="debt"
          />
          <Row
            label="Mesečna rata stambenog kredita"
            value={totals ? formatEur(totals.mortgageComputation.monthlyPayment) : null}
            variant="debt"
          />
          <Row
            label="Ukupna kamata stambenog kredita"
            value={totals ? formatEur(totals.mortgageComputation.totalInterest) : null}
          />
          <Row
            label="Ukupno za vraćanje stambenog kredita"
            value={totals ? formatEur(totals.mortgageComputation.totalPaid) : null}
          />
        </dl>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | null;
  variant?: 'capital' | 'debt' | 'warn';
}) {
  const className = [
    styles.row,
    variant === 'capital' ? styles.capital : null,
    variant === 'debt' ? styles.debt : null,
    variant === 'warn' ? styles.warn : null,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={className}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value ?? <PendingValue />}</dd>
    </div>
  );
}
