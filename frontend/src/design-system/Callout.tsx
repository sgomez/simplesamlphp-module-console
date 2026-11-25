import type { ReactNode } from 'react';
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from './icons';

export type CalloutKind = 'info' | 'warning' | 'error' | 'success';

const icons = { info: InfoIcon, warning: WarningIcon, error: ErrorIcon, success: SuccessIcon };

interface CalloutProps {
  kind: CalloutKind;
  title: string;
  children?: ReactNode;
  items?: ReactNode[];
  action?: ReactNode;
}

export function Callout({ kind, title, children, items, action }: CalloutProps) {
  const Icon = icons[kind];

  return (
    <div className={`callout callout-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon className={`ic ic-${kind}`} />
      <div className="callout-body">
        <span className="callout-title">{title}</span>
        {children && <span className="small">{children}</span>}
        {items && (
          <ul className="callout-list">
            {items.map((item, index) => (
              <li key={index} className="small">
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
      {action}
    </div>
  );
}
