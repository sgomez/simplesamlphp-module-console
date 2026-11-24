import { cx } from './classes';

interface InputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'search' | 'password' | 'url';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  mono?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export function Input(props: InputProps) {
  const { id, name, type = 'text', value, defaultValue, placeholder, label, mono, invalid, disabled, onChange } = props;

  return (
    <input
      id={id}
      name={name}
      type={type}
      className={cx('input', mono && 'mono', invalid && 'is-error')}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      aria-label={label}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      onChange={onChange && ((event) => onChange(event.target.value))}
    />
  );
}
