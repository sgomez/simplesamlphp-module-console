import type { ReactNode } from 'react';

export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="grp">
      <summary>
        <span className="small">{summary}</span>
      </summary>
      {children}
    </details>
  );
}
