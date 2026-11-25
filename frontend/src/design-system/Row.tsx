import type { ReactNode } from 'react';
import { Link } from 'react-aria-components';
import { cx } from './classes';

// pick: a control of its own, such as a checkbox, beside the link and not inside it.
type RowTarget =
  | { to: string; href?: never; plain?: never; pick?: ReactNode }
  | { href: string; to?: never; plain?: never; pick?: never }
  | { plain: true; to?: never; href?: never; as?: 'div' | 'li'; pick?: never };

type RowProps = RowTarget & { wrap?: boolean; tight?: boolean; className?: string; children: ReactNode };

export function Row(props: RowProps) {
  const { wrap, tight, children } = props;
  const className = cx('row', wrap && 'row-wrap', tight && 'row-tight', props.className);
  if (props.to !== undefined && props.pick !== undefined) {
    return (
      <div className={cx(className, 'row-pick')}>
        {props.pick}
        <Link className={cx('row-target', wrap && 'row-wrap')} href={props.to}>
          {children}
        </Link>
      </div>
    );
  }
  if (props.to !== undefined) {
    return (
      <Link className={className} href={props.to}>
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
