import { useRef } from 'react';
import { useCheckbox } from 'react-aria';
import { useToggleState } from 'react-stately';

interface CheckProps {
  label: string;
  checked: boolean;
  // The label is read, not shown, where the row beside it names the object.
  hideLabel?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function Check({ label, checked, hideLabel, disabled = false, onChange }: CheckProps) {
  const ref = useRef<HTMLInputElement>(null);
  const aria = { children: label, isSelected: checked, isDisabled: disabled, onChange };
  const { labelProps, inputProps } = useCheckbox(aria, useToggleState(aria), ref);

  return (
    <label className="check-field" {...labelProps}>
      <input className="check" {...inputProps} ref={ref} />
      <span className={hideLabel ? 'sr-only' : undefined}>{label}</span>
    </label>
  );
}
