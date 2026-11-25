import { useState } from 'react';
import { ErrorIcon } from '../../../design-system/icons';
import { TextArea } from '../../../design-system/TextArea';
import { same } from '../engine/document';
import { useInvalid } from '../context';
import type { ControlProps } from './props';

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

function parse(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

// A value edited as JSON text; the document changes only while the text parses.
export function JsonControl({ value, pointer, label, onChange }: ControlProps) {
  const invalid = useInvalid(pointer);
  const [draft, setDraft] = useState(() => pretty(value));
  const parsed = parse(draft);
  const text = parsed.ok && !same(parsed.value, value) ? pretty(value) : draft;

  const change = (typed: string) => {
    setDraft(typed);
    const next = parse(typed);
    if (next.ok) {
      onChange(next.value);
    }
  };

  return (
    <>
      <TextArea label={label} mono rows={6} value={text} invalid={invalid || !parsed.ok} onChange={change} />
      {!parsed.ok && (
        <div className="msg-error">
          <ErrorIcon />
          <span>The text is not valid JSON.</span>
        </div>
      )}
    </>
  );
}
