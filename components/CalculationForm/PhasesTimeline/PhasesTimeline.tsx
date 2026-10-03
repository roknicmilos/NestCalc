import { useMemo, useState } from 'react';
import { splitPhasesAtMonth } from '@/lib/calc';
import { currentMonthYear } from '@/lib/defaults';
import { componentLabel } from '@/lib/i18n';
import { useLocale, useT } from '@/lib/i18n/I18nProvider';
import { formatEur, formatMonthYear, formatMonthsAsYearsAndMonths } from '@/lib/format';
import type { ComputedTotals, DebtPhase } from '@/lib/types';
import { PendingValue } from '@/components/PendingValue';
import styles from './PhasesTimeline.module.scss';

type Props = { totals: ComputedTotals | null };

export function PhasesTimeline({ totals }: Props) {
  const t = useT();
  // A month's debt counts as paid out as soon as the next month begins.
  const { paid, upcoming } = useMemo(
    () =>
      totals
        ? splitPhasesAtMonth(totals.phases, currentMonthYear())
        : { paid: null, upcoming: null },
    [totals],
  );
  return (
    <>
      <PhasesCard title={t.timeline.paidTitle} phases={paid} emptyText={t.timeline.paidEmpty} />
      <PhasesCard title={t.timeline.upcomingTitle} phases={upcoming} emptyText={t.timeline.empty} />
    </>
  );
}

function PhasesCard({
  title,
  phases,
  emptyText,
}: {
  title: string;
  /** `null` while the inputs are invalid and nothing can be computed. */
  phases: DebtPhase[] | null;
  emptyText: string;
}) {
  const locale = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  function toggle() {
    setOpen((value) => !value);
  }
  return (
    <div className={styles.card} data-pdf-block="true" data-collapsed={open ? undefined : 'true'}>
      <h3
        className={`${styles.title} ${styles.collapsibleTitle}`}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <span className={styles.collapsibleChevron} aria-hidden="true" />
        {title}
      </h3>
      <div hidden={!open} data-pdf-expand="true">
        {phases === null ? (
          <PendingValue />
        ) : phases.length === 0 ? (
          <p className={styles.empty}>{emptyText}</p>
        ) : (
          <ul className={styles.phases}>
            {phases.map((phase, index) => (
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
                      <li key={c.loanId} className={styles.componentRow}>
                        <span className={styles.componentLabel}>{componentLabel(c, t)}</span>
                        <span className={styles.componentAmount}>
                          {formatEur(locale, c.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
