import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from './classes';

type RowTarget =
  | { to: string; href?: never; plain?: never }
  | { href: string; to?: never; plain?: never }
  | { plain: true; to?: never; href?: never };

type RowProps = RowTarget & { wrap?: boolean; children: ReactNode };

export function Row(props: RowProps) {
  const { wrap, children } = props;
  const className = cx('row', wrap && 'row-wrap');
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

  return <div className={className}>{children}</div>;
}
