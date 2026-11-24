import { Fragment } from 'react';
import { cx } from './classes';

export interface MenuEntry {
  label: string;
  href: string;
  danger?: boolean;
  separated?: boolean;
}

export function Menu({ label, entries }: { label: string; entries: readonly MenuEntry[] }) {
  return (
    <div className="card menu menu-card" role="menu" aria-label={label}>
      {entries.map(({ label: text, href, danger, separated }) => (
        <Fragment key={text}>
          {separated && <hr />}
          <a className={cx('nav-item', danger && 'is-danger')} role="menuitem" href={href}>
            {text}
          </a>
        </Fragment>
      ))}
    </div>
  );
}
