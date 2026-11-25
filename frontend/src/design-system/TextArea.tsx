import { TextArea as AriaTextArea } from 'react-aria-components';
import { cx } from './classes';
import { defined } from './props';

interface TextAreaProps {
  label?: string;
  value?: string;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
}

export function TextArea({ label, value, rows = 2, placeholder, mono, invalid, onChange }: TextAreaProps) {
  return (
    <AriaTextArea
      className={cx('input', mono && 'mono')}
      rows={rows}
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
