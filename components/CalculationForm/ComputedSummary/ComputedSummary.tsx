import { useLocale, useT } from '@/lib/i18n/I18nProvider';
import { formatEur, formatMonthYear } from '@/lib/format';
import type { ComputedTotals } from '@/lib/types';
import { PendingValue } from '@/components/PendingValue';
import styles from './ComputedSummary.module.scss';

type Props = { totals: ComputedTotals | null };

export function ComputedSummary({ totals }: Props) {
  const locale = useLocale();
  const t = useT();
  // When PPAP is deferred it is not money to prepare now — show it on its own as a
  // future obligation due once the property is ready (the mortgage start month).
  const ppapDeferred = !!totals && totals.ppap > 0 && totals.ppapTiming === 'LATER';

  return (
    <div className={styles.card} data-pdf-block="true">
      <h3 className={styles.title}>{t.summary.title}</h3>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>{t.summary.downPaymentSection}</h4>
        <dl className={styles.list}>
          <Row
            label={t.summary.requiredDownPayment}
            value={totals ? formatEur(locale, totals.requiredDownPayment) : null}
          />
          <Row
            label={t.summary.purchaseCosts}
            value={totals ? formatEur(locale, totals.purchaseCosts) : null}
          />
          <Row
            label={t.summary.downPaymentTotal}
            value={
              totals ? formatEur(locale, totals.requiredDownPayment + totals.purchaseCosts) : null
            }
            variant="total"
          />
        </dl>
      </section>

      {ppapDeferred ? (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>{t.summary.futureSection}</h4>
          <dl className={styles.list}>
            <Row label={t.summary.ppapLater} value={formatEur(locale, totals.ppap)} />
            {totals.ppapMonthlySaving !== null ? (
              <Row
                label={t.summary.ppapMonthlySaving}
                value={formatEur(locale, totals.ppapMonthlySaving)}
                variant="debt"
              />
            ) : null}
          </dl>
          <p className={styles.note}>
            {t.summary.ppapDeferredNote(
              totals.ppapDueMonth ? formatMonthYear(locale, totals.ppapDueMonth) : null,
              totals.ppapMonthlySaving !== null && totals.ppapSavingMonths !== null
                ? {
                    amount: formatEur(locale, totals.ppapMonthlySaving),
                    months: totals.ppapSavingMonths,
                  }
                : null,
            )}
          </p>
        </section>
      ) : null}

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>{t.summary.mortgageSection}</h4>
        <dl className={styles.list}>
          <Row
            label={t.summary.mortgageAmount}
            value={totals ? formatEur(locale, totals.mortgageAmount) : null}
          />
          <Row
            label={t.summary.mortgageInterest}
            value={totals ? formatEur(locale, totals.mortgageComputation.totalInterest) : null}
          />
          <Row
            label={t.summary.mortgageTotal}
            value={totals ? formatEur(locale, totals.mortgageComputation.totalPaid) : null}
            variant="total"
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
  variant?: 'debt' | 'total';
}) {
  const className = [
    styles.row,
    variant === 'total' ? styles.total : null,
    variant === 'debt' ? styles.debt : null,
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
