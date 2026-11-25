import { useImperativeHandle, useRef, type Ref } from 'react';
import { TextArea } from 'react-aria-components';
import { cx } from './classes';

export type LineMark = 'err' | 'warn';

const markers: Record<LineMark, string> = { err: '×', warn: '!' };

export interface EditorHandle {
  goToLine: (line: number) => void;
}

interface EditorProps {
  label: string;
  value: string;
  marks?: Readonly<Record<number, LineMark>>;
  ref?: Ref<EditorHandle>;
  // Read-only while the text is being saved.
  busy?: boolean;
  onChange: (value: string) => void;
}

export function Editor({ label, value, marks = {}, ref, busy, onChange }: EditorProps) {
  const lines = value.split('\n').map((_, index) => ({ number: index + 1, mark: marks[index + 1] }));
  const text = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    goToLine(line: number) {
      const area = text.current;
      if (area === null) {
        return;
      }
      const start = area.value.split('\n').slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
      area.focus();
      area.setSelectionRange(start, start);
      gutter.current?.children[line - 1]?.scrollIntoView?.({ block: 'center' });
    },
  }));

  return (
    <div className="ed">
      <div className="ed-gutter" aria-hidden="true" ref={gutter}>
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
        <TextArea
          ref={text}
          className="ed-text"
          aria-label={label}
          rows={lines.length}
          spellCheck={false}
          wrap="off"
          readOnly={busy}
          aria-busy={busy || undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}
