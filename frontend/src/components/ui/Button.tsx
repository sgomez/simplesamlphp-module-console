import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from './classes';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'danger-solid' | 'global';

interface Look {
  variant?: ButtonVariant;
  small?: boolean;
  iconOnly?: boolean;
  label?: string;
  children: ReactNode;
}

function buttonClass({ variant = 'secondary', small, iconOnly }: Look, ...more: (string | false | undefined)[]) {
  return cx('btn', `btn-${variant}`, small && 'btn-sm', iconOnly && 'btn-icon', ...more);
}

interface ButtonProps extends Look {
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  menu?: boolean;
  controls?: string;
  expanded?: boolean;
  onClick?: () => void;
}

export function Button(props: ButtonProps) {
  const { type = 'button', disabled, loading, menu, controls, expanded, onClick, label, children } = props;

  return (
    <button
      type={type}
      className={buttonClass(props, loading && 'is-loading', menu && 'menu-btn')}
      disabled={disabled}
      aria-label={label}
      aria-controls={controls}
      aria-expanded={expanded}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface LinkButtonProps extends Look {
  href?: string;
  to?: string;
  disabled?: boolean;
}

export function LinkButton(props: LinkButtonProps) {
  const { href, to, disabled, label, children } = props;
  if (disabled) {
    return (
      <a className={buttonClass(props, 'is-disabled')} aria-disabled="true">
        {children}
      </a>
    );
  }
  if (to !== undefined) {
    return (
      <Link className={buttonClass(props)} to={to} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <a className={buttonClass(props)} href={href} aria-label={label}>
      {children}
    </a>
  );
}
