import { formatEur, formatMonthYear, formatMonthsAsYearsAndMonths } from '@/lib/format';
import type { ComputedTotals } from '@/lib/types';
import { PendingValue } from './PendingValue';
import styles from './PhasesTimeline.module.scss';

type Props = { totals: ComputedTotals | null };

export function PhasesTimeline({ totals }: Props) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Faze otplate</h3>
      {totals === null ? (
        <PendingValue />
      ) : totals.phases.length === 0 ? (
        <p className={styles.empty}>Nema aktivnih dugova za prikaz.</p>
      ) : (
        <ul className={styles.phases}>
          {totals.phases.map((phase, index) => (
            <li key={`${phase.startMonth.year}-${phase.startMonth.month}-${index}`}>
              <div className={styles.phase}>
                <div className={styles.phaseHeader}>
                  <span className={styles.phaseDuration}>
                    {formatMonthsAsYearsAndMonths(phase.durationMonths)}
                  </span>
                  <span className={styles.phaseTotal}>{formatEur(phase.monthlyTotal)} / mes.</span>
                </div>
                <div className={styles.phaseMeta}>
                  {formatMonthYear(phase.startMonth)} — {formatMonthYear(phase.endMonth)}
                </div>
                {phase.monthlyBankTotal > 0 ? (
                  <div className={styles.bankTotal}>
                    <span className={styles.bankTotalLabel}>
                      Dug banci (stambeni + keš)
                    </span>
                    <span className={styles.bankTotalAmount}>
                      {formatEur(phase.monthlyBankTotal)} / mes.
                    </span>
                  </div>
                ) : null}
                <ul className={styles.components}>
                  {phase.components.map((c) => (
                    <li key={c.loanId} className={styles.componentRow}>
                      <span className={styles.componentLabel}>{c.label}</span>
                      <span className={styles.componentAmount}>{formatEur(c.amount)}</span>
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
