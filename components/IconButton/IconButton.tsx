import type { ButtonHTMLAttributes } from 'react';
import styles from './IconButton.module.scss';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  icon: 'add' | 'edit' | 'remove';
  label: string;
};

const PATHS = {
  add: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  remove: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
};

export function IconButton({ icon, label, className, title, ...rest }: IconButtonProps) {
  const variant = icon === 'remove' ? 'danger' : 'secondary';
  return (
    <button
      type="button"
      className={[variant, styles.iconButton, className].filter(Boolean).join(' ')}
      aria-label={label}
      title={title ?? label}
      {...rest}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {PATHS[icon]}
      </svg>
    </button>
  );
}
