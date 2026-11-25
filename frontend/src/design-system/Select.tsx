export type SelectOption = string | { value: string; label: string };

interface SelectProps {
  id?: string;
  label?: string;
  value: string;
  options: readonly SelectOption[];
  // An empty first choice, for a value not chosen yet.
  empty?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
}

const valueOf = (option: SelectOption) => (typeof option === 'string' ? option : option.value);
const labelOf = (option: SelectOption) => (typeof option === 'string' ? option : option.label);

export function Select({ id, label, value, options, empty, invalid, onChange }: SelectProps) {
  return (
    <select
      id={id}
      className="input"
      aria-label={label}
      aria-invalid={invalid || undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {empty && <option value="" />}
      {options.map((option) => (
        <option key={valueOf(option)} value={valueOf(option)}>
          {labelOf(option)}
        </option>
      ))}
    </select>
  );
}
