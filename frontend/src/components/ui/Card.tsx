import type { ReactNode } from 'react';
import { cx } from './classes';

export function Card({ list, children }: { list?: boolean; children: ReactNode }) {
  return <div className={cx('card', list && 'card-list')}>{children}</div>;
}
