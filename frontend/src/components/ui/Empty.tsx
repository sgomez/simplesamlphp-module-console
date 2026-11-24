import type { ReactNode } from 'react';

interface EmptyProps {
  title: string;
  text?: string;
  actions?: ReactNode;
}

export function Empty({ title, text, actions }: EmptyProps) {
  return (
    <div className="card empty">
      <h2 className="h2">{title}</h2>
      {text && <p className="muted empty-text">{text}</p>}
      {actions && <div className="empty-actions">{actions}</div>}
    </div>
  );
}
