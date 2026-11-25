import type { ReactNode } from 'react';

interface DisclosureProps {
  summary: string;
  // A card of its own, as the warnings on Publish, rather than a fold inside another surface.
  card?: boolean;
  children: ReactNode;
}

export function Disclosure({ summary, card, children }: DisclosureProps) {
  return card ? (
    <details className="grp card">
      <summary>
        <span className="row-name">{summary}</span>
      </summary>
      <div className="grp-body">{children}</div>
    </details>
  ) : (
    <details className="grp">
      <summary>
        <span className="small">{summary}</span>
      </summary>
      {children}
    </details>
  );
}
