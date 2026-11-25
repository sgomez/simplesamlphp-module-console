import { useRef } from 'react';
import { useSwitch } from 'react-aria';
import { useToggleState } from 'react-stately';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, checked, onChange }: SwitchProps) {
  const ref = useRef<HTMLInputElement>(null);
  const aria = { 'aria-label': label, isSelected: checked, onChange };
  const { labelProps, inputProps } = useSwitch(aria, useToggleState(aria), ref);

  return (
    <label className="switch-field" {...labelProps}>
      <input className="switch" {...inputProps} ref={ref} />
      <span>{checked ? 'On' : 'Off'}</span>
    </label>
  );
}
