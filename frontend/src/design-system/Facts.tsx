import { Fragment, type ReactNode } from 'react';

export interface Fact {
  term: string;
  value: ReactNode;
  // Of the value: is-strong, mono.
  className?: string;
}

export function Facts({ facts }: { facts: readonly Fact[] }) {
  return (
    <dl className="facts">
      {facts.map(({ term, value, className }) => (
        <Fragment key={term}>
          <dt className="muted">{term}</dt>
          <dd className={className}>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
