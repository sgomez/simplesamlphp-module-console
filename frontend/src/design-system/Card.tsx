import type { ReactNode } from 'react';
import { cx } from './classes';

interface CardProps {
  list?: boolean;
  as?: 'div' | 'ul';
  className?: string;
  children: ReactNode;
}

export function Card({ list, as: Tag = 'div', className, children }: CardProps) {
  return <Tag className={cx('card', list && 'card-list', className)}>{children}</Tag>;
}
