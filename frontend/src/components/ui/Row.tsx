import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from './classes';

interface RowProps {
  href?: string;
  to?: string;
  wrap?: boolean;
  children: ReactNode;
}

export function Row({ href, to, wrap, children }: RowProps) {
  const className = cx('row', wrap && 'row-wrap');
  if (to !== undefined) {
    return (
      <Link className={className} to={to}>
        {children}
      </Link>
    );
  }
  if (href !== undefined) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }

  return <div className={className}>{children}</div>;
}
