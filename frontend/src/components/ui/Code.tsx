import type { ReactNode } from 'react';
import { Button } from './Button';

export type TokenKind = 's' | 'k' | 'n' | 'c';

export function Token({ kind, children }: { kind: TokenKind; children: string }) {
  return <span className={`tk-${kind}`}>{children}</span>;
}

interface CodeProps {
  label: string;
  text: string;
  children?: ReactNode;
}

export function Code({ label, text, children }: CodeProps) {
  return (
    <div className="code-block">
      <div className="code-head">
        <span className="xs muted code-label">{label}</span>
        <Button variant="quiet" small onClick={() => void navigator.clipboard.writeText(text)}>
          Copy
        </Button>
      </div>
      <pre className="code">{children ?? text}</pre>
    </div>
  );
}
