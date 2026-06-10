import styles from './FieldError.module.scss';

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className={styles.error}>{message}</p>;
}
