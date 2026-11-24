import type { ReactNode } from 'react';
import { CrossIcon, WarningIcon } from './icons';
import { cx } from './classes';

export type StatusTone = 'live' | 'pending' | 'unsaved' | 'warn' | 'danger' | 'off';
export type StatusMark = 'dot' | 'full' | 'half' | 'minus' | 'warning' | 'cross';

interface StatusProps {
  tone: StatusTone;
  mark: StatusMark;
  title?: string;
  note?: string;
  children: ReactNode;
}

function Mark({ mark }: { mark: StatusMark }) {
  if (mark === 'warning') {
    return <WarningIcon />;
  }
  if (mark === 'cross') {
    return <CrossIcon />;
  }

  return <span className={cx('dot', mark !== 'dot' && `dot-${mark}`)} aria-hidden="true" />;
}

export function Status({ tone, mark, title, note, children }: StatusProps) {
  return (
    <span className={`status s-${tone}`} title={title}>
      <Mark mark={mark} />
      <span>{children}</span>
      {note && <span className="small muted status-note">{note}</span>}
    </span>
  );
}
