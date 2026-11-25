import { createContext, useContext, useRef } from 'react';
import { useRadio, useRadioGroup } from 'react-aria';
import { useRadioGroupState, type RadioGroupState } from 'react-stately';

const GroupState = createContext<RadioGroupState | null>(null);

function Radio({ value, label }: { value: string; label: string }) {
  const state = useContext(GroupState) as RadioGroupState;
  const ref = useRef<HTMLInputElement>(null);
  const { labelProps, inputProps } = useRadio({ value, children: label }, state, ref);

  return (
    <label className="check-field" {...labelProps}>
      <input className="check" {...inputProps} ref={ref} />
      <span>{label}</span>
    </label>
  );
}

interface RadiosProps {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  // Named by a label beside the group rather than above it.
  labelHidden?: boolean;
  onChange: (value: string) => void;
}

export function Radios({ label, value, options, labelHidden, onChange }: RadiosProps) {
  const aria = { label, value, onChange };
  const state = useRadioGroupState(aria);
  const { radioGroupProps, labelProps } = useRadioGroup(aria, state);

  return (
    <div className="field" {...radioGroupProps}>
      <span className={labelHidden ? 'sr-only' : 'label'} {...labelProps}>
        {label}
      </span>
      <GroupState value={state}>
        {options.map((option) => (
          <Radio key={option.value} {...option} />
        ))}
      </GroupState>
    </div>
  );
}
