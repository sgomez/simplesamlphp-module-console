import { Link } from 'react-router';

export interface Segment {
  key: string;
  label: string;
  count?: number;
  to?: string;
  onSelect?: () => void;
}

interface SegmentedProps {
  label: string;
  segments: readonly Segment[];
  current: string;
}

function Count({ count }: { count: number | undefined }) {
  return count === undefined ? null : <span className="faint seg-count"> {count}</span>;
}

export function Segmented({ label, segments, current }: SegmentedProps) {
  return (
    <nav className="seg" aria-label={label}>
      {segments.map(({ key, label: text, count, to, onSelect }) => {
        const on = key === current;
        const className = on ? 'on' : undefined;
        if (to !== undefined) {
          return (
            <Link key={key} className={className} to={to} aria-current={on || undefined}>
              {text}
              <Count count={count} />
            </Link>
          );
        }

        return (
          <button key={key} type="button" className={className} aria-pressed={on} onClick={onSelect}>
            {text}
            <Count count={count} />
          </button>
        );
      })}
    </nav>
  );
}
