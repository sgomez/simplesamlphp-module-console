import { useId } from 'react';
import { Input as AriaInput } from 'react-aria-components';
import { cx } from './classes';
import { defined } from './props';

interface InputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'search' | 'password' | 'url' | 'date' | 'number';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  mono?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  // Offered as the user types; free text is still accepted.
  suggestions?: readonly string[];
  onChange?: (value: string) => void;
}

export function Input(props: InputProps) {
  const { id, name, type = 'text', value, defaultValue, placeholder, label, mono, invalid, disabled, suggestions, onChange } = props;
  const list = useId();
  const offered = suggestions !== undefined && suggestions.length > 0;

  return (
    <>
      <AriaInput
        type={type}
        className={cx('input', mono && 'mono')}
        {...defined({
          id,
          name,
          value,
          defaultValue,
          placeholder,
          disabled,
          list: offered ? list : undefined,
          'aria-label': label,
          'aria-invalid': invalid || undefined,
          onChange: onChange && ((event: { target: { value: string } }) => onChange(event.target.value)),
        })}
      />
      {offered && (
        <datalist id={list}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      )}
    </>
  );
}
