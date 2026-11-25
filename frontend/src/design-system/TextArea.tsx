import { TextArea as AriaTextArea } from 'react-aria-components';
import { cx } from './classes';
import { defined } from './props';

interface TextAreaProps {
  label?: string;
  value?: string;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
  // Configuration text: monospace, lines kept whole, no spell check.
  code?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
}

export function TextArea({ label, value, rows = 2, placeholder, mono, code, invalid, onChange }: TextAreaProps) {
  return (
    <AriaTextArea
      className={cx('input', (mono || code) && 'mono', code && 'input-code')}
      rows={rows}
      {...(code ? { spellCheck: false, wrap: 'off' } : {})}
      {...defined({
        value,
        placeholder,
        'aria-label': label,
        'aria-invalid': invalid || undefined,
        onChange: onChange && ((event: { target: { value: string } }) => onChange(event.target.value)),
      })}
    />
  );
}
