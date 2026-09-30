import { componentLabel } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/I18nProvider';
import { formatEur, formatMonthYear, formatMonthsAsYearsAndMonths } from '@/lib/format';
import type { ComputedTotals } from '@/lib/types';
import { PendingValue } from '@/components/PendingValue';
import styles from './PhasesTimeline.module.scss';

type Props = { totals: ComputedTotals | null };

export function PhasesTimeline({ totals }: Props) {
  const locale = useLocale();
  const t = useT();
  return (
    <div className={styles.card} data-pdf-block="true">
      <h3 className={styles.title}>{t.timeline.title}</h3>
      {totals === null ? (
        <PendingValue />
      ) : totals.phases.length === 0 ? (
        <p className={styles.empty}>{t.timeline.empty}</p>
      ) : (
        <ul className={styles.phases}>
          {totals.phases.map((phase, index) => (
            <li key={`${phase.startMonth.year}-${phase.startMonth.month}-${index}`}>
              <div className={styles.phase}>
                <div className={styles.phaseHeader}>
                  <span className={styles.phaseDuration}>
                    {formatMonthsAsYearsAndMonths(locale, phase.durationMonths)}
                  </span>
                  <span className={styles.phaseTotal}>
                    {t.timeline.perMonth(formatEur(locale, phase.monthlyTotal))}
                  </span>
                </div>
                <div className={styles.phaseMeta}>
                  {formatMonthYear(locale, phase.startMonth)} —{' '}
                  {formatMonthYear(locale, phase.endMonth)}
                </div>
                {phase.monthlyBankTotal > 0 ? (
                  <div className={styles.bankTotal}>
                    <span className={styles.bankTotalLabel}>{t.timeline.bankDebt}</span>
                    <span className={styles.bankTotalAmount}>
                      {t.timeline.perMonth(formatEur(locale, phase.monthlyBankTotal))}
                    </span>
                  </div>
                ) : null}
                <ul className={styles.components}>
                  {phase.components.map((c) => (
                    <li
                      key={c.loanId}
                      className={`${styles.componentRow} ${c.income ? styles.componentIncome : ''}`}
                    >
                      <span className={styles.componentLabel}>{componentLabel(c, t)}</span>
                      <span className={styles.componentAmount}>{formatEur(locale, c.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
