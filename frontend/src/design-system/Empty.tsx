import type { ReactNode } from 'react';
import { cx } from './classes';

interface EmptyProps {
  title: string;
  text?: ReactNode;
  actions?: ReactNode;
  // A whole page: the h1 of the content area, as on the state pages.
  state?: boolean;
  // A state page under a callout, which takes the place of the card's offset.
  flush?: boolean;
  children?: ReactNode;
}

export function Empty({ title, text, actions, state, flush, children }: EmptyProps) {
  const Heading = state ? 'h1' : 'h2';

  return (
    <div className={cx('card empty', state && !flush && 'state-card')}>
      <Heading className={state ? 'h1' : 'h2'}>{title}</Heading>
      {text && <p className="muted empty-text">{text}</p>}
      {children}
      {actions && <div className="empty-actions">{actions}</div>}
    </div>
  );
}
