import { cx } from './classes';

export type LineMark = 'err' | 'warn';

const markers: Record<LineMark, string> = { err: '×', warn: '!' };

interface EditorProps {
  label: string;
  value: string;
  marks?: Readonly<Record<number, LineMark>>;
  onChange: (value: string) => void;
}

export function Editor({ label, value, marks = {}, onChange }: EditorProps) {
  const lines = value.split('\n').map((_, index) => ({ number: index + 1, mark: marks[index + 1] }));

  return (
    <div className="ed">
      <div className="ed-gutter" aria-hidden="true">
        {lines.map(({ number, mark }) => (
          <div key={number} className={cx('ed-ln', mark)}>
            <span>{mark ? markers[mark] : ''}</span>
            <span>{number}</span>
          </div>
        ))}
      </div>
      <div className="ed-body">
        <div className="ed-bg" aria-hidden="true">
          {lines.map(({ number, mark }) => (
            <div key={number} className={mark} />
          ))}
        </div>
        <textarea
          className="ed-text"
          aria-label={label}
          rows={lines.length}
          spellCheck={false}
          wrap="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}
