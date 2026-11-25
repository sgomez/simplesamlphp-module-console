import { cx } from './classes';

interface TextAreaProps {
  id?: string;
  label?: string;
  value: string;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
}

export function TextArea({ id, label, value, rows = 2, placeholder, mono, invalid, onChange }: TextAreaProps) {
  return (
    <textarea
      id={id}
      className={cx('input', mono && 'mono', invalid && 'is-error')}
      aria-label={label}
      aria-invalid={invalid || undefined}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
