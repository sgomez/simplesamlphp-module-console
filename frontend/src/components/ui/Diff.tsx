export type DiffKind = 'same' | 'add' | 'del' | 'sec';

export interface DiffLine {
  kind: DiffKind;
  text: string;
}

const signs: Record<DiffKind, string> = { same: '', add: '+', del: '-', sec: '~' };

export function Diff({ lines }: { lines: readonly DiffLine[] }) {
  return (
    <div className="diff">
      {lines.map(({ kind, text }, index) => (
        <div key={index} className={kind === 'same' ? 'dl' : `dl dl-${kind}`}>
          <span className="ds">{signs[kind]}</span>
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}
