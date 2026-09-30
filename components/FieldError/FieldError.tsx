import { translateMessage } from '@/lib/i18n';
import { useT } from '@/lib/i18n/I18nProvider';
import styles from './FieldError.module.scss';

export function FieldError({ message }: { message?: string | null }) {
  const t = useT();
  if (!message) return null;
  return <p className={styles.error}>{translateMessage(t, message)}</p>;
}
