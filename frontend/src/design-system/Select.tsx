interface SelectProps {
  id?: string;
  label?: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}

export function Select({ id, label, value, options, onChange }: SelectProps) {
  return (
    <select id={id} className="input" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}
