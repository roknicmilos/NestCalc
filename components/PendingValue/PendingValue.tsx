import styles from './PendingValue.module.scss';

export function PendingValue() {
  return <span className={styles.pending}>— čeka ispravnu vrednost —</span>;
}
