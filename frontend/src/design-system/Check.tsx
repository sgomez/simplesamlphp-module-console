import { useRef } from 'react';
import { useCheckbox } from 'react-aria';
import { useToggleState } from 'react-stately';

interface CheckProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Check({ label, checked, onChange }: CheckProps) {
  const ref = useRef<HTMLInputElement>(null);
  const aria = { children: label, isSelected: checked, onChange };
  const { labelProps, inputProps } = useCheckbox(aria, useToggleState(aria), ref);

  return (
    <label className="check-field" {...labelProps}>
      <input className="check" {...inputProps} ref={ref} />
      <span>{label}</span>
    </label>
  );
}
