import { useT } from '@/lib/i18n/I18nProvider';
import styles from './PendingValue.module.scss';

export function PendingValue() {
  const t = useT();
  return <span className={styles.pending}>— {t.pending} —</span>;
}
