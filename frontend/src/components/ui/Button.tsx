import type { ReactNode, Ref } from 'react';
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
  ref?: Ref<HTMLButtonElement>;
  controls?: string;
  expanded?: boolean;
  onClick?: () => void;
}

export function Button(props: ButtonProps) {
  const { type = 'button', disabled, loading, menu, ref, controls, expanded, onClick, label, children } = props;

  return (
    <button
      ref={ref}
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

export type LinkTarget = { to: string; href?: never } | { href: string; to?: never };

type LinkButtonProps = Look & LinkTarget & { disabled?: boolean };

export function LinkButton(props: LinkButtonProps) {
  const { disabled, label, children } = props;
  if (disabled) {
    return (
      <a className={buttonClass(props, 'is-disabled')} aria-disabled="true">
        {children}
      </a>
    );
  }
  if (props.to !== undefined) {
    return (
      <Link className={buttonClass(props)} to={props.to} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <a className={buttonClass(props)} href={props.href} aria-label={label}>
      {children}
    </a>
  );
}
