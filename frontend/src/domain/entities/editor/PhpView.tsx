import { useEffect, useRef } from 'react';
import type { EditorHandle } from '../../../design-system/Editor';
import type { SchemaOption } from '../../documents';
import { lineMarks, type Mark } from './marks';
import { Marks } from './Marks';
import { OptionsPanel } from './OptionsPanel';
import { PhpCard } from './PhpCard';
import { insertOption, replaceKey } from './phpText';

interface PhpViewProps {
  text: string;
  marks: readonly Mark[];
  busy: boolean;
  onChange: (text: string) => void;
}

// SPEC 10.11: the marks, the editor and the Options panel.
export function PhpView({ text, marks, busy, onChange }: PhpViewProps) {
  const editor = useRef<EditorHandle>(null);
  const cursor = useRef<number | null>(null);

  useEffect(() => {
    if (cursor.current !== null) {
      editor.current?.focusAt(cursor.current);
      cursor.current = null;
    }
  }, [text]);

  const insert = (option: SchemaOption) => {
    const next = insertOption(text, editor.current?.cursor() ?? text.length, option);
    cursor.current = next.at;
    onChange(next.text);
  };

  return (
    <div className="cols">
      <div className="col-main">
        <Marks
          marks={marks}
          onLine={(line) => editor.current?.goToLine(line)}
          onSuggest={(line, from, to) => onChange(replaceKey(text, line, from, to))}
        />
        <PhpCard value={text} marks={lineMarks(marks)} editor={editor} busy={busy} onChange={onChange} />
      </div>
      <OptionsPanel text={text} onInsert={insert} />
    </div>
  );
}
