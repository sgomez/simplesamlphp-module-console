import type { ReactNode } from 'react';

interface EmptyProps {
  title: string;
  text?: ReactNode;
  actions?: ReactNode;
  // A whole page: the h1 of the content area, as on the state pages.
  state?: boolean;
}

export function Empty({ title, text, actions, state }: EmptyProps) {
  const Heading = state ? 'h1' : 'h2';

  return (
    <div className={state ? 'card empty state-card' : 'card empty'}>
      <Heading className={state ? 'h1' : 'h2'}>{title}</Heading>
      {text && <p className="muted empty-text">{text}</p>}
      {actions && <div className="empty-actions">{actions}</div>}
    </div>
  );
}
