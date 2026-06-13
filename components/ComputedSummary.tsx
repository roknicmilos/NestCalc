import { formatEur } from '@/lib/format';
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

  return (
    <div className={styles.card}>
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

      {showPpap || showLeftover ? (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Nakon učešća</h4>
          <dl className={styles.list}>
            {showPpap ? (
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
