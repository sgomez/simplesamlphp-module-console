import type { ReactNode, Ref } from 'react';
import { Button as AriaButton, Link } from 'react-aria-components';
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
  onPress?: () => void;
}

// Props left undefined are not passed, so a trigger's context (a MenuTrigger's aria-expanded) is not overridden.
function defined<T extends object>(props: T): Partial<T> {
  return Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export function Button(props: ButtonProps) {
  const { type = 'button', disabled, loading, menu, ref, controls, expanded, onPress, label, children } = props;

  return (
    <AriaButton
      ref={ref}
      type={type}
      className={buttonClass(props, menu && 'menu-btn')}
      {...defined({
        isDisabled: disabled,
        isPending: loading,
        'aria-label': label,
        'aria-controls': controls,
        'aria-expanded': expanded,
        onPress,
      })}
    >
      {children}
    </AriaButton>
  );
}

// to: a Console route, followed in the page; href: any other address, which the browser loads.
export type LinkTarget = { to: string; href?: never } | { href: string; to?: never };

type LinkButtonProps = Look & LinkTarget & { disabled?: boolean };

export function LinkButton(props: LinkButtonProps) {
  const { disabled, label, children } = props;
  const look = { className: buttonClass(props), ...defined({ 'aria-label': label }) };
  if (disabled) {
    return (
      <Link {...look} isDisabled>
        {children}
      </Link>
    );
  }
  if (props.to !== undefined) {
    return (
      <Link {...look} href={props.to}>
        {children}
      </Link>
    );
  }

  return (
    <a {...look} href={props.href}>
      {children}
    </a>
  );
}
