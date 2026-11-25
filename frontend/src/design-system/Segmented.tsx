import { Link, ToggleButton, ToggleButtonGroup, type Key } from 'react-aria-components';

interface SegmentLook {
  key: string;
  label: string;
  count?: number;
}

export type LinkSegment = SegmentLook & { to: string };

export type ButtonSegment = SegmentLook & { onSelect: () => void; disabled?: boolean };

interface SegmentedProps<S> {
  label: string;
  segments: readonly S[];
  current: string;
}

function Count({ count }: { count: number | undefined }) {
  return count === undefined ? null : <span className="faint seg-count"> {count}</span>;
}

export function LinkSegmented({ label, segments, current }: SegmentedProps<LinkSegment>) {
  return (
    <nav className="seg" aria-label={label}>
      {segments.map(({ key, label: text, count, to }) => (
        <Link key={key} href={to} {...(key === current ? { 'aria-current': 'true' } : {})}>
          {text}
          <Count count={count} />
        </Link>
      ))}
    </nav>
  );
}

export function Segmented({ label, segments, current }: SegmentedProps<ButtonSegment>) {
  const select = (keys: Set<Key>) => segments.find(({ key }) => key !== current && keys.has(key))?.onSelect();

  return (
    <ToggleButtonGroup
      className="seg"
      aria-label={label}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[current]}
      onSelectionChange={select}
    >
      {segments.map(({ key, label: text, count, disabled }) => (
        <ToggleButton key={key} id={key} isDisabled={disabled ?? false}>
          {text}
          <Count count={count} />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
