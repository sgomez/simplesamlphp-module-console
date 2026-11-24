import { Link } from 'react-router';

export interface Tab {
  key: string;
  label: string;
  to?: string;
  onSelect?: () => void;
}

export function Tabs({ label, tabs, current }: { label: string; tabs: readonly Tab[]; current: string }) {
  return (
    <nav className="tabs" aria-label={label}>
      {tabs.map(({ key, label: text, to, onSelect }) => {
        const on = key === current;
        if (to !== undefined) {
          return (
            <Link key={key} className={on ? 'on' : undefined} to={to} aria-current={on ? 'page' : undefined}>
              {text}
            </Link>
          );
        }

        return (
          <button key={key} type="button" className={on ? 'on' : undefined} aria-pressed={on} onClick={onSelect}>
            {text}
          </button>
        );
      })}
    </nav>
  );
}
