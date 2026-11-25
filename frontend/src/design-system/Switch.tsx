import { useRef } from 'react';
import { useSwitch } from 'react-aria';
import { useToggleState } from 'react-stately';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  // The label shows beside the switch in place of On and Off.
  labelled?: boolean;
}

export function Switch({ label, checked, onChange, labelled }: SwitchProps) {
  const ref = useRef<HTMLInputElement>(null);
  const aria = { 'aria-label': label, isSelected: checked, onChange };
  const { labelProps, inputProps } = useSwitch(aria, useToggleState(aria), ref);

  return (
    <label className="switch-field" {...labelProps}>
      <input className="switch" {...inputProps} ref={ref} />
      <span>{labelled ? label : checked ? 'On' : 'Off'}</span>
    </label>
  );
}
