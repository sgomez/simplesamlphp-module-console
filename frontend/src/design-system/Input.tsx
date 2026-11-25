import { Input as AriaInput } from 'react-aria-components';
import { cx } from './classes';
import { defined } from './props';

interface InputProps {
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
  const { name, type = 'text', value, defaultValue, placeholder, label, mono, invalid, disabled, onChange } = props;

  return (
    <AriaInput
      type={type}
      className={cx('input', mono && 'mono')}
      {...defined({
        name,
        value,
        defaultValue,
        placeholder,
        disabled,
        'aria-label': label,
        'aria-invalid': invalid || undefined,
        onChange: onChange && ((event: { target: { value: string } }) => onChange(event.target.value)),
      })}
    />
  );
}
