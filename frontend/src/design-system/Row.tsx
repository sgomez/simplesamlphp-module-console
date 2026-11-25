import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from './classes';

type RowTarget =
  | { to: string; href?: never; plain?: never }
  | { href: string; to?: never; plain?: never }
  | { plain: true; to?: never; href?: never; as?: 'div' | 'li' };

type RowProps = RowTarget & { wrap?: boolean; tight?: boolean; className?: string; children: ReactNode };

export function Row(props: RowProps) {
  const { wrap, tight, children } = props;
  const className = cx('row', wrap && 'row-wrap', tight && 'row-tight', props.className);
  if (props.to !== undefined) {
    return (
      <Link className={className} to={props.to}>
        {children}
      </Link>
    );
  }
  if (props.href !== undefined) {
    return (
      <a className={className} href={props.href}>
        {children}
      </a>
    );
  }

  const Tag = props.as ?? 'div';

  return <Tag className={className}>{children}</Tag>;
}
