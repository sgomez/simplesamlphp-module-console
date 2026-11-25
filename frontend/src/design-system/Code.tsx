import type { ReactNode } from 'react';

// A block of text that keeps its lines and scrolls; focusable so the keyboard can scroll it.
export function Pre({ label, children }: { label: string; children: ReactNode }) {
  return (
    <pre className="code" tabIndex={0} aria-label={label}>
      {children}
    </pre>
  );
}
