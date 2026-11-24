interface CheckProps {
  label: string;
  checked: boolean;
  type?: 'checkbox' | 'radio';
  name?: string;
  onChange: (checked: boolean) => void;
}

export function Check({ label, checked, type = 'checkbox', name, onChange }: CheckProps) {
  return (
    <label className="check-field">
      <input
        className="check"
        type={type}
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
